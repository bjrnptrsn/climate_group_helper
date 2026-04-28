"""Schedule slot meta-key processing for Climate Group Helper.

Meta-keys are non-climate attributes in a HA schedule slot that control the group
itself rather than its members.  They are processed here before the climate payload
is forwarded to members:

    slot data  ──▶  SlotMetaProcessor.process()  ──▶  climate_payload (→ members)
                           │
                           └── meta-key actions (manager calls, RunState updates)

Supported meta-keys (v1 — State-Keys only):
    turn_off       : bool      — activates/deactivates the switch override (OFF-all block)
    sync_mode      : SyncMode  — temporarily shadows the configured sync mode
    group_offset   : float     — temporarily overrides the group temperature offset
    sync_attributes: list[str] — temporarily shadows the synchronized attributes
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, replace
from typing import TYPE_CHECKING, Any

from .const import (
    ATTR_SERVICE_MAP,
    META_KEY_GROUP_OFFSET,
    META_KEY_SYNC_ATTRS,
    META_KEY_SYNC_MODE,
    META_KEY_TURN_OFF,
    META_STATE_KEYS,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

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
#
# The critical constraint: group_offset must be reset *before* turn_off is restored.
# When turn_off is cleaned up, switch_override_manager.restore() fires call_immediate(),
# which reads run_state.group_offset at that moment.  If the offset were still set to
# the schedule value, members would receive the wrong temperature on restore.
#
# sync_mode and sync_attrs are pure config shadowing (no call fired), so their position
# is irrelevant — placing them first keeps them out of the way.
_CLEANUP_ORDER: list[str] = [
    META_KEY_SYNC_ATTRS,
    META_KEY_SYNC_MODE,
    META_KEY_GROUP_OFFSET,
    META_KEY_TURN_OFF,
]


@dataclass
class MetaProcessResult:
    """Return value of SlotMetaProcessor.process().

    Attributes:
        climate_payload: Slot attributes that map to climate service calls.
                         Consumed directly by ScheduleHandler for member updates.
        has_meta_keys:   True when the slot contained at least one valid meta-key.
                         Used by ScheduleHandler's early-return guard so that a slot
                         with *only* meta-keys (e.g. turn_off, no temperature) still
                         reaches the timer logic at the end of schedule_listener().
    """

    climate_payload: dict[str, Any]
    climate_bypass_payload: dict[str, Any]
    has_meta_keys: bool


class SlotMetaProcessor:
    """Owns the full lifecycle of schedule meta-keys: apply, track, and clean up.

    ScheduleHandler delegates all meta-key concerns here and only receives the
    cleaned climate_payload in return — it has no knowledge of individual key
    semantics or the transition state between slots.

    One instance lives on ClimateGroup for the lifetime of the group.
    """

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize with the owning ClimateGroup."""
        self._group = group
        self._active_keys: set[str] = set()  # meta-keys that were active in the last slot

    async def process(self, basis_data: dict[str, Any], bypass_data: dict[str, Any]) -> MetaProcessResult:
        """Process basis and bypass slots: merge meta-keys, keep climate payloads separate.

        Called by ScheduleBaseHandler on every slot or bypass transition.
        bypass_data keys overwrite basis_data keys for meta-processing (last writer wins).
        """
        # 1. Split: climate attributes remain separate for the caller
        basis_climate  = {k: v for k, v in basis_data.items()  if k in ATTR_SERVICE_MAP}
        bypass_climate = {k: v for k, v in bypass_data.items() if k in ATTR_SERVICE_MAP}
        
        # Combined view for meta-key processing (bypass wins)
        combined = {**basis_data, **bypass_data}

        # Update the calendar slot title (active_slot_title).
        slot_message = combined.pop("message", None)
        self._group.run_state = replace(self._group.run_state, active_slot_title=slot_message)

        meta_candidates = {k: v for k, v in combined.items() if k not in ATTR_SERVICE_MAP}

        # Identify valid meta-keys; warn on unknown ones (typo guard)
        # turn_off=False is semantically identical to the key being absent — it must not
        # enter _active_keys, otherwise the cleanup path would call restore() on a switch
        # that was never activated.
        new_meta_keys: set[str] = set()
        for key, value in meta_candidates.items():
            if key in META_STATE_KEYS:
                if key == META_KEY_TURN_OFF and value is not True:
                    continue
                new_meta_keys.add(key)
            elif key not in _HA_SYSTEM_ATTRS:
                _LOGGER.warning(
                    "[%s] Schedule slot contains unknown meta-key '%s' — ignored. Valid meta-keys: %s",
                    self._group.entity_id, key, sorted(META_STATE_KEYS)
                )

        # Keys present in the previous slot but absent now need their counter-actions
        keys_to_clear = self._active_keys - new_meta_keys
        if keys_to_clear:
            await self._cleanup(keys_to_clear)

        # Apply all keys present in this slot (idempotent for continuing keys)
        for key in new_meta_keys:
            value = meta_candidates[key]
            self._group.run_state = self._group.run_state.set_config_override(key, value)
            await self._apply(key, value)

        # Remember which keys are active so the next call can diff against them
        self._active_keys = new_meta_keys

        # Trigger a state update so that changes to config_overrides or other
        # RunState fields are immediately visible in HA attributes.
        if keys_to_clear or new_meta_keys or slot_message:
            self._group.async_defer_or_update_ha_state()

        return MetaProcessResult(
            climate_payload=basis_climate,
            climate_bypass_payload=bypass_climate,
            has_meta_keys=bool(new_meta_keys),
        )

    async def _apply(self, key: str, value: Any) -> None:
        """Execute the immediate action for a meta-key present in the current slot.

        config_overrides has already been updated by the caller before this method
        is invoked, so manager calls can rely on the new value being visible in RunState.
        """
        if key == META_KEY_TURN_OFF:
            # value is guaranteed True here — process() filters out non-True values
            # before adding the key to new_meta_keys, so _apply is never called with False.
            _LOGGER.debug("[%s] Meta-Key apply: turn_off=true → switch block ON", self._group.entity_id)
            await self._group.switch_override_manager.activate()

        elif key == META_KEY_GROUP_OFFSET:
            try:
                offset_val = float(value)
                _LOGGER.debug("[%s] Meta-Key apply: group_offset=%s", self._group.entity_id, offset_val)
                if self._group.offset_set_callback:
                    # offset_set_callback updates run_state.group_offset and refreshes the
                    # slider UI (OffsetNumber._set_offset).  config_overrides[META_KEY_GROUP_OFFSET]
                    # acts as the schedule's ownership marker: as long as it is present, the
                    # slot-end cleanup will reset the offset to 0.0.  If the user moves the
                    # slider manually, OffsetNumber.async_set_native_value clears the marker
                    # (ownership transfer) so the cleanup becomes a deliberate no-op.
                    await self._group.offset_set_callback(offset_val)
            except (ValueError, TypeError):
                _LOGGER.warning("[%s] Invalid group_offset in schedule slot: %s", self._group.entity_id, value)

        elif key in (META_KEY_SYNC_MODE, META_KEY_SYNC_ATTRS):
            # Pure config shadowing: was written during slot processing to config_overrides.
            # The respective handlers read these overrides at call-time and
            # fall back to the config baseline when the key is absent.
            _LOGGER.debug("[%s] Meta-Key apply: %s=%s", self._group.entity_id, key, value)

    async def _cleanup(self, keys: set[str]) -> None:
        """Execute counter-actions for meta-keys that have left the current slot.

        Iteration order follows _CLEANUP_ORDER.  This is required because
        group_offset must be reset before turn_off is restored: the restore
        call fires call_immediate() which reads run_state.group_offset at
        that moment (see _CLEANUP_ORDER for the full rationale).
        """
        _LOGGER.debug("[%s] Meta-Key cleanup: %s", self._group.entity_id, keys)

        for key in sorted(
            keys, key=lambda k: _CLEANUP_ORDER.index(k)
            if k in _CLEANUP_ORDER
            else len(_CLEANUP_ORDER)
        ):
            if key == META_KEY_TURN_OFF:
                _LOGGER.debug("[%s] Meta-Key cleanup: turn_off absent → switch block OFF", self._group.entity_id)
                await self._group.switch_override_manager.restore()

            elif key == META_KEY_GROUP_OFFSET:
                # Ownership guard: only reset if config_overrides still contains the marker.
                # A missing marker means the user moved the slider during this slot, which
                # cleared the marker (OffsetNumber.async_set_native_value) and transferred
                # ownership to the user — their value must not be overwritten here.
                if META_KEY_GROUP_OFFSET in self._group.run_state.config_overrides:
                    _LOGGER.debug("[%s] Meta-Key cleanup: group_offset absent → reset to 0.0", self._group.entity_id)
                    if self._group.offset_set_callback:
                        await self._group.offset_set_callback(0.0)
                else:
                    _LOGGER.debug("[%s] Meta-Key cleanup: group_offset skipped — ownership transferred to user", self._group.entity_id)

            elif key in (META_KEY_SYNC_MODE, META_KEY_SYNC_ATTRS):
                # Pure shadowing — clear_config_overrides (below) is the entire cleanup.
                _LOGGER.debug("[%s] Meta-Key cleanup: %s absent → config baseline restored", self._group.entity_id, key)

        self._group.run_state = self._group.run_state.clear_config_overrides(keys)
