"""Window control handler for automatic heating shutdown when windows open."""
from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.const import (
    STATE_CLOSING,
    STATE_ON,
    STATE_OPEN,
    STATE_OPENING,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_CLOSE_DELAY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_WINDOW_MODE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DEFAULT_CLOSE_DELAY,
    DEFAULT_ROOM_OPEN_DELAY,
    DEFAULT_ZONE_OPEN_DELAY,
    META_KEY_WINDOW_MODE,
    META_VALUE_DISABLED,
    WindowControlMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .override import WindowOverrideManager
    from .state import TargetState

_LOGGER = logging.getLogger(__name__)

# Constants
WINDOW_CLOSE = "close"
WINDOW_OPEN = "open"


class WindowControlHandler:
    """Manages dual-timer Room+Zone window control logic."""

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the window control handler."""
        self._group = group
        self._hass = group.hass
        self._timer_cancel: Callable[[], None] | None = None
        self._unsub_listener: Callable[[], None] | None = None

        self._window_control_mode = self._group.config.get(CONF_WINDOW_MODE, WindowControlMode.DISABLED)
        self._control_state = WINDOW_CLOSE

        # Configuration
        self._room_sensor = group.config.get(CONF_ROOM_SENSOR)
        self._zone_sensor = group.config.get(CONF_ZONE_SENSOR)
        self._room_delay = group.config.get(CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY)
        self._zone_delay = group.config.get(CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY)
        self._close_delay = group.config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY)

        self._room_open = False
        self._zone_open = False

        _LOGGER.debug(
            "[%s] WindowControl initialized. (room: %s.open_delay: %ds), (zone: %s.open_delay: %ds), (room/zone: close_delay: %ds)",
            group.log_id, self._room_sensor, self._room_delay, self._zone_sensor, self._zone_delay, self._close_delay)

    @property
    def override_manager(self) -> WindowOverrideManager:
        return self._group.window_override_manager

    @property
    def target_state(self) -> TargetState:
        """Return the current target state (from central source)."""
        return self._group.window_control_state_manager.target_state

    @property
    def force_off(self) -> bool:
        """Return whether window control is active."""
        return self._control_state == WINDOW_OPEN

    @property
    def bypassed(self) -> bool:
        """Return True while a slot suspends the window evaluation.

        Read at call time rather than captured in __init__, so a slot can
        suspend and resume the evaluation without reloading the handler.
        """
        return (
            self._group.run_state.config_overrides.get(META_KEY_WINDOW_MODE)
            == META_VALUE_DISABLED
        )

    def async_teardown(self) -> None:
        """Unsubscribe from sensors and cancel timers."""
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def async_setup(self) -> None:
        """Subscribe to window sensor state changes."""

        # Check if window control is enabled
        if self._window_control_mode == WindowControlMode.DISABLED:
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

        # Check initial state. _control_state is intentionally left at WINDOW_CLOSE
        # here — it must only be updated inside _execute_action (like the event path),
        # otherwise _timer_expired's "mode == self._control_state" skip would suppress
        # the very activation this timer exists to trigger. The mode == self._control_state
        # skip itself still applies here, same as the event path: a window that is
        # already closed at startup (the default _control_state) must not trigger a
        # restore() broadcast to every member on each reboot.
        result = self._window_control_logic()
        if result:
            mode, delay = result
            if mode == self._control_state:
                _LOGGER.debug("[%s] Control state is already '%s' at startup, skipping", self._group.entity_id, mode)
            elif delay <= 0:
                self._hass.async_create_background_task(self._execute_action(mode), name="climate_group_window_control")
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
            self._hass.async_create_background_task(self._execute_action(mode), name="climate_group_window_control")

    @callback
    def _timer_expired(self, now: Any) -> None:
        """Timer callback – recalculate and execute current action."""
        self._timer_cancel = None
        result = self._window_control_logic()
        if result is None:
            _LOGGER.debug("[%s] Window control sensors not available on timer expiry", self._group.entity_id)
            return
        mode, _ = result
        if mode == self._control_state:
            _LOGGER.debug("[%s] Control state already '%s' on timer expiry, skipping", self._group.entity_id, mode)
            return
        if mode:
            self._hass.async_create_background_task(self._execute_action(mode), name="climate_group_window_control")

    def _cancel_timer(self) -> None:
        """Cancel any pending timer."""
        if self._timer_cancel:
            self._timer_cancel()
            self._timer_cancel = None
            _LOGGER.debug("[%s] Timer cancelled", self._group.entity_id)

    async def _execute_action(self, mode: str) -> None:
        """Execute window open/close action.

        Delegates entirely to WindowOverrideManager which owns blocking_sources
        and knows the configured window action (OFF or temperature).
        """
        # A slot may suspend the window evaluation. The guard sits before the
        # _control_state assignment on purpose: the field names the last
        # EXECUTED state, and nothing is executed here. Leaving it at the value
        # from the slot start is what lets the slot-end re-evaluation tell "the
        # window opened during the slot" from "it opened and closed again".
        if self.bypassed:
            _LOGGER.debug(
                "[%s] Window action '%s' suppressed — window_mode bypass active",
                self._group.entity_id, mode,
            )
            return

        self._control_state = mode

        if mode == WINDOW_OPEN:
            _LOGGER.debug("[%s] Window opened, activating window override", self._group.entity_id)
            await self.override_manager.activate()
        elif mode == WINDOW_CLOSE:
            _LOGGER.debug("[%s] Window closed, restoring target_state", self._group.entity_id)
            await self.override_manager.restore()

    async def apply_bypass(self) -> None:
        """Release an active window block for the duration of the slot.

        The `_control_state` write is load-bearing: it keeps the field meaning
        "last executed state", which is what lets `reevaluate()` compare against
        the block rather than against this field at slot end.
        """
        if "window" not in self._group.run_state.blocking_sources:
            return
        _LOGGER.debug(
            "[%s] window_mode bypass: releasing active window block", self._group.entity_id
        )
        self._cancel_timer()
        self._control_state = WINDOW_CLOSE
        await self.override_manager.restore()

    async def reevaluate(self) -> None:
        """Re-read the sensors and align the block with them (slot end).

        Step 3 of the bypass. Both directions are needed: the window may have
        been opened during the slot and still be open (block must go on), or it
        may have opened and closed again (block must stay off, but _control_state
        still carries the value from the slot start).

        The activate()/restore() calls carry no idempotency guard of their own —
        activate() unconditionally aborts a running boost and re-sends OFF,
        restore() unconditionally cancels and pushes target_state — so the call
        is gated on the block state actually differing from the target.
        """
        result = self._window_control_logic()
        if result is None:
            return
        mode, _ = result
        block_active = "window" in self._group.run_state.blocking_sources

        if mode == WINDOW_OPEN and not block_active:
            _LOGGER.debug(
                "[%s] window_mode bypass ended: window open → activating block",
                self._group.entity_id,
            )
            self._control_state = WINDOW_OPEN
            await self.override_manager.activate()
        elif mode == WINDOW_CLOSE and block_active:
            _LOGGER.debug(
                "[%s] window_mode bypass ended: window closed → releasing block",
                self._group.entity_id,
            )
            self._control_state = WINDOW_CLOSE
            await self.override_manager.restore()
        else:
            # Block already matches the sensors — only the bookkeeping is stale.
            self._control_state = mode

    def _window_control_logic(self) -> tuple[str, float] | None:
        """This method implements the core logic for window control.

        Return the control mode and the timer delay.
        Return None if no sensors are configured.
        """
        if not self._room_sensor and not self._zone_sensor:
            return None

        room_last_changed = float("inf")
        zone_last_changed = float("inf")

        # If no room sensor is configured, room is always closed.
        # Transient states (unavailable/unknown) preserve the last known value.
        if self._room_sensor and (state := self._hass.states.get(self._room_sensor)):
            if state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                self._room_open = state.state in (STATE_ON, STATE_OPEN, STATE_OPENING, STATE_CLOSING)
                room_last_changed = time.time() - state.last_changed.timestamp()

        # If no zone sensor is configured, use room sensor state.
        # Transient states (unavailable/unknown) preserve the last known value.
        # Zone = group of openings — the zone entity must contain the room
        # entity, so when the room opens the zone flips along: state and
        # last_changed move with the room event, the anchor stays fresh.
        if self._zone_sensor and (state := self._hass.states.get(self._zone_sensor)):
            if state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                self._zone_open = state.state in (STATE_ON, STATE_OPEN, STATE_OPENING, STATE_CLOSING) or self._room_open
                zone_last_changed = time.time() - state.last_changed.timestamp()
        elif self._zone_sensor is None:
            self._zone_open = self._room_open
            zone_last_changed = room_last_changed

        # Calculate timers
        timer_room_open = max(self._room_delay - room_last_changed, 0) if self._room_open else self._room_delay
        timer_zone_open = max(self._zone_delay - zone_last_changed, 0) if self._zone_open else self._zone_delay
        timer_zone_close = max(self._close_delay - zone_last_changed, 0) if not self._zone_open else self._close_delay

        # Calculate delays
        delay_room_open = min(timer_room_open, timer_zone_open) if self._room_open else None
        delay_zone_open = timer_zone_open if self._zone_open and not self._room_open else None
        delay_zone_close = timer_zone_close if not self._zone_open or not self._room_open else None

        # Calculate mode and delay
        mode = WINDOW_OPEN if self._zone_open or self._room_open else WINDOW_CLOSE
        delay = next((d for d in (delay_room_open, delay_zone_open, delay_zone_close) if d is not None), 0)

        _LOGGER.debug("[%s] Window control: mode=%s, delay=%.1fs (room_open=%s, zone_open=%s)",
            self._group.entity_id, mode, delay, self._room_open, self._zone_open)

        return mode, delay
