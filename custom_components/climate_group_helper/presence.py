"""Presence control handler for away-fallback when a room is unoccupied."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.core import callback
from homeassistant.const import STATE_OFF, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_RETURN_DELAY,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    DEFAULT_PRESENCE_AWAY_DELAY,
    DEFAULT_PRESENCE_RETURN_DELAY,
    PresenceMode,
)
from .override import PresenceOverrideManager

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class PresenceHandler:
    """Subscribes to a presence sensor and manages the away/return delay timers.

    Delegates all blocking-source and service-call logic to PresenceOverrideManager.
    Only one timer is active at a time: either an away timer or a return timer.
    """

    def __init__(self, group: ClimateGroup) -> None:
        self._group = group
        self._hass = group.hass
        self._mode = group.config.get(CONF_PRESENCE_MODE, PresenceMode.DISABLED)
        self._sensors = group.config.get(CONF_PRESENCE_SENSOR, [])
        self._zones = group.config.get(CONF_PRESENCE_ZONE, [])
        self._away_delay = group.config.get(CONF_PRESENCE_AWAY_DELAY, DEFAULT_PRESENCE_AWAY_DELAY)
        self._return_delay = group.config.get(CONF_PRESENCE_RETURN_DELAY, DEFAULT_PRESENCE_RETURN_DELAY)

        self._timer_cancel = None
        self._unsub_listener = None
        self._away_active = False

        _LOGGER.debug(
            "[%s] PresenceHandler initialized. sensors=%s, zones=%s, away_delay=%ds, return_delay=%ds",
            group.entity_id, self._sensors, self._zones, self._away_delay, self._return_delay,
        )

    @property
    def override_manager(self) -> PresenceOverrideManager:
        return self._group.presence_override_manager

    async def async_setup(self) -> None:
        if self._mode == PresenceMode.DISABLED or not self._sensors:
            _LOGGER.debug("[%s] Presence control disabled (mode=%s, sensors=%s)", self._group.entity_id, self._mode, self._sensors)
            return

        self._unsub_listener = async_track_state_change_event(
            self._hass, self._sensors, self._state_change_listener
        )
        _LOGGER.debug("[%s] Presence control subscribed to: %s", self._group.entity_id, self._sensors)

        # Check initial collective presence
        if not self._get_collective_presence():
            _LOGGER.debug("[%s] Initial collective presence absent — activating away mode immediately", self._group.entity_id)
            await self.override_manager.activate()
            self._away_active = True

    def async_teardown(self) -> None:
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    def _get_collective_presence(self) -> bool:
        """Return True if ANY sensor indicates presence.

        Sensors not yet in the state machine (None) count as present — startup safety.
        """
        for sensor_id in self._sensors:
            state = self._hass.states.get(sensor_id)
            if state is None or self._is_present(state.state):
                return True
        return False

    def _is_present(self, state_str: str) -> bool:
        """Return True if the state indicates presence.

        Priority order:
        1. Definitive absent: off, not_home → False
        2. Safety net: unknown, unavailable → True (never trigger away on sensor errors)
        3. Zone whitelist: if zones configured, person must be in one of them
        4. Fallback: anything else (e.g. "home", "on") → True
        """
        if state_str in (STATE_OFF, "not_home"):
            return False
        if state_str in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return True
        if self._zones:
            if state_str == "home" and "zone.home" in self._zones:
                return True
            for zone_id in self._zones:
                if (zone_state := self._hass.states.get(zone_id)) and state_str == zone_state.name:
                    return True
            return False
        return True

    @callback
    def _state_change_listener(self, event) -> None:
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        present = self._get_collective_presence()
        self._cancel_timer()

        if not present and not self._away_active:
            if self._away_delay > 0:
                self._timer_cancel = async_call_later(self._hass, self._away_delay, self._on_away)
            else:
                self._hass.async_create_task(self._go_away())
        elif present and self._away_active:
            if self._return_delay > 0:
                self._timer_cancel = async_call_later(self._hass, self._return_delay, self._on_return)
            else:
                self._hass.async_create_task(self._go_restore())

    @callback
    def _on_away(self, _now) -> None:
        self._timer_cancel = None
        self._hass.async_create_task(self._go_away())

    @callback
    def _on_return(self, _now) -> None:
        self._timer_cancel = None
        self._hass.async_create_task(self._go_restore())

    async def _go_away(self) -> None:
        self._away_active = True
        await self.override_manager.activate()

    async def _go_restore(self) -> None:
        self._away_active = False
        await self.override_manager.restore()

    def _cancel_timer(self) -> None:
        if self._timer_cancel:
            self._timer_cancel()
            self._timer_cancel = None
