"""Window control handler for automatic heating shutdown when windows open."""
from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_ON, STATE_OPEN, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event
from homeassistant.helpers import entity_registry as er, area_registry as ar

from .const import (
    CONF_CLOSE_DELAY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_WINDOW_MODE,
    CONF_WINDOW_SENSORS,
    CONF_WINDOW_OPEN_DELAY,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DEFAULT_CLOSE_DELAY,
    DEFAULT_ROOM_OPEN_DELAY,
    DEFAULT_ZONE_OPEN_DELAY,
    DEFAULT_WINDOW_OPEN_DELAY,
    WindowControlMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)

# Constants
WINDOW_CLOSE = "close"
WINDOW_OPEN = "open"


class WindowControlHandler:
    """Manages window control logic with area-based support."""

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the window control handler."""
        self._group = group
        self._timer_cancel: dict[str, Any] = {}  # Per-window timers
        self._unsub_listener = None

        self._window_control_mode = self._group.config.get(CONF_WINDOW_MODE, WindowControlMode.OFF)
        
        # Legacy configuration (backward compatibility)
        self._room_sensor = group.config.get(CONF_ROOM_SENSOR)
        self._zone_sensor = group.config.get(CONF_ZONE_SENSOR)
        self._room_delay = group.config.get(CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY)
        self._zone_delay = group.config.get(CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY)
        self._close_delay = group.config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY)

        # New area-based configuration
        self._window_sensors = group.config.get(CONF_WINDOW_SENSORS, [])
        self._window_open_delay = group.config.get(CONF_WINDOW_OPEN_DELAY, DEFAULT_WINDOW_OPEN_DELAY)
        
        # Track which members are turned off by which windows
        self._affected_members: dict[str, set[str]] = {}  # window_id -> set of member entity_ids

        # Legacy state tracking
        self._control_state = WINDOW_CLOSE
        self._room_open = False
        self._zone_open = False
        self._room_last_changed = None
        self._zone_last_changed = None

        _LOGGER.debug(
            "[%s] WindowControl initialized. Mode: %s, Windows: %s",
            group.entity_id, self._window_control_mode, self._window_sensors)

    @property
    def force_off(self) -> bool:
        """Return whether window control is active (legacy mode)."""
        if self._window_control_mode == WindowControlMode.AREA_BASED:
            return len(self._affected_members) > 0
        return self._control_state == WINDOW_OPEN

    def async_teardown(self) -> None:
        """Unsubscribe from sensors and cancel timers."""
        for cancel_func in self._timer_cancel.values():
            if cancel_func:
                cancel_func()
        self._timer_cancel.clear()
        
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def async_setup(self) -> None:
        """Subscribe to window sensor state changes."""
        if self._window_control_mode == WindowControlMode.OFF:
            _LOGGER.debug("[%s] Window control is disabled", self._group.entity_id)
            return

        # Area-based mode
        if self._window_control_mode == WindowControlMode.AREA_BASED:
            if not self._window_sensors:
                _LOGGER.warning("[%s] Area-based window control enabled but no sensors configured", self._group.entity_id)
                return
            
            self._unsub_listener = async_track_state_change_event(
                self._group.hass, self._window_sensors, self._area_based_listener
            )
            _LOGGER.debug("[%s] Area-based window control subscribed to: %s", self._group.entity_id, self._window_sensors)
            
            # Check initial state
            for window_id in self._window_sensors:
                await self._check_window_state(window_id)
            return

        # Legacy mode
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

        # Check initial state (legacy)
        result = self._window_control_logic()
        if result:
            mode, delay = result
            if mode == WINDOW_OPEN:
                self._control_state = WINDOW_OPEN
            if delay <= 0:
                self._group.hass.async_create_task(self._execute_action(mode))
            else:
                self._timer_cancel["legacy"] = async_call_later(self._group.hass, delay, self._timer_expired)

    @callback
    def _area_based_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle window sensor event in area-based mode."""
        window_id = event.data.get("entity_id")
        if not window_id:
            return
        
        _LOGGER.debug("[%s] Window sensor event: %s", self._group.entity_id, window_id)
        self._group.hass.async_create_task(self._check_window_state(window_id))

    async def _check_window_state(self, window_id: str) -> None:
        """Check window state and control members in the same area."""
        state = self._group.hass.states.get(window_id)
        if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return

        is_open = state.state in (STATE_ON, STATE_OPEN)
        
        if is_open:
            # Window opened - schedule turn off for members in same area
            time_since_change = time.time() - state.last_changed.timestamp()
            delay = max(self._window_open_delay - time_since_change, 0)
            
            if delay > 0:
                _LOGGER.debug("[%s] Window %s opened, scheduling turn off in %.1fs", 
                             self._group.entity_id, window_id, delay)
                # Cancel existing timer for this window
                if window_id in self._timer_cancel and self._timer_cancel[window_id]:
                    self._timer_cancel[window_id]()
                
                self._timer_cancel[window_id] = async_call_later(
                    self._group.hass, delay, 
                    lambda _: self._group.hass.async_create_task(self._turn_off_area_members(window_id))
                )
            else:
                await self._turn_off_area_members(window_id)
        else:
            # Window closed - restore members
            if window_id in self._timer_cancel and self._timer_cancel[window_id]:
                self._timer_cancel[window_id]()
                del self._timer_cancel[window_id]
            
            delay = self._close_delay
            _LOGGER.debug("[%s] Window %s closed, scheduling restore in %.1fs", 
                         self._group.entity_id, window_id, delay)
            
            self._timer_cancel[f"{window_id}_close"] = async_call_later(
                self._group.hass, delay,
                lambda _: self._group.hass.async_create_task(self._restore_area_members(window_id))
            )

    async def _turn_off_area_members(self, window_id: str) -> None:
        """Turn off climate members in the same area as the window."""
        window_area = self._get_entity_area(window_id)
        if not window_area:
            _LOGGER.warning("[%s] Cannot determine area for window %s", self._group.entity_id, window_id)
            return

        affected = set()
        for member_id in self._group.config.get("entities", []):
            member_area = self._get_entity_area(member_id)
            if member_area == window_area:
                affected.add(member_id)
        
        if not affected:
            _LOGGER.debug("[%s] No members in area '%s' for window %s", 
                         self._group.entity_id, window_area, window_id)
            return

        self._affected_members[window_id] = affected
        
        _LOGGER.info("[%s] Window %s opened in area '%s', turning off members: %s", 
                    self._group.entity_id, window_id, window_area, affected)
        
        # Turn off affected members
        for member_id in affected:
            await self._group.hass.services.async_call(
                "climate", "set_hvac_mode",
                {"entity_id": member_id, "hvac_mode": HVACMode.OFF},
                blocking=False,
                context=self._group.hass.context
            )

    async def _restore_area_members(self, window_id: str) -> None:
        """Restore climate members that were turned off by this window."""
        if window_id not in self._affected_members:
            return

        affected = self._affected_members.pop(window_id)
        
        # Check if any other window is still affecting these members
        still_affected = set()
        for other_window, other_members in self._affected_members.items():
            still_affected.update(other_members)
        
        to_restore = affected - still_affected
        
        if not to_restore:
            _LOGGER.debug("[%s] Window %s closed, but members still affected by other windows", 
                         self._group.entity_id, window_id)
            return

        _LOGGER.info("[%s] Window %s closed, restoring members: %s", 
                    self._group.entity_id, window_id, to_restore)
        
        # Restore target state for these members
        await self._group.service_call_handler.call_immediate(
            context_id="window_control",
            entity_ids=list(to_restore)
        )

    def _get_entity_area(self, entity_id: str) -> str | None:
        """Get the area ID for an entity."""
        ent_reg = er.async_get(self._group.hass)
        entity_entry = ent_reg.async_get(entity_id)
        
        if not entity_entry:
            return None
        
        # Try entity's area first
        if entity_entry.area_id:
            return entity_entry.area_id
        
        # Try device's area
        if entity_entry.device_id:
            from homeassistant.helpers import device_registry as dr
            dev_reg = dr.async_get(self._group.hass)
            device_entry = dev_reg.async_get(entity_entry.device_id)
            if device_entry and device_entry.area_id:
                return device_entry.area_id
        
        return None

    # Legacy methods below (for backward compatibility)

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
        if "legacy" in self._timer_cancel and self._timer_cancel["legacy"]:
            self._timer_cancel["legacy"]()
            del self._timer_cancel["legacy"]

        current_hvac = self._group.hvac_mode
        if mode == WINDOW_OPEN and current_hvac == HVACMode.OFF:
            _LOGGER.debug("[%s] HVAC is already OFF, skipping timer", self._group.entity_id)
            self._control_state = WINDOW_OPEN
            return
        elif mode == WINDOW_CLOSE and current_hvac != HVACMode.OFF:
            _LOGGER.debug("[%s] HVAC is already ON, skipping timer", self._group.entity_id)
            self._control_state = WINDOW_CLOSE
            return
        
        if delay > 0:
            _LOGGER.debug("[%s] Scheduling action in %.1fs", self._group.entity_id, delay)
            self._timer_cancel["legacy"] = async_call_later(self._group.hass, delay, self._timer_expired)
        else:
            self._group.hass.async_create_task(self._execute_action(mode))

    @callback
    def _timer_expired(self, now: Any) -> None:
        """Timer callback – recalculate and execute current action."""
        if "legacy" in self._timer_cancel:
            del self._timer_cancel["legacy"]
        mode, _ = self._window_control_logic()
        if mode:
            self._group.hass.async_create_task(self._execute_action(mode))

    async def _execute_action(self, mode: str) -> None:
        """Execute heating ON/OFF action (legacy mode)."""
        self._control_state = mode

        if mode == WINDOW_OPEN:
            if self._group.hvac_mode != HVACMode.OFF:
                _LOGGER.debug("[%s] Window opened, turning HVAC OFF", self._group.entity_id)
                await self._group.service_call_handler.call_hvac_off(context_id="window_control")
            else:
                _LOGGER.debug("[%s] Window opened, HVAC already OFF in target_state", self._group.entity_id)
        elif mode == WINDOW_CLOSE:
            _LOGGER.debug("[%s] Window closed, restoring target_state", self._group.entity_id)
            await self._group.service_call_handler.call_immediate(context_id="window_control")

    def _window_control_logic(self) -> tuple[str, float] | None:
        """Legacy window control logic."""
        self._room_open = None
        self._zone_open = None
        self._room_last_changed = None
        self._zone_last_changed = None

        if not self._room_sensor and not self._zone_sensor:
            return None

        if self._room_sensor and (state := self._group.hass.states.get(self._room_sensor)):
            self._room_open = state.state in (STATE_ON, STATE_OPEN)
            self._room_last_changed = time.time() - state.last_changed.timestamp()
        else:
            self._room_open = False
            self._room_last_changed = float("inf")

        if self._zone_sensor and (state := self._group.hass.states.get(self._zone_sensor)):
            self._zone_open = state.state in (STATE_ON, STATE_OPEN) or self._room_open
            self._zone_last_changed = time.time() - state.last_changed.timestamp()
        else:
            self._zone_open = self._room_open
            self._zone_last_changed = self._room_last_changed

        timer_room_open = max(self._room_delay - self._room_last_changed, 0) if self._room_open else self._room_delay
        timer_zone_open = max(self._zone_delay - self._zone_last_changed, 0) if self._zone_open else self._zone_delay
        timer_zone_close = max(self._close_delay - self._zone_last_changed, 0) if not self._zone_open else self._close_delay

        delay_room_open = min(timer_room_open, timer_zone_open) if self._room_open else None
        delay_zone_open = timer_zone_open if self._zone_open and not self._room_open else None
        delay_zone_close = timer_zone_close if not self._zone_open or not self._room_open else None

        mode = WINDOW_OPEN if self._zone_open or self._room_open else WINDOW_CLOSE
        delay = (delay_room_open or delay_zone_open or delay_zone_close) or 0

        _LOGGER.debug("[%s] Window control: mode=%s, delay=%.1fs (room_open=%s, zone_open=%s)",
            self._group.entity_id, mode, delay, self._room_open, self._zone_open)

        return mode, delay
