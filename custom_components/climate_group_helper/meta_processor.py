"""Schedule slot meta-key processing for Climate Group Helper.

Meta-keys are non-climate attributes in a HA schedule slot that control the group
itself rather than its members.  They are processed here before the climate payload
is forwarded to members:

    slot data  ──▶  SlotMetaProcessor.process()  ──▶  climate_payload (→ members)
                           │
                           └── meta-key actions (manager calls, RunState updates)

Supported meta-keys:

    State-Keys (persist in config_overrides until the slot ends):
        sync_mode      : SyncMode  — temporarily shadows the configured sync mode
        group_offset   : float     — temporarily overrides the group temperature offset
        sync_attributes: list[str] — temporarily shadows the synchronized attributes
        presence       : "away"    — superseded by presence_mode, still tolerated

    Feature bypasses (also State-Keys) suspend a feature for the slot duration:
        window_mode     : "disabled"          — ignore the window sensors
        presence_mode   : "disabled" | "away" — ignore the presence sensors, either
                                                releasing the block or forcing it
        calibration_mode: "disabled"          — stop writing calibration values
        isolation_bypass: "all" | list[int]   — suspend isolation rules by UI slot

    One-Shot triggers (applied once per slot activation, not stored in config_overrides):
        turn_off       : bool      — activates/deactivates the switch override (OFF-all block)

All four bypasses follow the same three steps: silence the evaluation, pull the
feature through to the named state once (the window may already be open when the
slot starts), and re-evaluate against freshly read sensors when the slot ends.
Calibration has no state to pull through, so it only catches up its writes.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, replace
from typing import TYPE_CHECKING, Any

from .const import (
    META_KEY_CALIBRATION_MODE,
    META_KEY_GROUP_OFFSET,
    META_KEY_ISOLATION_BYPASS,
    META_KEY_PRESENCE_MODE,
    META_KEY_SYNC_ATTRS,
    META_KEY_SYNC_MODE,
    META_KEY_TURN_OFF,
    META_KEY_PRESENCE,
    META_KEY_WINDOW_MODE,
    META_STATE_KEYS,
    META_VALUE_ALL,
    META_VALUE_AWAY,
    META_VALUE_DISABLED,
    PresenceMode,
    SyncMode,
)
from .number import async_push_group_offset, clean_offset
from .payload import split_payload

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)

# HA-internal attributes that the schedule entity may include in its state but
# that are not climate-relevant.  Silently ignored to avoid spurious warnings.
_HA_SYSTEM_ATTRS: frozenset[str] = frozenset({
    "friendly_name",
    "icon",
    "editable",
    "next_event",
})

# Counter-actions during cleanup must run in this order to avoid stale-read bugs.
# What matters is the block state each counter-action finds: several of them read
# blocking_sources to decide whether to act, so a key that releases a block changes
# what the next one sees.
#
# sync_mode and sync_attrs are pure config shadowing (no call fired), so their position
# is irrelevant — placing them first keeps them out of the way.
#
# group_offset pushes setpoints to the members. It runs before the block-releasing
# keys so its push happens while the block still suppresses it; the restore that
# follows carries the reset offset anyway. Reversed, the offset push would land on
# members that the block restore then immediately overwrites.
#
# isolation_bypass restores individual devices to target_state, presence and window
# restore the whole group. Isolation first: its per-device restore is skipped while
# any block is still active (send_restore_call/_deactivate_isolation check
# run_state.blocked), and the group-wide restore that follows covers those devices
# too. The other order would restore the group first and then push single devices
# a second time.
#
# presence before window: both re-evaluate their own sensors and may re-activate.
# WindowOverrideManager.activate() is a no-op while "switch" is in blocking_sources
# but not while "presence" is, so window must run last to see the final block set —
# the reverse order lets a re-activating presence block silently take over the
# members a window restore had just handed back.
#
# calibration_mode writes to the calibration number entities, not to the members,
# and reads no block state. Its position is therefore free; last keeps the
# member-facing counter-actions adjacent.
_CLEANUP_ORDER: list[str] = [
    META_KEY_SYNC_ATTRS,
    META_KEY_SYNC_MODE,
    META_KEY_GROUP_OFFSET,
    META_KEY_ISOLATION_BYPASS,
    META_KEY_PRESENCE,
    META_KEY_PRESENCE_MODE,
    META_KEY_WINDOW_MODE,
    META_KEY_CALIBRATION_MODE,
]


# Claim sources, highest precedence first. A preset is chosen by hand and must
# not be undone by a slot that keeps re-applying the same value; the fixed order
# also makes the sequence of slot-apply and preset-restore at startup irrelevant.
SOURCE_PRESET = "preset"
SOURCE_SCHEDULE = "schedule"
_PRECEDENCE: tuple[str, ...] = (SOURCE_PRESET, SOURCE_SCHEDULE)


def _cleanup_position(key: str) -> int:
    """Sort key for _CLEANUP_ORDER; unlisted keys run last."""
    return _CLEANUP_ORDER.index(key) if key in _CLEANUP_ORDER else len(_CLEANUP_ORDER)


@dataclass
class _KeyClaim:
    """What one source last asked for on one meta-key.

    `value` is what makes a *user takeover* detectable: a slot is re-processed
    constantly (resync, bypass events, consecutive slots carrying the same key),
    so an unchanged claim arriving while the live value says something else means
    somebody moved it by hand. The claim is then withdrawn rather than
    re-asserted — the generalisation of the group_offset ownership marker. A
    genuinely new value is not affected, it fails the equality check.

    It is not an idempotence guard: an ordinary repeat runs through
    `_apply_effective()` like any other apply. That is harmless because the
    effects downstream are themselves idempotent (the group_offset push diffs,
    the handler calls are guarded by their own block state) — so do not lean on
    this record to keep a non-idempotent side effect from running twice.
    """

    value: Any


@dataclass
class MetaProcessResult:
    """Return value of SlotMetaProcessor.process().

    Attributes:
        climate_payload:        Main-slot attributes that map to climate service calls.
        climate_bypass_payload: Bypass-slot attributes (empty when no bypass is active).
        bypass_has_content:     Whether the bypass slot carries anything at all —
                                climate attributes or valid meta-keys. A slot that
                                carries neither is not a bypass anyone configured;
                                it is a calendar event that lost its payload, and
                                it must not silence the main layer for its whole
                                duration. The event title alone does not count.
    """

    climate_payload: dict[str, Any]
    climate_bypass_payload: dict[str, Any]
    bypass_has_content: bool = False


class MetaKeyOwnership:
    """Tracks which sources claim which meta-key, and what the effective value is.

    Two sources can ask for the same key: a schedule slot and a group preset. The
    single-owner bookkeeping this replaces could not express that — a preset
    releasing its keys would clear an override the slot still wants, and a slot
    ending would drop one the preset still holds.

    The registry decides *whose* value lands in `run_state.config_overrides` and
    when a key is removed from it; the values themselves keep living there, so
    every reader (the handler `bypassed` properties, `SyncModeHandler.sync_mode`,
    …) is unaffected.

    Main and bypass slots count as one schedule source: their meta-keys are
    merged (bypass wins) before this is reached.
    """

    def __init__(self) -> None:
        self._claims: dict[str, dict[str, _KeyClaim]] = {}

    def keys_for(self, source: str) -> set[str]:
        """Return the keys currently claimed by one source."""
        return {key for key, by_source in self._claims.items() if source in by_source}

    def last_value(self, key: str, source: str) -> Any | None:
        """Return what this source last claimed for this key, or None."""
        claim = self._claims.get(key, {}).get(source)
        return claim.value if claim else None

    def claim(self, key: str, source: str, value: Any) -> None:
        """Record a source's claim on a key."""
        self._claims.setdefault(key, {})[source] = _KeyClaim(value=value)

    def release(self, key: str, source: str) -> None:
        """Drop one source's claim on a key."""
        if (by_source := self._claims.get(key)) is None:
            return
        by_source.pop(source, None)
        if not by_source:
            self._claims.pop(key, None)

    def release_all(self, source: str) -> set[str]:
        """Drop every claim of one source; return the keys it had claimed."""
        released = self.keys_for(source)
        for key in released:
            self.release(key, source)
        return released

    def is_claimed(self, key: str) -> bool:
        """Return True while any source still claims the key."""
        return key in self._claims

    def effective(self, key: str) -> tuple[str, Any] | None:
        """Return (source, value) of the highest-precedence claimant, or None."""
        by_source = self._claims.get(key)
        if not by_source:
            return None
        for source in _PRECEDENCE:
            if (claim := by_source.get(source)) is not None:
                return source, claim.value
        return None


