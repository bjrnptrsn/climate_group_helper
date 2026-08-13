"""Presence control handler for away-fallback when a room is unoccupied."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.core import callback
from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_RETURN_DELAY,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    DEFAULT_PRESENCE_AWAY_DELAY,
    DEFAULT_PRESENCE_RETURN_DELAY,
    META_KEY_PRESENCE,
    PresenceMode,
)
from .override import PresenceOverrideManager

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


class PresenceHandler:
    """Subscribes to a presence sensor and manages the away/return delay timers.

    Delegates all blocking-source and service-call logic to PresenceOverrideManager.
    Only one timer is active at a time: either an away timer or a return timer.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group
        self._hass = group.hass
        self._mode = group.config.get(CONF_PRESENCE_MODE, PresenceMode.DISABLED)
        self._sensors = group.config.get(CONF_PRESENCE_SENSOR, [])
        self._zones = group.config.get(CONF_PRESENCE_ZONE, [])
        self._away_delay = group.config.get(CONF_PRESENCE_AWAY_DELAY, DEFAULT_PRESENCE_AWAY_DELAY)
        self._return_delay = group.config.get(CONF_PRESENCE_RETURN_DELAY, DEFAULT_PRESENCE_RETURN_DELAY)

        self._timer_cancel: Callable[[], None] | None = None
        self._unsub_listener: Callable[[], None] | None = None
        self._away_active = False

        _LOGGER.debug(
            "[%s] PresenceHandler initialized. sensors=%s, zones=%s, away_delay=%ds, return_delay=%ds",
            group.entity_id, self._sensors, self._zones, self._away_delay, self._return_delay,
        )

    @property
    def override_manager(self) -> PresenceOverrideManager:
        return self._group.presence_override_manager

    @property
    def mode(self) -> PresenceMode:
        """Return the presence mode."""
        return self._mode

    @property
    def sensors(self) -> list[str]:
        """Return the list of presence sensors."""
        return self._sensors

    def get_collective_presence(self) -> bool:
        """Return True if collective presence is detected."""
        return self._get_collective_presence()

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
        if state_str in (STATE_OFF, "not_home", "away"):
            return False
        if state_str in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return True
        # Binary sensors: "on" = present. Must be checked before zone matching
        # because binary_sensor states never match a zone entity ID.
        if state_str == STATE_ON:
            return True
        if self._zones:
            if state_str == "home" and "zone.home" in self._zones:
                return True
            for zone_id in self._zones:
                if state_str == zone_id:
                    return True
                if (zone_state := self._hass.states.get(zone_id)) and state_str == zone_state.name:
                    return True
            return False
        return True

    @callback
    def _state_change_listener(self, event: Any) -> None:
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        present = self._get_collective_presence()
        presence_block_active = "presence" in self._group.run_state.blocking_sources

        # The block state (blocking_sources) is the source of truth, not only
        # _away_active: the schedule meta-key `presence: away` activates the block
        # directly (bypassing this handler), so the away/restore transitions must
        # also react to blocks this handler did not start itself.
        if (
            not present
            and not self._away_active
            and (not presence_block_active or self._timer_cancel is not None)
        ):
            # A pending timer with _away_active=False is the handler's own return
            # timer — a new absence must cancel it and stay away (the block was
            # never released). A foreign (meta-key) block with no pending timer
            # is left alone.
            self._cancel_timer()
            self._away_active = True
            if self._away_delay > 0:
                self._timer_cancel = async_call_later(self._hass, self._away_delay, self._on_away)
            else:
                self._hass.async_create_task(self._go_away())
        elif present and (self._away_active or presence_block_active):
            self._cancel_timer()
            self._away_active = False
            if self._return_delay > 0:
                self._timer_cancel = async_call_later(self._hass, self._return_delay, self._on_return)
            else:
                self._hass.async_create_task(self._go_restore())

    @callback
    def _on_away(self, _now: Any) -> None:
        self._timer_cancel = None
        if not self._away_active:
            return
        self._hass.async_create_task(self._go_away())

    @callback
    def _on_return(self, _now: Any) -> None:
        self._timer_cancel = None
        if self._away_active:
            return
        self._hass.async_create_task(self._go_restore())

    async def _go_away(self) -> None:
        # TOCTOU guard: the timer fired, but someone returned before this task
        # got a scheduling slot — don't activate away against the current state.
        if self._get_collective_presence():
            return
        self._away_active = True
        await self.override_manager.activate()

    async def _go_restore(self) -> None:
        # TOCTOU guard: the return timer fired, but everyone left again before
        # this task got a scheduling slot — don't restore against the current
        # state (also avoids the spurious full restore on presence blips).
        if not self._get_collective_presence():
            return
        # Blip guard: the person returned before the away delay expired — no
        # away block was ever activated, so there is nothing to restore (a full
        # target-state push would be pure Zigbee broadcast spam).
        if "presence" not in self._group.run_state.blocking_sources:
            return
        self._away_active = False
        # Slot-Away has priority: do not restore if the slot meta-key is active
        if self._group.run_state.config_overrides.get(META_KEY_PRESENCE) != "away":
            await self.override_manager.restore()

    def _cancel_timer(self) -> None:
        if self._timer_cancel:
            self._timer_cancel()
            self._timer_cancel = None
