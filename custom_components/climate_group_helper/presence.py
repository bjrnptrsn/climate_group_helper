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
    META_KEY_PRESENCE_MODE,
    META_VALUE_AWAY,
    META_VALUE_DISABLED,
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
            group.log_id, self._sensors, self._zones, self._away_delay, self._return_delay,
        )

    @property
    def override_manager(self) -> PresenceOverrideManager:
        return self._group.presence_override_manager

    @property
    def mode(self) -> PresenceMode:
        """Return the CONFIGURED presence mode, ignoring any slot override.

        The slot-end cleanup runs before the override is withdrawn and has to
        know what the group falls back to — reading the effective mode there
        would see the bypass it is about to remove.
        """
        return self._mode

    @property
    def bypassed(self) -> bool:
        """Return True while a slot suspends the sensor evaluation.

        Both values of the meta-key silence the sensors; they differ only in the
        state they pin the block to (see forces_away).
        """
        return META_KEY_PRESENCE_MODE in self._group.run_state.config_overrides

    @property
    def forces_away(self) -> bool:
        """Return True while a slot pins the block to "away"."""
        return (
            self._group.run_state.config_overrides.get(META_KEY_PRESENCE_MODE)
            == META_VALUE_AWAY
        )

    @property
    def sensors(self) -> list[str]:
        """Return the list of presence sensors."""
        return self._sensors

    def get_collective_presence(self) -> bool:
        """Return True if collective presence is detected."""
        return self._get_collective_presence()

    async def async_setup(self) -> None:
        """Subscribe to the sensors and apply the presence state already in effect."""
        if self._mode == PresenceMode.DISABLED or not self._sensors:
            _LOGGER.debug("[%s] Presence control disabled (mode=%s, sensors=%s)", self._group.entity_id, self._mode, self._sensors)
            return

        self._unsub_listener = async_track_state_change_event(
            self._hass, self._sensors, self._state_change_listener
        )
        _LOGGER.debug("[%s] Presence control subscribed to: %s", self._group.entity_id, self._sensors)

        # Check initial collective presence. Skipped under an active slot bypass:
        # a restored override (schedule slot spanning the restart) already names
        # the state the block must be in, and apply_bypass() establishes it.
        if not self.bypassed and not self._get_collective_presence():
            _LOGGER.debug("[%s] Initial collective presence absent — activating away mode immediately", self._group.entity_id)
            # Set before the await, like _go_away() — the listener is already
            # subscribed above, so a sensor reporting presence while activate()
            # is in flight must see _away_active already True, or its return
            # branch clears the block and sets _away_active back to False just
            # before this line would overwrite it to True again, leaving the
            # flag desynced from reality until an unrelated return resets it.
            self._away_active = True
            await self.override_manager.activate()

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
        """Start or cancel the away/return transition when a sensor changes."""
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        # Attribute-only updates (battery reports, GPS accuracy, …) carry the same
        # state and must not restart a running timer. The away branch is guarded by
        # _away_active, but the return branch sets it to False immediately and would
        # re-arm on every event — a sensor chattier than the return delay could keep
        # the group in away mode forever. Same protection as isolation.py's sensor
        # listener.
        old_state = event.data.get("old_state")
        if old_state is not None and old_state.state == new_state.state:
            return

        # A slot may silence the sensor evaluation entirely. Both meta-key values
        # do this; they differ only in the state the block is pinned to, which
        # apply_bypass() has already established. A sensor flipping during the
        # slot changes nothing either way.
        if self.bypassed:
            _LOGGER.debug(
                "[%s] Presence sensor change ignored — presence_mode bypass active",
                self._group.entity_id,
            )
            return

        present = self._get_collective_presence()
        presence_block_active = "presence" in self._group.run_state.blocking_sources

        # The block state (blocking_sources) is the source of truth, not only
        # _away_active: the schedule meta-key `presence_mode` activates the block
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
                self._hass.async_create_background_task(self._go_away(), name="climate_group_presence_away")
        elif present and (self._away_active or presence_block_active):
            self._cancel_timer()
            self._away_active = False
            if self._return_delay > 0:
                self._timer_cancel = async_call_later(self._hass, self._return_delay, self._on_return)
            else:
                self._hass.async_create_background_task(self._go_restore(), name="climate_group_presence_restore")

    @callback
    def _on_away(self, _now: Any) -> None:
        self._timer_cancel = None
        if not self._away_active:
            return
        self._hass.async_create_background_task(self._go_away(), name="climate_group_presence_away_timer")

    @callback
    def _on_return(self, _now: Any) -> None:
        self._timer_cancel = None
        if self._away_active:
            return
        self._hass.async_create_background_task(self._go_restore(), name="climate_group_presence_restore_timer")

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
        # Slot-Away has priority: do not restore while a slot or preset pins
        # the block to away.
        if not self.forces_away:
            await self.override_manager.restore()

    async def apply_bypass(self, value: str) -> None:
        """Pull the presence block through to the state the slot names.

        The block state is the idempotency guard: this runs again on every slot
        re-processing, and activate()/restore() both act unconditionally, so an
        unguarded call would spam the members for the whole slot.

        A running away/return timer was armed from the sensor reading the slot
        now overrules — firing it mid-slot would fight the value set here.
        """
        block_active = "presence" in self._group.run_state.blocking_sources

        if value == META_VALUE_AWAY:
            if block_active:
                self._away_active = True  # adopt a foreign block as ours for the slot
                return
            _LOGGER.debug(
                "[%s] presence_mode bypass: forcing away block ON", self._group.entity_id
            )
            self._cancel_timer()
            self._away_active = True
            await self.override_manager.activate()
        elif value == META_VALUE_DISABLED:
            if not block_active:
                self._away_active = False
                return
            _LOGGER.debug(
                "[%s] presence_mode bypass: releasing away block", self._group.entity_id
            )
            self._cancel_timer()
            self._away_active = False
            await self.override_manager.restore()

    async def reevaluate(self) -> None:
        """Re-read the sensors and align the block with them (slot end).

        Step 3 of the bypass, and the point at which ownership of the block goes
        back to the sensors: whatever the slot pinned, what counts now is what
        they report. Both directions occur — after `disabled` the block is off
        and the room may have emptied, after `away` it is on and someone may be
        home.

        No away/return delay: those exist to ride out sensor blips, and the slot
        duration has already served that purpose.
        """
        if self._mode == PresenceMode.DISABLED or not self._sensors:
            return

        # Another presence key still pins the block. `presence` and
        # `presence_mode` are separate claims; when one expires while the other
        # holds, the sensors stay silenced for as long as the remaining key is
        # in force — re-evaluating would release (or re-activate) a block that
        # key owns. The caller clears the expiring key before this runs, so
        # `bypassed` here reflects only the other key.
        if self.bypassed:
            return

        present = self._get_collective_presence()
        block_active = "presence" in self._group.run_state.blocking_sources

        if not present and not block_active:
            _LOGGER.debug(
                "[%s] presence_mode bypass ended: sensors report away → activating block",
                self._group.entity_id,
            )
            self._cancel_timer()
            self._away_active = True
            await self.override_manager.activate()
        elif present and block_active:
            _LOGGER.debug(
                "[%s] presence_mode bypass ended: sensors report present → releasing block",
                self._group.entity_id,
            )
            self._cancel_timer()
            self._away_active = False
            await self.override_manager.restore()
        else:
            # Block already matches the sensors — only the flag may be stale.
            self._away_active = not present

    async def apply_meta(self, key: str, value: Any) -> None:
        """Apply the `presence_mode` meta-key (see `SlotMetaProcessor`)."""
        _LOGGER.debug("[%s] Meta-Key apply: %s=%s", self._group.entity_id, key, value)
        await self.apply_bypass(value)

    async def clear_meta(self, key: str) -> None:
        """Clean up a presence meta-key: hand the block back to the sensors.

        Withdraw the expiring key first — both paths read `config_overrides`.
        """
        self._group.run_state = self._group.run_state.clear_config_overrides({key})
        if self.mode == PresenceMode.DISABLED or not self.sensors:
            # Only if this key pinned a block. `restore()` pushes target_state
            # unconditionally, and a `disabled` key without presence control never
            # activated anything.
            if "presence" in self._group.run_state.blocking_sources:
                _LOGGER.debug(
                    "[%s] Meta-Key cleanup: %s absent, no presence control → releasing block",
                    self._group.entity_id, key,
                )
                await self._group.presence_override_manager.restore()
        else:
            _LOGGER.debug(
                "[%s] Meta-Key cleanup: %s absent → re-evaluating presence sensors",
                self._group.entity_id, key,
            )
            await self.reevaluate()

    def _cancel_timer(self) -> None:
        if self._timer_cancel:
            self._timer_cancel()
            self._timer_cancel = None
