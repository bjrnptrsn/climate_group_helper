"""Window control handler for automatic heating shutdown when windows open."""
from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_ON, STATE_OPEN
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_CLOSE_DELAY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_TEMPERATURE,
    CONF_WINDOW_MODE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DEFAULT_CLOSE_DELAY,
    DEFAULT_ROOM_OPEN_DELAY,
    DEFAULT_ZONE_OPEN_DELAY,
    WindowControlAction,
    WindowControlMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)

# Constants
WINDOW_CLOSE = "close"
WINDOW_OPEN = "open"


class WindowControlHandler:
    """Manages dual-timer Room+Zone window control logic."""

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the window control handler."""
        self._group = group
        self._hass = group.hass
        self._timer_cancel: Any = None
        self._unsub_listener = None

        self._window_control_mode = self._group.config.get(CONF_WINDOW_MODE, WindowControlMode.OFF)
        self._window_action = self._group.config.get(CONF_WINDOW_ACTION, WindowControlAction.OFF)
        self._window_temperature = self._group.config.get(CONF_WINDOW_TEMPERATURE)
        self._control_state = WINDOW_CLOSE

        # Configuration
        self._room_sensor = group.config.get(CONF_ROOM_SENSOR)
        self._zone_sensor = group.config.get(CONF_ZONE_SENSOR)
        self._room_delay = group.config.get(CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY)
        self._zone_delay = group.config.get(CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY)
        self._close_delay = group.config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY)

        self._room_open = False
        self._zone_open = False
        self._room_last_changed = None
        self._zone_last_changed = None

        _LOGGER.debug(
            "[%s] WindowControl initialized. (room: %s.open_delay: %ds), (zone: %s.open_delay: %ds), (room/zone: close_delay: %ds)",
            group.entity_id, self._room_sensor, self._room_delay, self._zone_sensor, self._zone_delay, self._close_delay)

    @property
    def state_manager(self):
        """Return the specialized state manager for window control (read-only)."""
        return self._group.window_control_state_manager

    @property
    def call_handler(self):
        """Return the specialized call handler for window control operations."""
        return self._group.window_control_call_handler

    @property
    def target_state(self):
        """Return the current target state (from central source)."""
        return self.state_manager.target_state

    @property
    def force_off(self) -> bool:
        """Return whether window control is active."""
        return self._control_state == WINDOW_OPEN

    def async_teardown(self) -> None:
        """Unsubscribe from sensors and cancel timers."""
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def async_setup(self) -> None:
        """Subscribe to window sensor state changes."""

        # Check if window control is enabled
        if self._window_control_mode == WindowControlMode.OFF:
            _LOGGER.debug("[%s] Window control is disabled (window_mode=%s)", self._group.entity_id, self._window_control_mode)
            return

        sensors_to_track = []
        if self._room_sensor:
            sensors_to_track.append(self._room_sensor)
        if self._zone_sensor:
            sensors_to_track.append(self._zone_sensor)
        if not sensors_to_track:
            return

        # Subscribe to window sensor state changes
        self._unsub_listener = async_track_state_change_event(
            self._hass, sensors_to_track, self._state_change_listener,
        )

        _LOGGER.debug("[%s] Window control subscribed to: %s", self._group.entity_id, sensors_to_track)

        # Check initial state
        result = self._window_control_logic()
        if result:
            mode, delay = result
            if mode == WINDOW_OPEN:
                self._control_state = WINDOW_OPEN
            if delay <= 0:
                self._hass.async_create_task(self._execute_action(mode))
            else:
                self._timer_cancel = async_call_later(self._hass, delay, self._timer_expired)

    @callback
    def _state_change_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle sensor event – recalculate and schedule action."""
        _LOGGER.debug("[%s] Sensor event: %s", self._group.entity_id, event.data.get("entity_id"))

        result = self._window_control_logic()
        if result is None:
            _LOGGER.debug("[%s] Window control sensors not available", self._group.entity_id)
            self._control_state = WINDOW_CLOSE
            return

        mode, delay = result
        self._cancel_timer()

        # Skip timer if no action needed
        if mode == self._control_state:
            _LOGGER.debug("[%s] Control state is already '%s', skipping timer/action", self._group.entity_id, mode)
            return

        if delay > 0:
            _LOGGER.debug("[%s] Scheduling action in %.1fs", self._group.entity_id, delay)
            self._timer_cancel = async_call_later(self._hass, delay, self._timer_expired)
        else:
            self._hass.async_create_task(self._execute_action(mode))

    @callback
    def _timer_expired(self, now: Any) -> None:
        """Timer callback – recalculate and execute current action."""
        self._timer_cancel = None
        mode, _ = self._window_control_logic()
        if mode:
            self._hass.async_create_task(self._execute_action(mode))

    def _cancel_timer(self) -> None:
        """Cancel any pending timer."""
        if self._timer_cancel:
            self._timer_cancel()
            self._timer_cancel = None
            _LOGGER.debug("[%s] Timer cancelled", self._group.entity_id)

    async def _execute_action(self, mode: str) -> None:
        """Execute heating ON/OFF action.
        
        Window Control does NOT modify target_state:
        - OPEN: Forces members OFF via call_immediate
        - CLOSE: Restores members to target_state via call_immediate
        """
        # Update control state first
        self._control_state = mode

        if mode == WINDOW_OPEN:
            if self._window_action == WindowControlAction.TEMPERATURE and self._window_temperature is not None:
                _LOGGER.debug("[%s] Window opened, setting temperature to %.1f", self._group.entity_id, self._window_temperature)
                await self.call_handler.call_immediate({"temperature": self._window_temperature})
            elif self._group.hvac_mode != HVACMode.OFF:
                _LOGGER.debug("[%s] Window opened, turning HVAC OFF", self._group.entity_id)
                await self.call_handler.call_immediate({"hvac_mode": HVACMode.OFF})
            else:
                _LOGGER.debug("[%s] Window opened, HVAC already OFF in target_state", self._group.entity_id)

        elif mode == WINDOW_CLOSE:
            # Restore target_state via self.call_handler
            _LOGGER.debug("[%s] Window closed, restoring target_state", self._group.entity_id)
            await self.call_handler.call_immediate()

    def _window_control_logic(self) -> tuple[str, float] | None:
        """This method implements the core logic for window control.
        
        Return the control mode and the timer delay.
        Return None if no sensors are configured.
        """
        self._room_open = None
        self._zone_open = None
        self._room_last_changed = None
        self._zone_last_changed = None

        # If no sensors are configured, return None
        if not self._room_sensor and not self._zone_sensor:
            return None

        # If no room sensor is configured, room is always closed
        if self._room_sensor and (state := self._hass.states.get(self._room_sensor)):
            self._room_open = state.state in (STATE_ON, STATE_OPEN)
            self._room_last_changed = time.time() - state.last_changed.timestamp()
        else:
            self._room_open = False
            self._room_last_changed = float("inf")

        # If no zone sensor is configured, use room sensor state
        if self._zone_sensor and (state := self._hass.states.get(self._zone_sensor)):
            self._zone_open = state.state in (STATE_ON, STATE_OPEN) or self._room_open
            self._zone_last_changed = time.time() - state.last_changed.timestamp()
        else:
            self._zone_open = self._room_open
            self._zone_last_changed = self._room_last_changed

        # Calculate timers
        timer_room_open = max(self._room_delay - self._room_last_changed, 0) if self._room_open else self._room_delay
        timer_zone_open = max(self._zone_delay - self._zone_last_changed, 0) if self._zone_open else self._zone_delay
        timer_zone_close = max(self._close_delay - self._zone_last_changed, 0) if not self._zone_open else self._close_delay

        # Calculate delays
        delay_room_open = min(timer_room_open, timer_zone_open) if self._room_open else None
        delay_zone_open = timer_zone_open if self._zone_open and not self._room_open else None
        delay_zone_close = timer_zone_close if not self._zone_open or not self._room_open else None

        # Calculate mode and delay
        mode = WINDOW_OPEN if self._zone_open or self._room_open else WINDOW_CLOSE
        delay = (delay_room_open or delay_zone_open or delay_zone_close) or 0

        _LOGGER.debug("[%s] Window control: mode=%s, delay=%.1fs (room_open=%s, zone_open=%s)",
            self._group.entity_id, mode, delay, self._room_open, self._zone_open)

        return mode, delay