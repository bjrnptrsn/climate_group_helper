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
    CONF_DEFAULT_HVAC_MODE,
    CONF_RESTORE_ATTRS,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_TARGET_ATTRS,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DEFAULT_CLOSE_DELAY,
    DEFAULT_ROOM_OPEN_DELAY,
    DEFAULT_ZONE_OPEN_DELAY,
    WINDOW_CONTROL_MODE_OFF,
    WINDOW_CONTROL_MODE_ON,
    CONF_WINDOW_MODE,
    WindowControlMode,
)
from .state import TargetState, FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroup


_LOGGER = logging.getLogger(__name__)


class WindowControlHandler:
    """Manages dual-timer Room+Zone window control logic."""

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the window control handler."""
        self._group = group
        self._timer_cancel: Any = None
        self._unsub_listener = None

        self._window_control_mode = self._group.config.get(CONF_WINDOW_MODE, WindowControlMode.OFF)
        self._control_state = WINDOW_CONTROL_MODE_ON
        self._restore_state: TargetState | None = None
        self._filter_state: FilterState | None = FilterState.from_keys(
            self._group.config.get(CONF_RESTORE_ATTRS, CONF_TARGET_ATTRS)
        )

        # Configuration
        self._room_sensor = group.config.get(CONF_ROOM_SENSOR, '')
        self._zone_sensor = group.config.get(CONF_ZONE_SENSOR, '')
        self._room_delay = group.config.get(CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY)
        self._zone_delay = group.config.get(CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY)
        self._close_delay = group.config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY)

        self._room_open = False
        self._zone_open = False
        self._room_last_changed = None
        self._zone_last_changed = None

        _LOGGER.debug(
            "[%s] WindowControlHandler: room_sensor=%s (delay=%ds), zone_sensor=%s (delay=%ds), close_delay=%ds",
            group.entity_id, self._room_sensor, self._room_delay, self._zone_sensor, self._zone_delay, self._close_delay)

    @property
    def force_off(self) -> bool:
        """Return whether window control is active."""
        return self._control_state == WINDOW_CONTROL_MODE_OFF

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

        self._unsub_listener = async_track_state_change_event(
            self._group.hass, sensors_to_track, self._state_change_listener,
        )

        _LOGGER.debug("[%s] Window control subscribed to: %s", self._group.entity_id, sensors_to_track)

        # Check initial state
        result = self._window_control_logic()
        if result:
            mode, delay = result
            if delay <= 0:
                self._group.hass.async_create_task(self._execute_action(mode))
            else:
                self._timer_cancel = async_call_later(self._group.hass, delay, self._on_timer_expired)

    def async_teardown(self) -> None:
        """Unsubscribe from sensors and cancel timers."""
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    @callback
    def _state_change_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle sensor event – recalculate and schedule action."""
        _LOGGER.debug("[%s] Sensor event: %s", self._group.entity_id, event.data.get("entity_id"))
        
        result = self._window_control_logic()
        if result is None:
            _LOGGER.debug("[%s] Window control sensors not available", self._group.entity_id)
            self._control_state = WINDOW_CONTROL_MODE_ON
            return
        
        mode, delay = result
        self._cancel_timer()
        
        if delay > 0:
            _LOGGER.debug("[%s] Scheduling action in %.1fs", self._group.entity_id, delay)
            self._timer_cancel = async_call_later(self._group.hass, delay, self._on_timer_expired)
        else:
            self._group.hass.async_create_task(self._execute_action(mode))

    @callback
    def _on_timer_expired(self, now: Any) -> None:
        """Timer callback – recalculate and execute current action."""
        self._timer_cancel = None
        result = self._window_control_logic()
        if result:
            mode, _ = result
            self._group.hass.async_create_task(self._execute_action(mode))

    async def _execute_action(self, mode: str) -> None:
        """Execute heating ON/OFF action."""
        current_hvac = self._group.target_state.hvac_mode

        # If HVAC is already ON, do nothing
        if mode == WINDOW_CONTROL_MODE_ON and current_hvac != HVACMode.OFF:
            _LOGGER.debug("[%s] HVAC is already ON, skipping", self._group.entity_id)
            return 

        # Turn off HVAC, save snapshot of current TargetState
        elif mode == WINDOW_CONTROL_MODE_OFF and current_hvac != HVACMode.OFF:
            # TargetState is immutable (frozen dataclass), so reference is safe
            self._restore_state = self._group.target_state
            _LOGGER.debug("[%s] Saved snapshot: %s", self._group.entity_id, self._restore_state)

            self._group.target_state = self._group.target_state.update(hvac_mode=HVACMode.OFF)
            
        # Restore TargetState from snapshot (or use default HVAC mode)
        elif mode == WINDOW_CONTROL_MODE_ON and current_hvac == HVACMode.OFF:
            if not self._restore_state:
                # No snapshot - check for default HVAC mode fallback
                default_hvac_mode = self._group.config.get(CONF_DEFAULT_HVAC_MODE)
                if default_hvac_mode and default_hvac_mode != "none":
                    _LOGGER.debug("[%s] No snapshot, using default HVAC mode: %s", self._group.entity_id, default_hvac_mode)
                    self._group.target_state = self._group.target_state.update(hvac_mode=default_hvac_mode)
                else:
                    _LOGGER.debug("[%s] No snapshot to restore, skipping", self._group.entity_id)
            else:
                # Update target state with filtered snapshot
                if filtered_data := {
                    key: value for key, value in self._restore_state.to_dict().items()
                    if self._filter_state.to_dict().get(key)
                }:
                    self._group.target_state = self._group.target_state.update(**filtered_data)
                    _LOGGER.debug("[%s] Restored from snapshot (filtered): %s", self._group.entity_id, filtered_data)
                else:
                    _LOGGER.debug("[%s] No attributes to restore after filtering", self._group.entity_id)
                self._restore_state = None
            
        # Call service and update control state
        await self._group.service_call_handler.call_debounced(filter_state=self._filter_state, context_id="window_control")
        self._control_state = mode

    def _cancel_timer(self) -> None:
        """Cancel any pending timer."""
        if self._timer_cancel:
            self._timer_cancel()
            self._timer_cancel = None
            _LOGGER.debug("[%s] Timer cancelled", self._group.entity_id)

    def _window_control_logic(self) -> tuple[str, float] | None:
        """This method implements the core logic from the Smart Window Heating Control blueprint.

        Return the control mode and the timer delay.
        Return None if no sensors are configured.
        """
        self._room_open = False
        self._zone_open = False
        self._room_last_changed = None
        self._zone_last_changed = None

        # If no room sensor is configured, room is always closed
        if self._room_sensor and (state := self._group.hass.states.get(self._room_sensor)):
            self._room_open = state.state in (STATE_ON, STATE_OPEN)
            self._room_last_changed = time.time() - state.last_changed.timestamp()
        else:
            self._room_open = False
            self._room_last_changed = float("inf")

        # If no zone sensor is configured, use room sensor state
        if self._zone_sensor and (state := self._group.hass.states.get(self._zone_sensor)):
            self._zone_open = state.state in (STATE_ON, STATE_OPEN) or self._room_open
            self._zone_last_changed = time.time() - state.last_changed.timestamp()
        else:
            self._zone_open = self._room_open
            self._zone_last_changed = 0

        # If no sensors are configured, return None
        if not self._room_sensor and not self._zone_sensor:
            return None

        timer_room_open = max(self._room_delay - self._room_last_changed, 0) if self._room_open else self._room_delay
        timer_zone_open = max(self._zone_delay - self._zone_last_changed, 0) if self._zone_open else self._zone_delay
        timer_zone_close = max(self._close_delay - self._zone_last_changed, 0) if not self._zone_open else self._close_delay

        delay_room_open = min(timer_room_open, timer_zone_open) if self._room_open else None
        delay_zone_open = timer_zone_open if self._zone_open and not self._room_open else None
        delay_zone_close = timer_zone_close if not self._zone_open or not self._room_open else None

        delay = (delay_room_open or delay_zone_open or delay_zone_close) or 0
        control_mode = WINDOW_CONTROL_MODE_OFF if self._zone_open else WINDOW_CONTROL_MODE_ON

        _LOGGER.debug("[%s] Window control: mode=%s, delay=%.1fs (room_open=%s, zone_open=%s)",
            self._group.entity_id, control_mode, delay, self._room_open, self._zone_open)

        return control_mode, delay
