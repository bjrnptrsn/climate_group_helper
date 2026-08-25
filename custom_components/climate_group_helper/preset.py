"""Preset management for Climate Group Helper."""

from __future__ import annotations

from dataclasses import replace
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import ATTR_PRESET_MODE, ATTR_PRESET_MODES
from homeassistant.exceptions import ServiceValidationError

from .payload import (
    extract_climate_payload,
    parse_fallback_payload,
    validate_climate_payload,
)

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

    @property
    def group_presets(self) -> dict[str, dict[str, Any]]:
        """Return merged view of configured presets and runtime overrides."""
        return {**self._config_presets, **self._runtime_presets}

    @property
    def runtime_presets(self) -> dict[str, dict[str, Any]]:
        """Return currently active runtime presets."""
        return dict(self._runtime_presets)

    def update_config(self, raw_yaml: Any) -> None:
        """Parse and update configured group presets from YAML or dict.

        Invalid individual entries are logged and discarded, leaving valid
        entries intact. Recursion protection discards any preset/preset_mode keys.
        Runtime presets are preserved across config updates.
        """
        self._config_presets = {}
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

            climate_data = self._build_preset_payload(
                preset_name, payload, context=f"Group preset '{preset_name}'"
            )

            # A payload that *had* attributes but validates to nothing is a
            # typo, and registering it produces a preset that is selectable,
            # applies nothing, and can never be exited again — the exit rules
            # compare against the preset's own attributes, of which it has none.
            # An intentionally empty payload (`name: {}`) is a different thing:
            # a marker preset, whose whole purpose is to carry only a name.
            if payload and not climate_data:
                _LOGGER.warning(
                    "[%s] Preset '%s' has no usable attributes — ignored.",
                    self._group.log_id,
                    preset_name,
                )
                continue

            self._config_presets[preset_name] = climate_data
            _LOGGER.debug(
                "[%s] Registered group preset '%s' with payload: %s",
                self._group.log_id,
                preset_name,
                climate_data,
            )

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
            payload = {k: v for k, v in payload.items() if k not in (ATTR_PRESET_MODE, "preset")}

        valid = validate_climate_payload(self._group.log_id, payload, context=context)
        climate_data = extract_climate_payload(valid)

        # `validate_climate_payload` only warns about attributes it *knows* but
        # whose value is unusable — a misspelled name it has never heard of
        # passes it untouched and is then silently dropped by the extract filter.
        # A preset has no legitimate use for non-climate keys (meta-keys belong
        # to schedule slots, which use the same filter for exactly that reason),
        # so anything left over here is a typo and the user gets told.
        if dropped := sorted(set(valid) - set(climate_data)):
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

            climate_data = self._build_preset_payload(
                preset_name, payload, context=f"Runtime group preset '{preset_name}'"
            )
            # Stricter than the options path: a service call that produces nothing
            # usable is a caller error and must fail loudly, whereas an unusable
            # options entry stays visible in the form for the user to correct.
            if not climate_data:
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

        # From here on nothing can fail.
        for preset_name in to_remove:
            self._remove_runtime_preset(preset_name)

        for preset_name, climate_data in to_write.items():
            self._runtime_presets[preset_name] = climate_data
            _LOGGER.info(
                "[%s] Registered runtime group preset '%s'", self._group.entity_id, preset_name
            )

        await self._async_reapply_if_active(active_before, set(to_remove) | set(to_write))

        self._group.async_defer_or_update_ha_state()

    async def _async_reapply_if_active(self, active_before: str | None, touched: set[str]) -> None:
        """Re-apply the active preset if this call changed its own definition.

        Only the active preset's *own* definition may drive a new command — an
        update to some other preset must leave the group untouched.

        The `active_virtual_preset` check also covers removal: dropping the
        active preset releases the name in `_remove_runtime_preset()`, so the
        comparison fails and nothing is applied. If a config preset of the same
        name survives, the name stays active and its values are applied here —
        which is exactly right, the group must not keep the removed runtime
        values.

        Routed through `async_set_preset_mode()` rather than writing
        `target_state` directly: the blocking/partial-sync filter must still get
        its say, and passing the name along keeps the payload-attribute exit
        rule from deselecting the very preset being refreshed.
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

        _LOGGER.info("[%s] Cleared runtime group preset '%s'", self._group.entity_id, preset_name)

        if (
            self._group.run_state.active_virtual_preset == preset_name
            and preset_name not in self._config_presets
        ):
            self._group.run_state = replace(self._group.run_state, active_virtual_preset=None)
            if self._group.shared_target_state.preset_mode == preset_name:
                self._group.shared_target_state = self._group.shared_target_state.update(preset_mode=None)

    def restore_runtime_presets(self, presets: dict[str, dict[str, Any]]) -> None:
        """Restore runtime presets from persisted state."""
        self._runtime_presets = dict(presets)

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

    def resolve_preset(self, payload: dict[str, Any] | None) -> dict[str, Any] | None:
        """Resolve a payload containing preset_mode into concrete climate attributes.

        If preset_mode is a known virtual preset, its attributes are overlaid on payload.
        Merge direction: {**payload, **preset_payload} — preset values overlay payload.

        An empty payload passes through unchanged: the service-call handlers use
        `None` for "no data", and a preset can only be resolved from a name that
        such a payload does not carry.

        Callers must not infer preset *activation* from this method — it only
        merges attributes. `run_state.active_virtual_preset` is owned solely by
        `BaseStateManager._resolve_group_preset()` (state.py), which sits behind
        the blocking/partial-sync filter.

        Called from `call_immediate()`/`call_debounced()` on the *base* handler,
        so it applies to every handler, not just the user-command one.

        Two other sources produce a `preset_mode` payload, and they differ. The
        isolation pre-action validates its preset against the device's own
        `preset_modes` first and can therefore never carry a virtual name in
        here. The presence away-action (AWAY_PRESET) does not validate: a
        configured away preset that shares its name with a group preset resolves
        to the group preset's payload here. Everything else passes through
        untouched.
        """
        if not payload:
            return payload

        preset_name = payload.get(ATTR_PRESET_MODE)
        if self.is_virtual(preset_name):
            preset_payload = self.group_presets[preset_name]  # type: ignore[index]
            return {**payload, **preset_payload}
        return payload

    def get_preset_modes(self, native_modes: list[str]) -> list[str]:
        """Return union of native member preset modes and configured group presets."""
        return sorted(set(native_modes) | set(self.group_presets.keys()))