class SlotMetaProcessor:
    """Owns the full lifecycle of schedule meta-keys: apply, track, and clean up.

    MainScheduleHandler delegates all meta-key concerns here and only receives the
    cleaned climate_payload in return — it has no knowledge of individual key
    semantics or the transition state between slots.

    One instance lives on ClimateGroupHelper for the lifetime of the group.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize with the owning ClimateGroupHelper."""
        self._group = group
        self._ownership = MetaKeyOwnership()

    @property
    def ownership(self) -> MetaKeyOwnership:
        """Return the claim registry (read by preset.py and reset.py)."""
        return self._ownership

    async def apply_source(self, source: str, values: dict[str, Any]) -> None:
        """Make `values` the complete set of claims held by `source`.

        The single entry point for both sources. Keys the source claimed before
        but does not name now are released; keys it names are claimed and, if
        the source now owns them, applied.

        Cleanup runs before apply so a key moving between sources within one
        call never passes through an unclaimed state.
        """
        stale = self._ownership.keys_for(source) - set(values)
        if stale:
            await self._release(source, stale)

        # Claims are recorded before the first _apply() runs, so a key whose
        # apply raises is still tracked and gets cleaned up later — the same
        # reason the previous bookkeeping wrote its markers up front.
        applied: list[tuple[str, Any]] = []
        for key, value in values.items():
            previous = self._ownership.last_value(key, source)
            self._ownership.claim(key, source, value)
            applied.append((key, previous))

        try:
            for key, previous in applied:
                await self._apply_effective(key, source, previous)
        except Exception:
            _LOGGER.exception(
                "[%s] Meta-Key apply failed while processing %s — continuing with keys applied so far",
                self._group.entity_id, sorted(values),
            )

    async def _apply_effective(self, key: str, source: str, previous: Any) -> None:
        """Write the winning claim to config_overrides and run its side effects.

        A source that is currently outranked records its claim but changes
        nothing — it takes over on its own once the higher-precedence source
        releases the key.
        """
        winner = self._ownership.effective(key)
        if winner is None or winner[0] != source:
            return
        value = winner[1]

        # Takeover: this source is asking for the same value again while the
        # world says otherwise, so somebody moved it by hand. Skip the apply
        # instead of pulling the value back — a genuinely new value still wins,
        # because it fails this equality check.
        #
        # The claim itself stays recorded. It is what `previous` reads on the next
        # pass, and the slot is re-processed on every schedule-entity event:
        # dropping it here would leave `previous` at None the next time round, the
        # equality check could not fire again, and the very next re-process would
        # pull the user's value back to the slot's.
        if previous is not None and previous == value and self._live_value_diverges(key, value):
            _LOGGER.debug(
                "[%s] Meta-Key apply: %s=%s skipped — ownership held by user",
                self._group.entity_id, key, value,
            )
            self._group.run_state = self._group.run_state.clear_config_overrides({key})
            return

        self._group.run_state = self._group.run_state.set_config_override(key, value)
        await self._apply(key, value)

    def _live_value_diverges(self, key: str, value: Any) -> bool:
        """Return True if the live value diverges from what this key asked for.

        One ingredient of the takeover detection in `_apply_effective`, gated on
        a repeated claim (`previous == value`). It is not the definition of a
        takeover: the handover and `_cleanup()` recognise one by the override's
        *absence*, not by a value comparison — see those call sites.

        Only `group_offset` has a value the user can move independently (the
        slider). Every other key drives handler behaviour that nothing else
        writes, so a divergence cannot arise.
        """
        if key == META_KEY_GROUP_OFFSET:
            return self._group.run_state.group_offset != value
        return False

    async def _release(self, source: str, keys: set[str]) -> None:
        """Drop `source`'s claims on `keys` and settle what is left.

        A key another source still claims falls to that source's value — its
        `_apply()` runs so the change actually reaches the handlers. Only a key
        nobody claims any more gets its counter-action.
        """
        for key in keys:
            self._ownership.release(key, source)

        orphaned = {key for key in keys if not self._ownership.is_claimed(key)}
        inherited = keys - orphaned

        for key in sorted(inherited, key=_cleanup_position):
            winner = self._ownership.effective(key)
            if winner is None:  # unreachable, guarded by is_claimed above
                continue
            # A genuine user takeover is recognised by the override being gone:
            # the slider clears the config_overrides entry directly
            # (OffsetNumber.async_set_native_value), bypassing the registry. A
            # plain handover still carries the departing source's override, so
            # the winner's value must take over. Comparing the live value against
            # the winner instead would read every differing handover as a
            # takeover and strand the key at the value the source just released.
            if key == META_KEY_GROUP_OFFSET and key not in self._group.run_state.config_overrides:
                _LOGGER.debug(
                    "[%s] Meta-Key handover: %s=%s skipped — ownership held by user",
                    self._group.entity_id, key, winner[1],
                )
                continue
            _LOGGER.debug(
                "[%s] Meta-Key handover: %s now owned by %s", self._group.entity_id, key, winner[0]
            )
            self._group.run_state = self._group.run_state.set_config_override(key, winner[1])
            await self._apply(key, winner[1])

        if orphaned:
            await self._cleanup(orphaned)

    async def process(self, main_data: dict[str, Any], bypass_data: dict[str, Any]) -> MetaProcessResult:
        """Process main and bypass slots: merge meta-keys, keep climate payloads separate.

        Called by BaseScheduleHandler on every slot or bypass transition.
        bypass_data keys overwrite main_data keys for meta-processing (last writer wins).
        """
        main_climate, main_meta = split_payload(main_data)
        bypass_climate, bypass_meta = split_payload(bypass_data)
        # Whether the bypass slot carries any usable content: climate attributes
        # or valid meta-keys. `message` (the event title) is ignored because a
        # calendar event always carries it — a slot with only a title is not a
        # bypass anyone configured and must not silence the main. Validated
        # with an empty context so no warnings fire here: the slot path below
        # reports the same keys already.
        bypass_has_content = bool(bypass_climate or self.validate_values(bypass_meta))

        meta_candidates = {**main_meta, **bypass_meta}

        slot_message = meta_candidates.pop("message", None)
        prev_slot_title = self._group.run_state.active_slot_title
        self._group.run_state = replace(self._group.run_state, active_slot_title=slot_message)

        # turn_off is a one-shot trigger, not a stateful key — never enters _active_keys.
        # true → activate, false → restore, absent → no-op. Equal, interchangeable
        # with the UI switch (no ownership tracking): an already-active block is not
        # re-activated (activate() sends OFF unconditionally — re-triggering it on
        # every slot re-process would spam members with redundant OFF commands).
        if META_KEY_TURN_OFF in meta_candidates:
            turn_off_value = meta_candidates.pop(META_KEY_TURN_OFF)
            if turn_off_value is True:
                if "switch" not in self._group.run_state.blocking_sources:
                    _LOGGER.debug("[%s] Meta-Key: turn_off=true → switch block ON", self._group.entity_id)
                    await self._group.switch_override_manager.activate()
            elif turn_off_value is False:
                if "switch" in self._group.run_state.blocking_sources:
                    _LOGGER.debug("[%s] Meta-Key: turn_off=false → switch block OFF", self._group.entity_id)
                    await self._group.switch_override_manager.restore()
            else:
                # The identity checks above are deliberate — a truthy string must
                # not switch the group off. But silently doing nothing left a typo
                # indistinguishable from a slot that was never meant to switch
                # anything. The sibling meta-keys all warn here.
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key 'turn_off': %s (expected true or false) — ignored",
                    self._group.entity_id, turn_off_value,
                )

        # presence_mode supersedes the legacy presence key. Both in one slot: the
        # new key wins and the old one is dropped, so a user mid-migration gets one
        # warning instead of two keys fighting over the same block.
        if META_KEY_PRESENCE_MODE in meta_candidates and META_KEY_PRESENCE in meta_candidates:
            _LOGGER.warning(
                "[%s] Slot carries both 'presence_mode' and the superseded 'presence' — "
                "'presence' ignored",
                self._group.entity_id,
            )
            meta_candidates.pop(META_KEY_PRESENCE)

        # Identify valid meta-keys; warn on unknown ones (typo guard).
        # Values are normalised here so every downstream reader sees one shape.
        final_meta = self.validate_values(meta_candidates, context="Schedule slot")

        had_claims = bool(self._ownership.keys_for(SOURCE_SCHEDULE))
        await self.apply_source(SOURCE_SCHEDULE, final_meta)

        # Trigger a state update so that changes to config_overrides or other
        # RunState fields are immediately visible in HA attributes.
        if had_claims or final_meta or slot_message != prev_slot_title:
            self._group.async_defer_or_update_ha_state()

        return MetaProcessResult(
            climate_payload=main_climate,
            climate_bypass_payload=bypass_climate,
            bypass_has_content=bypass_has_content,
        )

    def validate_values(self, candidates: dict[str, Any], *, context: str = "") -> dict[str, Any]:
        """Filter a mapping down to valid meta-keys with canonical values.

        Shared by both sources so a preset and a slot accept exactly the same
        keys and values — a definition can be moved between them unchanged.

        `context` names the payload's origin for the unknown-key warning. An
        empty context suppresses it — the bypass-content check runs beside the
        slot validation and would otherwise report the same typo twice. The
        value warnings in `_validate_meta_value` are independent of it and
        always fire: a rejection there is the user's only signal that a value
        was dropped.
        """
        valid: dict[str, Any] = {}
        for key, value in candidates.items():
            if key in META_STATE_KEYS:
                # Value guard: an invalid value must not be registered at all —
                # it would show up in config_overrides and trigger a spurious
                # cleanup counter-action when the claim is released.
                canonical = self._validate_meta_value(key, value)
                if canonical is not None:
                    valid[key] = canonical
            elif context and key not in _HA_SYSTEM_ATTRS:
                _LOGGER.warning(
                    "[%s] %s contains unknown meta-key '%s' — ignored. Valid meta-keys: %s",
                    self._group.entity_id, context, key, sorted(META_STATE_KEYS)
                )
        return valid

    def _validate_meta_value(self, key: str, value: Any) -> Any | None:
        """Return the canonical value for a meta-key, or None to reject it.

        Rejection is total: the key never reaches config_overrides. A marker
        written for a value that was never applied would make the slot-end
        cleanup run a counter-action against something that never happened —
        for group_offset that means resetting a manually set offset to 0.0.

        Warnings are emitted here, so every rejection tells the user which value
        was unusable and what the key expects.
        """
        if key == META_KEY_PRESENCE:
            if value != META_VALUE_AWAY:
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key 'presence': %s (expected 'away') — ignored",
                    self._group.entity_id, value,
                )
                return None
            return value

        if key == META_KEY_PRESENCE_MODE:
            if value not in (META_VALUE_DISABLED, META_VALUE_AWAY):
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key 'presence_mode': %s "
                    "(expected 'disabled' or 'away') — ignored",
                    self._group.entity_id, value,
                )
                return None
            return value

        # window_mode and calibration_mode only ever suspend. "enabled" is not a
        # value they accept: with the feature switched off in the config there is
        # no sensor subscription (window) and nothing queues writes (calibration),
        # so the key would sit in config_overrides without any effect.
        if key in (META_KEY_WINDOW_MODE, META_KEY_CALIBRATION_MODE):
            if value != META_VALUE_DISABLED:
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key '%s': %s (expected 'disabled') — ignored",
                    self._group.entity_id, key, value,
                )
                return None
            return value

        if key == META_KEY_ISOLATION_BYPASS:
            return self._validate_isolation_bypass(value)

        # sync_attributes reaches FilterState.from_keys() at enforce time —
        # a non-list (e.g. int) would raise TypeError inside resync().
        if key == META_KEY_SYNC_ATTRS:
            if not (
                isinstance(value, (list, tuple))
                and all(isinstance(item, str) for item in value)
            ):
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key 'sync_attributes': %s (expected a list of attribute names) — ignored",
                    self._group.entity_id, value,
                )
                return None
            return value

        # sync_mode is resolved in a property (SyncModeHandler.sync_mode),
        # read on every member event. An unusable value falls back to the
        # configured mode there — correct, but it logs each time, so one
        # typo becomes a continuous stream for the whole slot. Registering
        # it would also advertise it as an active override in the
        # entity attributes.
        if key == META_KEY_SYNC_MODE:
            try:
                SyncMode(value)
            except (TypeError, ValueError):
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key 'sync_mode': %s — ignored",
                    self._group.entity_id, value,
                )
                return None
            return value

        # Validated here, before the override marker is written: _apply() runs
        # after it, so an unusable value would leave a marker whose slot-end
        # cleanup resets an offset that was never applied. clean_offset() is the
        # validator the write path uses — a bare float() accepts nan/inf.
        #
        # Stored CLAMPED, because the takeover check compares against
        # run_state.group_offset, which always is: a raw value makes the clamping
        # itself (slot 50 vs. stored 5.0) look like a user takeover.
        if key == META_KEY_GROUP_OFFSET:
            return clean_offset(value, self._group.entity_id)

        return value

    def _validate_isolation_bypass(self, value: Any) -> str | list[int] | None:
        """Normalise isolation_bypass to the "all" sentinel or a sorted slot list.

        Accepts true/"all", a single slot number, or a list of them. Everything
        reaching config_overrides has one of the two canonical shapes, so the
        three read sites never have to know about the input variants.

        The list is sorted (deterministic comparison between slot re-processings)
        and plain ints rather than a set, because config_overrides is exposed in
        the entity attributes and has to stay JSON-serialisable.

        bool is checked before int on purpose — bool is a subclass of int, so
        `True` would otherwise normalise to slot 1.
        """
        if value is True or value == META_VALUE_ALL:
            return META_VALUE_ALL

        raw = value if isinstance(value, (list, tuple)) else [value]
        slots: list[int] = []
        for item in raw:
            # Strings are rejected rather than coerced: "2" in a schedule slot is
            # as likely a typo as an intent, and a silent coercion would hide it.
            if isinstance(item, bool) or not isinstance(item, int) or not 1 <= item <= 4:
                _LOGGER.warning(
                    "[%s] Invalid value for meta-key 'isolation_bypass': %s "
                    "(expected 'all', or rule slot numbers 1-4) — ignored",
                    self._group.entity_id, value,
                )
                return None
            slots.append(item)

        if not slots:
            _LOGGER.warning(
                "[%s] Empty value for meta-key 'isolation_bypass' — ignored",
                self._group.entity_id,
            )
            return None
        return sorted(set(slots))

    async def _apply(self, key: str, value: Any) -> None:
        """Execute the immediate action for a meta-key present in the current slot.

        config_overrides has already been updated by the caller before this method
        is invoked, so manager calls can rely on the new value being visible in RunState.
        Values arrive validated and normalised from `process()`, so every branch
        uses its own unchecked.
        """
        if key == META_KEY_GROUP_OFFSET:
            # Stored clamped: the takeover check compares it against
            # run_state.group_offset, which always is.
            offset_val = value

            _LOGGER.debug("[%s] Meta-Key apply: group_offset=%s", self._group.entity_id, offset_val)
            if self._group.offset_set_callback:
                # offset_set_callback updates run_state.group_offset and refreshes the
                # slider UI (OffsetNumber._set_offset). The claim in the ownership
                # registry is what makes the release reset the offset to 0.0; if the
                # user moves the slider manually, OffsetNumber.async_set_native_value
                # clears the override, and the takeover check withdraws the claim on
                # the next re-processing so the release becomes a deliberate no-op.
                await self._group.offset_set_callback(offset_val)
            else:
                self._group.run_state = replace(self._group.run_state, group_offset=offset_val)

            # The slider pushes the new offset to the members; the meta-key path must do
            # the same. Otherwise a slot that only sets group_offset updates RunState and
            # the UI while the devices keep their old setpoints until some unrelated sync
            # happens to run — the state looks correct while the room stays wrong.
            await async_push_group_offset(self._group)

        elif key in (META_KEY_SYNC_MODE, META_KEY_SYNC_ATTRS, META_KEY_CALIBRATION_MODE):
            # Pure config shadowing: was written during slot processing to config_overrides.
            # The respective handlers read these overrides at call-time and
            # fall back to the config baseline when the key is absent.
            #
            # calibration_mode belongs here despite being a bypass: its target
            # state is "do not write", so there is nothing to pull through at the
            # slot start (the early return in CalibrationHandler.update() is the
            # entire effect). Only the slot end has work to do — see _cleanup().
            _LOGGER.debug("[%s] Meta-Key apply: %s=%s", self._group.entity_id, key, value)

        elif key in (META_KEY_PRESENCE, META_KEY_PRESENCE_MODE):
            # Both values silence the sensor evaluation and differ only in the
            # state the block is pinned to — apply_bypass() carries that split,
            # including the idempotency guard against re-sending on every slot
            # re-process.
            _LOGGER.debug("[%s] Meta-Key apply: %s=%s", self._group.entity_id, key, value)
            await self._group.presence_handler.apply_bypass(value)

        elif key == META_KEY_WINDOW_MODE:
            # The handler's own guard makes this idempotent across slot
            # re-processing: once the block is released there is nothing left to do.
            _LOGGER.debug("[%s] Meta-Key apply: window_mode=disabled", self._group.entity_id)
            await self._group.window_control_handler.apply_bypass()

        elif key == META_KEY_ISOLATION_BYPASS:
            # Release the devices the suspended rules hold. Each handler decides
            # for itself whether it is bypassed (it reads config_overrides, which
            # the caller has already written), and _deactivate_isolation() keeps
            # devices a still-active foreign rule claims — so a device covered by
            # both a bypassed and an active rule stays isolated.
            _LOGGER.debug(
                "[%s] Meta-Key apply: isolation_bypass=%s", self._group.entity_id, value
            )
            # A slot number without a rule behind it is a typo, and every sibling
            # guard reports one. The value guard cannot catch it: it only knows
            # the 1-4 range, not which of those slots actually carry a rule.
            if value != META_VALUE_ALL:
                known = {handler.slot for handler in self._group.member_isolation_handlers}
                if unknown := sorted(set(value) - known):
                    _LOGGER.warning(
                        "[%s] Meta-Key 'isolation_bypass': no isolation rule in slot(s) %s — "
                        "those numbers have no effect",
                        self._group.entity_id,
                        ", ".join(str(slot) for slot in unknown),
                    )
            # Both directions: a slot switching from [1] to [2] drops rule 1 out
            # of the bypass while the key stays claimed, and _cleanup() — which
            # would re-isolate it — only runs for a key nobody claims any more.
            for handler in self._group.member_isolation_handlers:
                if handler.bypassed:
                    await handler.release_bypassed()
                else:
                    await handler.reevaluate()

    async def _cleanup(self, keys: set[str]) -> None:
        """Execute counter-actions for meta-keys no source claims any more.

        Iteration order follows _CLEANUP_ORDER (see comment there for rationale).
        """
        _LOGGER.debug("[%s] Meta-Key cleanup: %s", self._group.entity_id, keys)

        for key in sorted(keys, key=_cleanup_position):
            if key == META_KEY_GROUP_OFFSET:
                # Ownership guard: only reset while the override is still present.
                # The slider clears it directly (OffsetNumber.async_set_native_value)
                # rather than going through the registry, so a missing override means
                # the user took the offset over — their value must not be overwritten.
                if META_KEY_GROUP_OFFSET in self._group.run_state.config_overrides:
                    _LOGGER.debug("[%s] Meta-Key cleanup: group_offset absent → reset to 0.0", self._group.entity_id)
                    if self._group.offset_set_callback:
                        await self._group.offset_set_callback(0.0)
                    else:
                        self._group.run_state = replace(self._group.run_state, group_offset=0.0)
                    await async_push_group_offset(self._group)
                else:
                    _LOGGER.debug("[%s] Meta-Key cleanup: group_offset skipped — ownership transferred to user", self._group.entity_id)

            elif key in (META_KEY_SYNC_MODE, META_KEY_SYNC_ATTRS):
                # Pure shadowing — clear_config_overrides (below) is the entire cleanup.
                _LOGGER.debug("[%s] Meta-Key cleanup: %s absent → config baseline restored", self._group.entity_id, key)

            elif key == META_KEY_ISOLATION_BYPASS:
                # Re-apply every rule whose trigger is still active. The handlers
                # read their sensors fresh — _trigger_active carries the reading
                # from before the slot, and the sensor kept running while the
                # rule was suspended.
                #
                # Ordering: clear_config_overrides() runs at the end of this
                # method, but the handlers ask `bypassed` (and through it
                # config_overrides) on every step. Withdraw the key first, or
                # every rule still counts as suspended and re-isolates nothing.
                _LOGGER.debug(
                    "[%s] Meta-Key cleanup: isolation_bypass absent → re-evaluating isolation rules",
                    self._group.entity_id,
                )
                self._group.run_state = self._group.run_state.clear_config_overrides(
                    {META_KEY_ISOLATION_BYPASS}
                )
                for handler in self._group.member_isolation_handlers:
                    await handler.reevaluate()

            elif key == META_KEY_WINDOW_MODE:
                # Re-evaluate against the sensors as they are NOW: the window may
                # have been opened during the slot (block goes on) or opened and
                # closed again (block stays off). _control_state alone cannot tell
                # these apart — it carries the value from the slot start.
                #
                # Ordering: clear_config_overrides() runs at the end of this
                # method, but _execute_action() and everything downstream still
                # sees the bypass until then. Withdraw it first.
                _LOGGER.debug(
                    "[%s] Meta-Key cleanup: window_mode absent → re-evaluating window sensors",
                    self._group.entity_id,
                )
                self._group.run_state = self._group.run_state.clear_config_overrides(
                    {META_KEY_WINDOW_MODE}
                )
                await self._group.window_control_handler.reevaluate()

            elif key == META_KEY_CALIBRATION_MODE:
                # The sensors kept reading throughout the bypass, so the devices
                # still carry the calibration from the slot start. Nothing else
                # catches this up: every other caller of update() is event-driven
                # (a sensor or member change we did not see) and the heartbeat is
                # off by default. force_sync writes regardless of the out-of-sync
                # check — the same path startup and heartbeat use.
                #
                # Ordering: clear_config_overrides() runs at the end of this
                # method, so the key is still set here and update() would return
                # early. Withdraw it first, then write.
                _LOGGER.debug(
                    "[%s] Meta-Key cleanup: calibration_mode absent → catching up calibration values",
                    self._group.entity_id,
                )
                self._group.run_state = self._group.run_state.clear_config_overrides(
                    {META_KEY_CALIBRATION_MODE}
                )
                self._group.calibration_handler.update("temperature", force_sync=True)
                self._group.calibration_handler.update("humidity", force_sync=True)

            elif key in (META_KEY_PRESENCE, META_KEY_PRESENCE_MODE):
                # Hand the block back to the sensors — without them nothing would
                # ever release it, so the slot has to. `mode` is the CONFIGURED
                # mode on purpose: the effective one would still show the bypass
                # being withdrawn here.
                #
                # Withdraw the key before either path runs — both read
                # config_overrides (the handler through `bypassed`, _go_restore()
                # through `forces_away`) and would see the bypass they are meant
                # to end; the clear_config_overrides() at the end of this method
                # comes too late. Only the expiring key: a slot never carries
                # both, so the other one is a preset's claim.
                presence_handler = self._group.presence_handler
                self._group.run_state = self._group.run_state.clear_config_overrides({key})
                if presence_handler.mode == PresenceMode.DISABLED or not presence_handler.sensors:
                    # Only if this key pinned a block. `restore()` pushes
                    # target_state unconditionally, and a `disabled` key without
                    # presence control never activated anything.
                    if "presence" in self._group.run_state.blocking_sources:
                        _LOGGER.debug(
                            "[%s] Meta-Key cleanup: %s absent, no presence control → releasing block",
                            self._group.entity_id, key,
                        )
                        await self._group.presence_override_manager.restore()
                else:
                    _LOGGER.debug(
                        "[%s] Meta-Key cleanup: %s absent → re-evaluating presence sensors",
                        self._group.entity_id, key,
                    )
                    await presence_handler.reevaluate()

        self._group.run_state = self._group.run_state.clear_config_overrides(keys)
