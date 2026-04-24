"""Schedule handler for automatic state changes based on HA Schedule entities."""
from __future__ import annotations

import logging
from dataclasses import fields, replace
from enum import StrEnum
from typing import TYPE_CHECKING

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_PRESET_MODE,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_MODE,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
)
from homeassistant.const import ATTR_TEMPERATURE
from homeassistant.core import callback
from homeassistant.helpers.event import async_track_state_change_event, async_call_later

from .const import (
    CONF_SCHEDULE_ENTITY,
    CONF_RESYNC_INTERVAL,
    CONF_OVERRIDE_DURATION,
    CONF_PERSIST_CHANGES,
)
from .state import ClimateState

_CLIMATE_MODE_ATTRS: frozenset[str] = frozenset({
    ATTR_HVAC_MODE,
    ATTR_FAN_MODE,
    ATTR_PRESET_MODE,
    ATTR_SWING_MODE,
    ATTR_SWING_HORIZONTAL_MODE,
})
_CLIMATE_NUMERIC_ATTRS: frozenset[str] = frozenset({
    ATTR_TEMPERATURE,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_HUMIDITY,
})


class ScheduleCaller(StrEnum):
    """Caller identifiers for schedule_listener."""

    SLOT = "slot"
    SERVICE_CALL = "service_call"   # Genuine user command (climate_call_handler)
    SYNC_CALL = "sync_call"         # Sync enforcement / MIRROR adoption (sync_mode_call_handler)
    RESYNC = "resync"
    SWITCH = "switch"


if TYPE_CHECKING:
    from .climate import ClimateGroup


_LOGGER = logging.getLogger(__name__)


