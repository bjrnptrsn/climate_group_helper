"""Preset management for Climate Group Helper."""

from __future__ import annotations

from dataclasses import replace
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import (
    ATTR_PRESET_MODE,
    ATTR_PRESET_MODES,
    PRESET_NONE,
)
from homeassistant.exceptions import ServiceValidationError

from .const import PRESET_META_KEYS
from .meta_processor import SOURCE_PRESET
from .payload import (
    parse_fallback_payload,
    split_payload,
    validate_climate_payload,
)
from .service_call import SYNC_TARGET, SyncTarget

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


class PresetManager:
    """Manages virtual group presets and their payload mappings."""

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the PresetManager."""
        self._group = group
        self._config_presets: dict[str, dict[str, Any]] = {}
        self._runtime_presets: dict[str, dict[str, Any]] = {}
        # Meta-keys per preset, kept apart from the climate payloads on purpose:
        # `group_presets` feeds resolve_preset(), the exit rules and the entity
        # attributes, all of which deal in climate attributes only. Mixing the
        # two would put a meta-key into a service call.
        self._config_meta: dict[str, dict[str, Any]] = {}
        self._runtime_meta: dict[str, dict[str, Any]] = {}

    @property
    def group_presets(self) -> dict[str, dict[str, Any]]:
        """Return merged view of configured presets and runtime overrides."""
        return {**self._config_presets, **self._runtime_presets}

    def meta_payload(self, name: str | None) -> dict[str, Any]:
        """Return the meta-keys a preset carries (empty if it has none)."""
        if not name:
            return {}
        merged = {**self._config_meta, **self._runtime_meta}
        return merged.get(name, {})

    def sync_meta_claims(self) -> None:
        """Hand the active preset's meta-keys to the ownership registry.

        Called after `active_virtual_preset` changed. The registry diffs against
        what the preset source claimed before, so activation, switching and exit
        all come down to this one call: an exited preset simply names nothing.

        A background task because the registry's apply/release fire manager calls
        (a preset may suspend the window block), while both callers are
        synchronous — `BaseStateManager._resolve_group_preset()` and the runtime
        removal path below.
        """
        values = self.meta_payload(self._group.run_state.active_virtual_preset)
        self._group.hass.async_create_background_task(
            self._group.slot_meta_processor.apply_source(SOURCE_PRESET, values),
            name="climate_group_preset_meta_claims",
        )

    @property
    def runtime_presets(self) -> dict[str, dict[str, Any]]:
        """Return currently active runtime presets."""
        return dict(self._runtime_presets)

    @property
    def persisted_runtime_presets(self) -> dict[str, dict[str, Any]]:
        """Return runtime presets in the shape the service accepts them in.

        The two halves are stored apart at runtime, but they have to be
        persisted together: restoring only the climate payload brings a preset
        back by name with its suspensions silently gone — the group would report
        "party" while the window it claims to suspend switches it off again.

        Merging them here rather than persisting two attributes keeps the stored
        shape identical to the service payload, so `restore_runtime_presets()`
        can split it with the very same code that wrote it.
        """
        return {
            name: {**payload, **self._runtime_meta.get(name, {})}
            for name, payload in self._runtime_presets.items()
        }

    def update_config(self, raw_yaml: Any) -> None:
        """Parse and update configured group presets from YAML or dict.

        Invalid individual entries are logged and discarded, leaving valid
        entries intact. Recursion protection discards any preset/preset_mode keys.
        Runtime presets are preserved across config updates.
        """
        self._config_presets = {}
        self._config_meta = {}
        if not raw_yaml:
            return

        parsed = parse_fallback_payload(
            raw_yaml, entity_id=self._group.log_id, context="Group presets"
        )
        if not isinstance(parsed, dict):
            return

        for preset_name, payload in parsed.items():
            if not isinstance(preset_name, str) or not preset_name.strip():
                _LOGGER.warning(
                    "[%s] Preset name must be a non-empty string, got %r — ignored.",
                    self._group.log_id,
                    preset_name,
                )
                continue

            if not isinstance(payload, dict):
                _LOGGER.warning(
                    "[%s] Preset '%s' payload must be a mapping, got %s — ignored.",
                    self._group.log_id,
                    preset_name,
                    type(payload).__name__,
                )
                continue

            climate_data, meta_data = self._split_preset_payload(
                preset_name, payload, context=f"Group preset '{preset_name}'"
            )

            # A payload that *had* attributes but validates to nothing is a
            # typo, and registering it produces a preset that is selectable,
            # applies nothing, and can never be exited again — the exit rules
            # compare against the preset's own attributes, of which it has none.
            # An intentionally empty payload (`name: {}`) is a different thing:
            # a marker preset, whose whole purpose is to carry only a name.
            #
            # A preset carrying only meta-keys is usable and stays: it applies
            # something (the suspensions) and is exited by selecting another
            # preset. Only the climate half feeds the attribute-based exit rule.
            if payload and not climate_data and not meta_data:
                _LOGGER.warning(
                    "[%s] Preset '%s' has no usable attributes — ignored.",
                    self._group.log_id,
                    preset_name,
                )
                continue

            self._config_presets[preset_name] = climate_data
            if meta_data:
                self._config_meta[preset_name] = meta_data
            _LOGGER.debug(
                "[%s] Registered group preset '%s' with payload: %s",
                self._group.log_id,
                preset_name,
                climate_data,
            )

    def _split_preset_payload(
        self, preset_name: str, payload: dict[str, Any], context: str
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """Split a preset definition into its climate payload and its meta-keys.

        A preset may carry the same feature bypasses a schedule slot can, so a
        manually chosen "party" or "holiday" brings its own suspensions along.
        `turn_off` is deliberately not among them: presets set climate targets,
        and the master switch stays out of their reach (a preset carrying it
        could not be exited by an attribute change either — it has no attribute).
        """
        climate_data = self._build_preset_payload(preset_name, payload, context)

        meta_candidates = {
            key: value
            for key, value in payload.items()
            if key in PRESET_META_KEYS
        }
        if not meta_candidates:
            return climate_data, {}

        # Validation lives on the meta-processor so a preset and a slot accept
        # exactly the same values. The isinstance guard keeps a non-dict return
        # from ever counting as content: "did this preset yield anything usable"
        # decides whether a typo-only definition is dropped, and a preset that
        # slipped through would be selectable, apply nothing, and never exit.
        meta_data = self._group.slot_meta_processor.validate_values(
            meta_candidates, context=context
        )
        return climate_data, meta_data if isinstance(meta_data, dict) else {}

    def _build_preset_payload(
        self, preset_name: str, payload: dict[str, Any], context: str
    ) -> dict[str, Any]:
        """Strip recursive preset keys, validate, and extract climate attributes.

        Shared by both write paths (options and runtime service) so the checks
        cannot drift between them. Every warning emitted here is the user's only
        signal that part of a definition was dropped — which is exactly why they
        must not exist in two copies.

        Returns the climate payload — possibly empty. An empty result means
        different things depending on the *input*: a payload that was empty to
        begin with (`name: {}`) is a deliberate marker preset, while one that
        carried attributes and validated to nothing is a typo. `update_config()`
        keeps the former and drops the latter (a preset with no attributes can
        never be exited, since the exit rules compare against its own keys); the
        service rejects an empty payload outright, where it means deletion.
        """
        # Recursion protection: a preset payload must not reference another
        # preset. The name is the top-level YAML key, never part of the value,
        # so these keys can only be a mistake.
        if ATTR_PRESET_MODE in payload or "preset" in payload:
            _LOGGER.warning(
                "[%s] Preset '%s' contains preset/preset_mode key — recursive preset references are not allowed and were ignored.",
                self._group.log_id,
                preset_name,
            )
            payload = {key: value for key, value in payload.items() if key not in (ATTR_PRESET_MODE, "preset")}

        valid = validate_climate_payload(self._group.log_id, payload, context=context)
        climate_data, _ = split_payload(valid)

        # `validate_climate_payload` only warns about attributes it *knows* but
        # whose value is unusable — a misspelled name it has never heard of
        # passes it untouched and is then silently dropped by the extract filter.
        # Anything left over that is not an allowed meta-key is such a typo, and
        # the user gets told; the meta-keys are handled by the caller.
        if dropped := sorted(set(valid) - set(climate_data) - PRESET_META_KEYS):
            _LOGGER.warning(
                "[%s] %s: unknown attribute(s) %s — ignored. Check the spelling.",
                self._group.log_id,
                context,
                ", ".join(f"'{attr}'" for attr in dropped),
            )

        return climate_data

    async def async_update_runtime_presets(self, raw_payload: Any = None) -> None:
        """Set, update, or clear runtime group presets.

        Re-applies the active preset when its own definition changed, so a
        dashboard slider writing into the selected preset takes effect at once
        instead of waiting for the next preset or slot change.

        Takes the SAME shape as the options field — a mapping of preset name to
        its climate attributes — so a definition can be moved between the two
        without reshaping it:

            party:
              temperature: 23.0
            guest:
              temperature: 21.0

        Only the names present in the mapping are touched; every other runtime
        preset stays as it is. A name mapped to an empty value removes that one
        preset, and an empty payload clears all of them — the same "empty takes
        it back" rule as the schedule fallback, applied per key. Removing a
        runtime preset reveals a config preset of the same name again; config
        presets themselves are never removable from here.

        All-or-nothing: a payload whose second of three entries is invalid
        changes nothing at all, so a caller never has to work out how far a
        failed call got.
        """
        active_before = self._group.run_state.active_virtual_preset

        # Empty payload = clear everything: the same as naming every preset with
        # an empty value, so it runs through the very same removal path.
        if not raw_payload or (isinstance(raw_payload, str) and not raw_payload.strip()):
            parsed: dict[str, Any] = dict.fromkeys(self._runtime_presets)
        else:
            if not isinstance(raw_payload, (dict, str)):
                raise ServiceValidationError("Payload must be a mapping or valid YAML string.")
            parsed = parse_fallback_payload(
                raw_payload,
                entity_id=self._group.entity_id,
                context="Runtime group presets",
            )
            if not isinstance(parsed, dict) or not parsed:
                raise ServiceValidationError("Payload must be a non-empty mapping or valid YAML mapping.")

        # Member capabilities do not change while this runs — collect once.
        native_modes = self._get_native_member_preset_modes()

        # Validate every entry before writing the first one, so a rejected call
        # leaves the runtime presets exactly as they were.
        to_write: dict[str, dict[str, Any]] = {}
        to_write_meta: dict[str, dict[str, Any]] = {}
        to_remove: list[str] = []

        for raw_name, payload in parsed.items():
            if not isinstance(raw_name, str) or not raw_name.strip():
                raise ServiceValidationError(f"Preset name must be a non-empty string, got {raw_name!r}.")

            preset_name = raw_name.strip()

            # Only None, an empty string, and an empty mapping express
            # deletion. A falsy but non-empty value (0, False, []) is an
            # invalid payload, not a deletion request — `if not payload`
            # would silently remove the preset on a YAML typo like `party: 0`.
            if payload in (None, "", {}):
                to_remove.append(preset_name)
                continue

            if not isinstance(payload, dict):
                raise ServiceValidationError(
                    f"Preset '{preset_name}' must map to climate attributes, got {type(payload).__name__}."
                )

            climate_data, meta_data = self._split_preset_payload(
                preset_name, payload, context=f"Runtime group preset '{preset_name}'"
            )
            # Stricter than the options path: a service call that produces nothing
            # usable is a caller error and must fail loudly, whereas an unusable
            # options entry stays visible in the form for the user to correct.
            # A meta-key-only preset is usable — it applies its suspensions.
            if not climate_data and not meta_data:
                raise ServiceValidationError(
                    f"Preset '{preset_name}' contains no valid climate attributes."
                )

            # Non-blocking notice: a runtime preset may deliberately shadow a
            # native member preset mode of the same name.
            if preset_name in native_modes:
                _LOGGER.warning(
                    "[%s] Runtime group preset '%s' matches a native member preset mode and will shadow it.",
                    self._group.entity_id,
                    preset_name,
                )

            to_write[preset_name] = climate_data
            to_write_meta[preset_name] = meta_data

        # From here on nothing can fail.
        for preset_name in to_remove:
            self._remove_runtime_preset(preset_name)

        for preset_name, climate_data in to_write.items():
            self._runtime_presets[preset_name] = climate_data
            # Written unconditionally, including the empty case: a redefinition
            # that drops the meta-keys must not leave the previous ones behind.
            self._runtime_meta[preset_name] = to_write_meta[preset_name]
            _LOGGER.info(
                "[%s] Registered runtime group preset '%s'", self._group.entity_id, preset_name
            )

        # Re-sync the claims against the definitions as they stand now, before
        # the re-apply. The registry reads the active preset's current meta-keys,
        # so this one call covers every way this method can have changed them:
        # the active preset removed, redefined with different keys, or with none
        # at all. It cannot be left to `_resolve_group_preset()` — that sits
        # behind the blocking filter, so during a window or switch block the
        # re-apply below never reaches it and a removed definition's suspensions
        # would outlive it until the user picked a preset by hand again.
        if active_before is not None and active_before in set(to_remove) | set(to_write):
            self.sync_meta_claims()

        await self._async_reapply_if_active(active_before, set(to_remove) | set(to_write))

        self._group.async_defer_or_update_ha_state()

    async def _async_reapply_if_active(self, active_before: str | None, touched: set[str]) -> None:
        """Re-apply the active preset if this call changed its own definition.

        Routed through `async_set_preset_mode()` rather than writing
        `target_state`: the blocking filter must still get its say, and carrying
        the name along stops the exit rule from deselecting the preset being
        refreshed.
        """
        if (
            active_before is not None
            and active_before in touched
            and self._group.run_state.active_virtual_preset == active_before
        ):
            await self._group.async_set_preset_mode(active_before)

    def _remove_runtime_preset(self, preset_name: str) -> None:
        """Drop one runtime preset, releasing it if it was the active one.

        A config preset of the same name becomes visible again — the name stays
        valid then, so the active preset is only released when nothing is left
        to fall back to.
        """
        if self._runtime_presets.pop(preset_name, None) is None:
            return
        self._runtime_meta.pop(preset_name, None)

        _LOGGER.info("[%s] Cleared runtime group preset '%s'", self._group.entity_id, preset_name)

        if (
            self._group.run_state.active_virtual_preset == preset_name
            and preset_name not in self._config_presets
        ):
            self._group.run_state = replace(self._group.run_state, active_virtual_preset=None)
            # The meta-key claims are not released here: the caller re-syncs them
            # for every touched definition, which also covers the paths this
            # method never reaches (a surviving config preset of the same name,
            # a redefinition rather than a removal). The target already carries
            # the native expectation (`PRESET_NONE`), never the virtual name.

    def restore_runtime_presets(self, presets: dict[str, dict[str, Any]]) -> None:
        """Restore runtime presets from persisted state.

        The persisted shape carries both halves in one mapping (see
        `persisted_runtime_presets`), so each one is split again on the way in —
        through the same code the write paths use, which also drops anything an
        older stored payload carried that is no longer valid.
        """
        self._runtime_presets = {}
        self._runtime_meta = {}
        for name, payload in presets.items():
            climate_data, meta_data = self._split_preset_payload(
                name, payload, context=f"Restored runtime group preset '{name}'"
            )
            self._runtime_presets[name] = climate_data
            self._runtime_meta[name] = meta_data

    def _get_native_member_preset_modes(self) -> set[str]:
        """Collect native preset modes supported by members."""
        modes: set[str] = set()
        for state in self._group.aggregator.capability_states:
            if member_modes := state.attributes.get(ATTR_PRESET_MODES):
                if isinstance(member_modes, list):
                    modes.update(member_modes)
        return modes

    def is_virtual(self, name: str | None) -> bool:
        """Return True if name is a configured virtual group preset."""
        return bool(name and name in self.group_presets)

    def get_payload(self, name: str | None) -> dict[str, Any] | None:
        """Return the payload for a virtual preset, or None if not found."""
        return self.group_presets.get(name) if name else None

    def resolve_preset(
        self, payload: dict[str, Any] | SyncTarget
    ) -> dict[str, Any] | SyncTarget:
        """Resolve a payload containing preset_mode into concrete climate attributes.

        Merges only — activation is owned by `BaseStateManager._resolve_group_preset()`,
        which sits behind the blocking filter. Callers must not read activation
        from here.
        """
        if payload is SYNC_TARGET or not payload:
            return payload

        preset_name = payload.get(ATTR_PRESET_MODE)
        if self.is_virtual(preset_name):
            preset_payload = self.group_presets[preset_name]  # type: ignore[index]
            return {**payload, **preset_payload}
        return payload

    def get_preset_modes(self, native_modes: list[str]) -> list[str]:
        """Return union of native member preset modes and configured group presets.

        A defined group preset adds `PRESET_NONE`: HA Core validates
        `set_preset_mode` against this list, so without it a virtual preset could
        be selected but never deselected. Native-only groups get no such entry —
        a member that does not announce `none` cannot honour it anyway.
        """
        modes = set(native_modes) | set(self.group_presets.keys())
        if self.group_presets:
            modes.add(PRESET_NONE)
        return sorted(modes)
