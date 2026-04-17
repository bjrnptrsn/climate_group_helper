"""Presence control handler for away-fallback when a room is unoccupied."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.const import STATE_OFF
from homeassistant.core import callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_RETURN_DELAY,
    CONF_PRESENCE_SENSOR,
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
        self._sensor = group.config.get(CONF_PRESENCE_SENSOR)
        self._away_delay = group.config.get(CONF_PRESENCE_AWAY_DELAY, DEFAULT_PRESENCE_AWAY_DELAY)
        self._return_delay = group.config.get(CONF_PRESENCE_RETURN_DELAY, DEFAULT_PRESENCE_RETURN_DELAY)
        self._timer_cancel = None
        self._unsub_listener = None
        self._away_active = False

        _LOGGER.debug(
            "[%s] PresenceHandler initialized. sensor=%s, away_delay=%ds, return_delay=%ds",
            group.entity_id, self._sensor, self._away_delay, self._return_delay,
        )

    @property
    def override_manager(self) -> PresenceOverrideManager:
        return self._group.presence_override_manager

    async def async_setup(self) -> None:
        if self._mode == PresenceMode.DISABLED or not self._sensor:
            _LOGGER.debug("[%s] Presence control disabled (mode=%s)", self._group.entity_id, self._mode)
            return

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._sensor], self._state_change_listener
        )
        _LOGGER.debug("[%s] Presence control subscribed to: %s", self._group.entity_id, self._sensor)

        # Check initial sensor state. The 5s startup block only affects SyncModeHandler
        # (target_state writes) — writing blocking_sources directly is safe here.
        if (state := self._hass.states.get(self._sensor)) and not self._is_present(state.state):
            _LOGGER.debug("[%s] Initial sensor state absent — activating away mode immediately", self._group.entity_id)
            await self.override_manager.activate()
            self._away_active = True

    def async_teardown(self) -> None:
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    @staticmethod
    def _is_present(state_str: str) -> bool:
        """Return True if the sensor indicates presence.

        Handles binary_sensor / input_boolean (on/off) and device_tracker (home/not_home).
        Any state that is not explicitly absent is treated as present — unknown sensor
        states should never trigger away mode.
        """
        return state_str not in (STATE_OFF, "not_home")

    @callback
    def _state_change_listener(self, event) -> None:
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        present = self._is_present(new_state.state)
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
