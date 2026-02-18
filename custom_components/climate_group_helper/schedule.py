"""Schedule handler for automatic state changes based on HA Schedule entities."""
from __future__ import annotations

import logging
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

if TYPE_CHECKING:
    from .climate import ClimateGroup


_LOGGER = logging.getLogger(__name__)


class ScheduleHandler:
    """Handles schedule-based state changes using HA Schedule entities.
    
    Architecture (Event-Driven):
    - Observes Schedule Transitions (via HA Entity)
    - Receives Service Call Triggers (User/Sync Hooks)
    - Manages Automatic Resync & Override Timers
    """

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the schedule handler."""
        self._group = group
        self._hass = group.hass
        self._unsub_listener = None
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY)

        # New Feature Options
        self._resync_interval = group.config.get(CONF_RESYNC_INTERVAL, 0)
        self._override_duration = group.config.get(CONF_OVERRIDE_DURATION, 0)
        self._persist_changes = group.config.get(CONF_PERSIST_CHANGES, False)

        # Timer
        self._timer = None

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

        # Register service call trigger
        self._group.climate_call_handler.register_call_trigger(self.service_call_trigger)
        self._group.sync_mode_call_handler.register_call_trigger(self.service_call_trigger)

        _LOGGER.debug("[%s] Schedule handler setup complete (subscribed to: %s)", self._group.entity_id, self._schedule_entity)

    @callback
    def service_call_trigger(self) -> None:
        """Hook called when a service call (e.g. user command) was executed."""
        self._hass.async_create_task(self.schedule_listener(caller="service_call"))

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
            self._hass.async_create_task(self.schedule_listener(caller="slot"))

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._schedule_entity], handle_state_change
        )

    def _cancel_timer(self) -> None:
        """Cancel the active timer (if any)."""
        if self._timer:
            self._timer()
            self._timer = None

    def _start_timer(self, timer_type: str | None = None) -> None:
        """Start an Automation Timer (Override or Resync)."""
        self._cancel_timer()

        if timer_type == "resync":
            duration = self._resync_interval
        elif timer_type == "override":
            duration = self._override_duration
        else:
            _LOGGER.error("[%s] Invalid timer type: %s", self._group.entity_id, timer_type)
            return

        if duration <= 0:
            return

        @callback
        def handle_timer_timeout(_now):
            self._hass.async_create_task(self.schedule_listener(caller=timer_type))

        self._timer = async_call_later(
            self._hass, duration * 60, handle_timer_timeout
        )
        _LOGGER.debug("[%s] %s timer started: %s minutes", self._group.entity_id, timer_type.capitalize(), duration)

    async def schedule_listener(self, caller: str):
        """Apply schedule logic to target_state."""
        if not self._schedule_entity:
            return

        _LOGGER.debug("[%s] Schedule listener triggered by: %s", self._group.entity_id, caller)

        # Sticky Override Check (Persist Changes)
        # If user is in control and a slot transition happens, ignore the slot transition.
        if (
            caller == "slot" 
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

        if caller != "service_call":
            current_target = self.target_state.to_dict(attributes=list(filtered_slot.keys()))
            if current_target != filtered_slot:
                self.state_manager.update(**filtered_slot)
            await self.call_handler.call_immediate()

        self._start_timer(
            "override"
            if caller == "service_call" and self._override_duration > 0
            else "resync"
        )

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

        if self._schedule_entity == new_entity_id:
            return

        _LOGGER.debug("[%s] Switching schedule entity from '%s' to '%s'", self._group.entity_id, self._schedule_entity, new_entity_id)

        self._unsubscribe()
        self._schedule_entity = new_entity_id
        
        if self._schedule_entity:
            self._subscribe()
            # Force immediate check
            await self.schedule_listener(caller="switch")
        else:
            self._cancel_timer()