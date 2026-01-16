"""Schedule handler for automatic state changes based on HA Schedule entities."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_track_state_change_event

from .const import ATTR_SERVICE_MAP, CONF_SCHEDULE_ENTITY

if TYPE_CHECKING:
    from .climate import ClimateGroup


_LOGGER = logging.getLogger(__name__)


class ScheduleHandler:
    """Handles schedule-based state changes using HA Schedule entities."""

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the schedule handler."""
        self._group = group
        self._unsub_listener = None
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY)

        _LOGGER.debug("[%s] Schedule initialized: '%s'", self._group.entity_id, self._schedule_entity)

    async def async_setup(self) -> None:
        """Subscribe to schedule entity state changes."""
        if not self._schedule_entity:
            _LOGGER.debug("[%s] Schedule control disabled (no entity configured)", self._group.entity_id)
            return

        # Subscribe to schedule entity state changes
        self._unsub_listener = async_track_state_change_event(
            self._group.hass, [self._schedule_entity], self._state_change_listener
        )

        _LOGGER.debug("[%s] Schedule handler subscribed to: '%s'", self._group.entity_id, self._schedule_entity)
        # Note: Initial slot is applied by climate.py when all members are ready

    async def apply_initial_slot(self) -> None:
        """Apply the current schedule slot if active. Called by climate.py when all members ready."""
        if not self._schedule_entity:
            return
            
        if state := self._group.hass.states.get(self._schedule_entity):
            if state.state == "on":
                _LOGGER.debug("[%s] Applying initial schedule slot", self._group.entity_id)
                await self._apply_slot(state.attributes)

    def async_teardown(self) -> None:
        """Unsubscribe from schedule entity."""
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    @callback
    def _state_change_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle schedule entity state changes."""
        if (new_state := event.data.get("new_state")) is None:
            return

        _LOGGER.debug("[%s] Schedule changed: %s -> attributes=%s", self._group.entity_id, new_state.state, new_state.attributes)

        # Apply slot data if schedule is active (slot data is in direct attributes)
        if new_state.state == "on":
            self._group.hass.async_create_task(self._apply_slot(new_state.attributes))

    async def _apply_slot(self, slot_data: dict[str, Any]) -> None:
        """Apply schedule slot data to target_state."""
        if not slot_data:
            _LOGGER.debug("[%s] Empty slot data, skipping", self._group.entity_id)
            return

        # Filter to only valid attributes
        filtered_data = {
            key: value for key, value in slot_data.items()
            if key in list(ATTR_SERVICE_MAP.keys())
        }

        # Skip if no valid attributes
        if not filtered_data:
            _LOGGER.debug("[%s] No valid attributes in slot data: %s", self._group.entity_id, slot_data)
            return

        # Skip if slot data matches current target_state (no change needed)
        current_target = self._group.target_state.to_dict(attributes=list(filtered_data.keys()))
        if filtered_data == current_target:
            _LOGGER.debug("[%s] Slot data matches target_state, skipping", self._group.entity_id)
            return

        _LOGGER.info("[%s] Applying schedule slot: %s", self._group.entity_id, filtered_data)

        # Update target state and call service
        self._group.update_target_state("schedule", **filtered_data)
        await self._group.service_call_handler.call_immediate(context_id="schedule")
