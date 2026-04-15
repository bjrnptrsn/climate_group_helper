"""Schedule handler for automatic state changes based on HA Schedule entities."""
from __future__ import annotations

import logging
from dataclasses import fields, replace
from enum import StrEnum
from typing import TYPE_CHECKING

from homeassistant.core import callback
from homeassistant.helpers.event import async_track_state_change_event, async_call_later

from .const import (
    ATTR_SERVICE_MAP,
    CONF_SCHEDULE_ENTITY,
    CONF_RESYNC_INTERVAL,
    CONF_OVERRIDE_DURATION,
    CONF_PERSIST_CHANGES,
)
from .state import ClimateState


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
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY)

        # Feature Options
        self._resync_interval = group.config.get(CONF_RESYNC_INTERVAL, 0)
        self._override_duration = group.config.get(CONF_OVERRIDE_DURATION, 0)
        self._persist_changes = group.config.get(CONF_PERSIST_CHANGES, False)

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

    def _start_timer(self, timer_type: str) -> None:
        """Start a schedule timer (resync or override). Both fire schedule_listener(RESYNC)."""
        duration_seconds = 60 * (self._resync_interval if timer_type == "resync" else self._override_duration)
        if duration_seconds <= 0:
            return
        self._cancel_timer()

        if timer_type == "override":
            self._group.run_state = self._group.run_state.set_override("schedule_override", duration_seconds)

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
                slot_data = state.attributes

        filtered_slot = {
            key: value for key, value in slot_data.items()
            if key in list(ATTR_SERVICE_MAP.keys())
        }

        if not filtered_slot:
            return

        # SERVICE_CALL and SYNC_CALL skip slot application — they only manage timers below.
        # (SERVICE_CALL = user command, SYNC_CALL = sync enforcement / MIRROR adoption)
        if caller not in (ScheduleCaller.SERVICE_CALL, ScheduleCaller.SYNC_CALL):
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
        if not new_entity_id:
            # Revert to config
            new_entity_id = self._group.config.get(CONF_SCHEDULE_ENTITY)
            if new_entity_id:
                _LOGGER.debug("[%s] Reverting schedule entity to configured default: %s", self._group.entity_id, new_entity_id)
            else:
                _LOGGER.debug("[%s] Disabling schedule (no entity configured in default)", self._group.entity_id)

        _LOGGER.debug("[%s] Switching schedule entity from '%s' to '%s'", self._group.entity_id, self._schedule_entity, new_entity_id)

        self._unsubscribe()
        self._schedule_entity = new_entity_id

        # Reset acts as "restore to schedule": cancel any active schedule override timer.
        self._cancel_timer()

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
        self._start_timer(ScheduleCaller.OVERRIDE, explicit_duration=duration * 60)

        _LOGGER.debug(
            "[%s] Boost started: temperature=%s, duration=%s min",
            self._group.entity_id, temperature, duration,
        )


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