class ScheduleHandler:
    """Handles schedule-based state changes using HA Schedule entities.

    Architecture (Event-Driven):
    - Observes Schedule Transitions (via HA Entity)
    - Receives Service Call Triggers (User/Sync Hooks)
    - Manages Resync & Manual-Override-Return Timers
    """

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the schedule handler."""
        self._group = group
        self._hass = group.hass
        self._unsub_listener = None
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY) if self._group.advanced_mode else None

        # Feature Options
        self._resync_interval = group.config.get(CONF_RESYNC_INTERVAL, 0) if self._group.advanced_mode else 0
        self._override_duration = group.config.get(CONF_OVERRIDE_DURATION, 0) if self._group.advanced_mode else 0
        self._persist_changes = group.config.get(CONF_PERSIST_CHANGES, False) if self._group.advanced_mode else False

        # Timer (shared slot: either resync or schedule-override, never both)
        self._timer = None
        self._active_timer_type: str | None = None

        _LOGGER.debug("[%s] Schedule initialized: '%s' (Resync: %sm, Override: %sm, Sticky: %s)", 
                      self._group.entity_id, self._schedule_entity, 
                      self._resync_interval, self._override_duration, self._persist_changes)

    @property
    def state_manager(self):
        """Return the specialized state manager for schedule updates."""
        return self._group.schedule_state_manager

    @property
    def call_handler(self):
        """Return the specialized call handler for schedule operations."""
        return self._group.schedule_call_handler

    @property
    def group_state(self):
        """Return the current group state (from central source)."""
        return self._group.current_group_state

    @property
    def target_state(self):
        """Return the current target state (from central source)."""
        return self.state_manager.target_state

    @property
    def schedule_entity_id(self) -> str | None:
        """Return the active schedule entity ID."""
        return self._schedule_entity


    async def async_setup(self) -> None:
        """Subscribe to schedule entity state changes."""
        self._subscribe()

        # User commands (group UI / service calls) → start override timer
        self._group.climate_call_handler.register_call_trigger(self.service_call_trigger)
        # Sync enforcement / MIRROR adoption → MIRROR starts override timer; LOCK does nothing
        self._group.sync_mode_call_handler.register_call_trigger(self.sync_call_trigger)

        _LOGGER.debug("[%s] Schedule handler setup complete (subscribed to: %s)", self._group.entity_id, self._schedule_entity)

    @callback
    def service_call_trigger(self) -> None:
        """Hook called when a genuine user command was executed (climate_call_handler)."""
        self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.SERVICE_CALL))

    @callback
    def sync_call_trigger(self) -> None:
        """Hook called when sync enforcement or MIRROR adoption was executed."""
        self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.SYNC_CALL))

    def async_teardown(self) -> None:
        """Unsubscribe from schedule entity."""
        self._unsubscribe()
        self._cancel_timer()

    def _unsubscribe(self) -> None:
        """Unsubscribe from the schedule entity."""
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    def _subscribe(self) -> None:
        """Subscribe to the schedule entity."""
        if not self._schedule_entity:
            return

        @callback
        def handle_state_change(_event):
            _LOGGER.debug("[%s] Schedule entity changed", self._group.entity_id)
            self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.SLOT))

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._schedule_entity], handle_state_change
        )

    def _cancel_timer(self) -> None:
        """Cancel the active timer (resync or schedule-override)."""
        if self._timer:
            self._timer()
            self._timer = None
            self._active_timer_type = None
            if self._group.run_state.active_override == "schedule_override":
                self._group.run_state = self._group.run_state.clear_override()

    def _start_timer(self, timer_type: str, duration_seconds: int | None = None) -> None:
        """Start a schedule timer (resync or override). Both fire schedule_listener(RESYNC)."""
        if duration_seconds is None:
            duration_seconds = 60 * (self._resync_interval if timer_type == "resync" else self._override_duration)
        if duration_seconds <= 0:
            return
        self._cancel_timer()

        if timer_type == "override":
            self._group.run_state = self._group.run_state.set_override("schedule_override", duration_seconds)
            _LOGGER.debug("[%s] Setting override: '%s' for %s seconds", self._group.entity_id, "schedule_override", duration_seconds)

        @callback
        def handle_timer_timeout(_now):
            self._timer = None
            self._active_timer_type = None
            self._group.run_state = self._group.run_state.clear_override()
            self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.RESYNC))

        self._timer = async_call_later(self._hass, duration_seconds, handle_timer_timeout)
        self._active_timer_type = timer_type
        _LOGGER.debug("[%s] %s timer started: %.0f seconds", self._group.entity_id, timer_type.capitalize(), duration_seconds)

    async def schedule_listener(self, caller: ScheduleCaller):
        """Apply schedule logic to target_state."""

        _LOGGER.debug("[%s] Schedule listener triggered by: %s", self._group.entity_id, caller)

        if not self._schedule_entity:
            return

        # Sticky Override Check (Persist Changes)
        # If user is in control and a slot transition happens, ignore the slot transition.
        if (
            caller == ScheduleCaller.SLOT 
            and self._persist_changes 
            and self.target_state.last_source not in ("schedule", None)
        ):
            _LOGGER.debug("[%s] Sticky Override active: Ignoring schedule transition", self._group.entity_id)
            return

        # Read current slot data
        slot_data = {}
        if state := self._hass.states.get(self._schedule_entity):
            if state.state == "on":
                slot_data = dict(state.attributes)

        # Process Meta-Keys: SlotMetaProcessor owns the full lifecycle (apply + track + cleanup).
        # It returns only the cleaned climate payload and a flag for the early-return guard.
        result = await self._group.slot_meta_processor.process(slot_data)
        filtered_slot = _validate_climate_payload(self._group.entity_id, result.climate_payload)

        if not filtered_slot and not result.has_meta_keys:
            # No climate payload and no meta-keys either → nothing to do at all.
            # A slot with *only* meta-keys passes this guard so the timer logic below
            # can still run (e.g. to start the resync timer).
            return

        # SERVICE_CALL and SYNC_CALL skip slot application — they only manage timers below.
        # (SERVICE_CALL = user command, SYNC_CALL = sync enforcement / MIRROR adoption)
        if caller not in (ScheduleCaller.SERVICE_CALL, ScheduleCaller.SYNC_CALL) and filtered_slot:
            current_target = self.target_state.to_dict(attributes=list(filtered_slot.keys()))
            if current_target != filtered_slot:
                self.state_manager.update(**filtered_slot)
            # SLOT/SWITCH: send only the slot attributes — avoid sending stale target_state
            # attributes that are not part of this slot (e.g. temperature when slot only sets
            # hvac_mode). RESYNC/OVERRIDE sync the full target_state intentionally.
            slot_only = caller in (ScheduleCaller.SLOT, ScheduleCaller.SWITCH)
            await self.call_handler.call_immediate(filtered_slot if slot_only else None)

        # Never touch the timer while an external override (e.g. boost) is active.
        if self._group.run_state.active_override:
            return

        # SYNC_CALL from LOCK enforcement never touches the timer — target_state was not
        # changed, so there is no "override" to track and no reason to reset the resync timer.
        # Only MIRROR/MASTER adoptions (last_source == "sync_mode") start an override timer.
        if caller == ScheduleCaller.SYNC_CALL and self.target_state.last_source != "sync_mode":
            return

        wants_override = (
            caller in (ScheduleCaller.SERVICE_CALL, ScheduleCaller.SYNC_CALL)
            and self._override_duration > 0
        )
        if wants_override:
            self._start_timer("override")
        else:
            self._start_timer("resync")

    async def update_schedule_entity(self, new_entity_id: str | None) -> None:
        """Update the active schedule entity.

        If new_entity_id is None, revert to the configured entity.
        """
        is_reset = not new_entity_id
        if is_reset:
            # Revert to config
            new_entity_id = self._group.config.get(CONF_SCHEDULE_ENTITY)
            if new_entity_id:
                _LOGGER.debug("[%s] Reverting schedule entity to configured default: %s", self._group.entity_id, new_entity_id)
            else:
                _LOGGER.debug("[%s] Disabling schedule (no entity configured in default)", self._group.entity_id)

        _LOGGER.debug("[%s] Switching schedule entity from '%s' to '%s'", self._group.entity_id, self._schedule_entity, new_entity_id)

        self._unsubscribe()
        self._schedule_entity = new_entity_id

        # Reset acts as "restore to schedule": cancel resync/schedule-override timer and abort boost.
        self._cancel_timer()
        self._group.boost_override_manager.abort()

        # A full reset (entity_id=None) also clears the group_offset so the schedule temperature
        # lands on members without the offset skewing the diff check. Without this, members that
        # were already synced to target+offset after a window-close cycle would show no diff
        # against the slot data and receive no service call.
        if is_reset and self._group.run_state.group_offset != 0.0:
            if self._group.offset_set_callback:
                await self._group.offset_set_callback(0.0)
            else:
                self._group.run_state = replace(self._group.run_state, group_offset=0.0)
            _LOGGER.debug("[%s] Reset: group_offset cleared to 0.0", self._group.entity_id)

        if self._schedule_entity:
            self._subscribe()
            await self.schedule_listener(caller=ScheduleCaller.SWITCH)
        else:
            self._cancel_timer()


    async def start_boost(self, temperature: float, duration: int) -> None:
        """Start a boost override for the given duration (minutes).

        Sets the group to the specified temperature and starts a timer.
        On expiry, reverts to the schedule slot (if available) or the
        pre-boost snapshot.
        """
        # Guard: don't start boost during global block (e.g. window open)
        if self._group.run_state.blocked:
            _LOGGER.debug("[%s] Boost rejected: global block active", self._group.entity_id)
            return

        # Save snapshot only on first boost (preserve original state)
        if self._group.run_state.active_override is None:
            self._group.run_state = replace(
                self._group.run_state,
                pre_override_snapshot=self._group.shared_target_state,
            )

        # Set active override
        self._group.run_state = replace(
            self._group.run_state,
            active_override="boost",
        )

        # Update target_state with boost temperature
        self._group.climate_state_manager.update(temperature=temperature)

        # Immediately apply to all members
        await self.call_handler.call_immediate()

        # Start override timer with explicit duration (minutes → seconds)
        self._start_timer(ScheduleCaller.OVERRIDE, duration_seconds=duration * 60)

        _LOGGER.debug(
            "[%s] Boost started: temperature=%s, duration=%s min",
            self._group.entity_id, temperature, duration,
        )


def _validate_climate_payload(entity_id: str, payload: dict) -> dict:
    """Validate climate-key values from a schedule slot and warn on type mismatches.

    Mode attributes (hvac_mode, fan_mode, etc.) must be non-empty strings.
    Numeric attributes (temperature, humidity, etc.) must be convertible to float.
    Invalid entries are dropped and a WARNING is logged so the user can fix their
    schedule configuration.
    """
    valid = {}
    for attr, value in payload.items():
        if attr in _CLIMATE_MODE_ATTRS:
            if not isinstance(value, str) or not value:
                _LOGGER.warning("[%s] Schedule slot: '%s' expects a non-empty string, got %r — ignored.", entity_id, attr, value)
                continue
        elif attr in _CLIMATE_NUMERIC_ATTRS:
            try:
                float(value)
            except (TypeError, ValueError):
                _LOGGER.warning("[%s] Schedule slot: '%s' expects a numeric value, got %r — ignored.", entity_id, attr, value)
                continue
        valid[attr] = value
    return valid


def _snapshot_to_kwargs(snapshot) -> dict:
    """Extract climate-relevant fields from a TargetState snapshot.

    Excludes metadata (last_source, last_entity, last_timestamp)
    so the restored state gets fresh provenance from the StateManager.
    """
    return {
        f.name: getattr(snapshot, f.name)
        for f in fields(ClimateState)
        if getattr(snapshot, f.name, None) is not None
    }