"""Member isolation handler for climate group."""
from __future__ import annotations

import logging
from dataclasses import replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_TRIGGER,
    CONF_ISOLATION_TRIGGER_HVAC_MODES,
    MODE_MODES_MAP,
    IsolationTrigger,
)
from .service_call import BaseServiceCallHandler

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class MemberIsolationHandler:
    """Monitors an isolation trigger and manages RunState.isolated_members.

    Trigger modes:
      - DISABLED: Feature off — async_setup returns immediately.
      - SENSOR: Activates when a binary_sensor or input_boolean turns ON.
      - HVAC_MODE: Activates when target_state.hvac_mode is in the configured set.
        Hook: climate.py calls on_target_hvac_mode_changed() after every hvac_mode update.
      - MEMBER_OFF: Activates per-member when a member turns OFF manually (not via group
        command). Handled in SyncModeHandler.resync() via _maybe_isolate_off_member().
        State mutation is synchronous so LOCK enforcement immediately sees updated state.

    When the trigger activates (SENSOR / HVAC_MODE):
      1. Optionally waits for activate_delay seconds.
      2. Adds the configured entities to run_state.isolated_members.
      3. Actively turns each isolated entity OFF.

    When the trigger deactivates (SENSOR / HVAC_MODE):
      1. Optionally waits for restore_delay seconds.
      2. Removes the entities from run_state.isolated_members.
      3. Syncs each entity back to the current target_state (unless globally blocked).
    """

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the member isolation handler."""
        self._group = group
        self._hass = group.hass

        self._trigger: IsolationTrigger = IsolationTrigger(
            group.config.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
        ) if self._group.advanced_mode else IsolationTrigger.DISABLED
        self._sensor_id: str | None = group.config.get(CONF_ISOLATION_SENSOR) if self._group.advanced_mode else None
        self._trigger_hvac_modes: list[str] = group.config.get(CONF_ISOLATION_TRIGGER_HVAC_MODES, [])
        self._isolation_entity_ids: list[str] = group.config.get(CONF_ISOLATION_ENTITIES, [])
        self._activate_delay: float = group.config.get(CONF_ISOLATION_ACTIVATE_DELAY, 0) if self._group.advanced_mode else 0
        self._restore_delay: float = group.config.get(CONF_ISOLATION_RESTORE_DELAY, 0) if self._group.advanced_mode else 0

        self._unsub_listener = None
        self._pending_timer: Any = None
        self._trigger_active: bool = False

        # Per-entity call handlers — created in async_setup, keyed by entity_id
        self._call_handlers: dict[str, IsolationCallHandler] = {}

        _LOGGER.debug(
            "[%s] MemberIsolation initialized. trigger=%s, sensor=%s, hvac_modes=%s, entities=%s, activate_delay=%ss, restore_delay=%ss",
            group.entity_id, self._trigger, self._sensor_id, self._trigger_hvac_modes,
            self._isolation_entity_ids, self._activate_delay, self._restore_delay,
        )

    async def async_setup(self) -> None:
        """Subscribe to the configured trigger."""
        if self._trigger == IsolationTrigger.DISABLED:
            _LOGGER.debug("[%s] Member isolation disabled (trigger=DISABLED)", self._group.entity_id)
            return
        if self._trigger != IsolationTrigger.MEMBER_OFF and not self._isolation_entity_ids:
            _LOGGER.debug("[%s] Member isolation disabled (no entities configured)", self._group.entity_id)
            return

        # Create per-entity call handlers
        for entity_id in self._isolation_entity_ids:
            self._call_handlers[entity_id] = IsolationCallHandler(self._group, entity_id)

        if self._trigger == IsolationTrigger.MEMBER_OFF:
            _LOGGER.debug(
                "[%s] Member isolation configured for MEMBER_OFF trigger, watching: %s",
                self._group.entity_id, self._isolation_entity_ids,
            )
            return

        if self._trigger == IsolationTrigger.SENSOR:
            if not self._sensor_id:
                _LOGGER.debug("[%s] Member isolation disabled (sensor trigger but no sensor configured)", self._group.entity_id)
                return
            self._unsub_listener = async_track_state_change_event(
                self._hass, [self._sensor_id], self._state_change_listener,
            )
            _LOGGER.debug("[%s] Member isolation subscribed to sensor: %s", self._group.entity_id, self._sensor_id)
            # Check initial sensor state
            if (state := self._hass.states.get(self._sensor_id)) and state.state == STATE_ON:
                _LOGGER.debug("[%s] Isolation sensor already ON at startup, activating immediately", self._group.entity_id)
                await self._activate_isolation()
        else:
            # HVAC_MODE: no state listener — climate.py calls on_target_hvac_mode_changed() on every update.
            _LOGGER.debug("[%s] Member isolation configured for hvac_mode trigger: %s", self._group.entity_id, self._trigger_hvac_modes)
            # Check initial hvac_mode at startup (same pattern as sensor state check above)
            if self._group.shared_target_state.hvac_mode in self._trigger_hvac_modes:
                self._trigger_active = True
                _LOGGER.debug("[%s] Isolation hvac_mode already active at startup, activating immediately", self._group.entity_id)
                await self._activate_isolation()

    def async_teardown(self) -> None:
        """Unsubscribe from sensor and cancel pending timers."""
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    @callback
    def on_target_hvac_mode_changed(self, hvac_mode: str | None) -> None:
        """Called by ClimateGroup when target_state.hvac_mode changes (HVAC_MODE trigger only)."""
        if self._trigger != IsolationTrigger.HVAC_MODE or not self._trigger_hvac_modes:
            return

        now_active = hvac_mode in self._trigger_hvac_modes
        if now_active == self._trigger_active:
            return  # no change

        self._trigger_active = now_active
        _LOGGER.debug("[%s] HVAC-mode isolation trigger: hvac_mode=%s → active=%s", self._group.entity_id, hvac_mode, now_active)
        self._schedule_trigger(now_active)

    @callback
    def _state_change_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle sensor state change (SENSOR trigger only)."""
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        now_active = new_state.state == STATE_ON
        _LOGGER.debug("[%s] Isolation sensor %s changed to: %s", self._group.entity_id, self._sensor_id, new_state.state)
        self._trigger_active = now_active
        self._schedule_trigger(now_active)

    @callback
    def _schedule_trigger(self, activate: bool) -> None:
        """Cancel any pending timer and schedule activate or deactivate."""
        self._cancel_timer()
        delay = self._activate_delay if activate else self._restore_delay
        if delay > 0:
            _LOGGER.debug("[%s] Scheduling isolation %s in %.1fs", self._group.entity_id, "activation" if activate else "restore", delay)
            self._pending_timer = async_call_later(self._hass, delay, self._timer_expired)
        else:
            self._hass.async_create_task(
                self._activate_isolation() if activate else self._deactivate_isolation()
            )

    @callback
    def _timer_expired(self, _now: Any) -> None:
        """Timer callback — activate or deactivate based on current trigger state."""
        self._pending_timer = None
        self._hass.async_create_task(
            self._activate_isolation() if self._trigger_active else self._deactivate_isolation()
        )

    def _cancel_timer(self) -> None:
        """Cancel any pending activation/restore timer."""
        if self._pending_timer:
            self._pending_timer()
            self._pending_timer = None
            _LOGGER.debug("[%s] Isolation timer cancelled", self._group.entity_id)

    async def _activate_isolation(self) -> None:
        """Add entities to isolated_members and turn them OFF."""
        new_isolated = self._group.run_state.isolated_members | frozenset(self._isolation_entity_ids)
        self._group.run_state = replace(
            self._group.run_state,
            isolated_members=new_isolated,
        )
        _LOGGER.debug("[%s] Isolation activated for: %s", self._group.entity_id, self._isolation_entity_ids)

        for entity_id in self._isolation_entity_ids:
            if handler := self._call_handlers.get(entity_id):
                member_state = self._hass.states.get(entity_id)
                if member_state and member_state.state != HVACMode.OFF:
                    await handler.call_immediate({"hvac_mode": HVACMode.OFF})

        self._group.async_defer_or_update_ha_state()

    async def _deactivate_isolation(self) -> None:
        """Remove entities from isolated_members and restore to target_state."""
        new_isolated = self._group.run_state.isolated_members - frozenset(self._isolation_entity_ids)
        self._group.run_state = replace(
            self._group.run_state,
            isolated_members=new_isolated,
        )
        _LOGGER.debug("[%s] Isolation deactivated for: %s", self._group.entity_id, self._isolation_entity_ids)

        # Skip restore if globally blocked (e.g. window open) — Window Control
        # will restore all members (including the newly un-isolated one) when the block is lifted.
        if not self._group.run_state.blocked:
            for entity_id in self._isolation_entity_ids:
                if handler := self._call_handlers.get(entity_id):
                    await handler.call_immediate()

        self._group.async_defer_or_update_ha_state()

    # --- Per-member methods for MEMBER_OFF trigger ---

    def isolate_member_sync(self, entity_id: str) -> None:
        """Synchronously add a member to isolated_members (MEMBER_OFF trigger).

        Called directly from SyncModeHandler.resync() so that the LOCK enforcement
        task that runs immediately after sees the updated run_state and skips the
        member — preventing a send→echo→re-isolate loop.

        Handles the "last active member" edge case: releases all isolated members
        instead (group goes OFF naturally).
        """
        remaining_active = [
            e for e in self._group.climate_entity_ids
            if e not in self._group.run_state.isolated_members
            and e != entity_id
        ]
        if not remaining_active:
            _LOGGER.debug("[%s] Last active member %s going OFF — clearing all isolated members", self._group.entity_id, entity_id)
            self._group.run_state = replace(self._group.run_state, isolated_members=frozenset())
        else:
            new_isolated = self._group.run_state.isolated_members | frozenset([entity_id])
            self._group.run_state = replace(self._group.run_state, isolated_members=new_isolated)
            _LOGGER.debug("[%s] MEMBER_OFF: isolated %s", self._group.entity_id, entity_id)

    def release_member_sync(self, entity_id: str) -> None:
        """Synchronously remove a member from isolated_members (MEMBER_OFF trigger).

        Called from SyncModeHandler before dispatching send_restore_call() so that
        subsequent LOCK enforcement does not skip the newly active member.
        """
        new_isolated = self._group.run_state.isolated_members - frozenset([entity_id])
        self._group.run_state = replace(self._group.run_state, isolated_members=new_isolated)
        _LOGGER.debug("[%s] MEMBER_OFF: sync-released %s", self._group.entity_id, entity_id)

    async def send_restore_call(self, entity_id: str) -> None:
        """Send a restore call to a single member (MEMBER_OFF trigger).

        Called after release_member_sync() — does NOT touch run_state.
        """
        if self._group.run_state.blocked:
            return
        if handler := self._call_handlers.get(entity_id):
            await handler.call_immediate()
        self._group.async_defer_or_update_ha_state()


class IsolationCallHandler(BaseServiceCallHandler):
    """Call handler for Member Isolation operations.

    Always bypasses global blocking (blocked) and member isolation checks —
    the isolation handler itself must be able to send commands regardless of
    the current run_state state.
    """

    CONTEXT_ID = "isolation"

    def __init__(self, group: ClimateGroup, entity_id: str) -> None:
        """Initialize with a fixed target entity."""
        super().__init__(group)
        self._entity_id = entity_id

    def _is_member_blocked(self, entity_id: str) -> bool:  # noqa: ARG002
        """Never block — isolation handler bypasses all blocking."""
        return False

    def _get_capable_entities(self, attr: str, value: Any = None) -> list[str]:
        """Return only the single isolated entity (if capable)."""
        state = self._hass.states.get(self._entity_id)
        if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return []
        # For float attrs just check existence; for mode attrs check supported values
        if attr in MODE_MODES_MAP:
            supported_modes = state.attributes.get(MODE_MODES_MAP[attr], [])
            if value is not None and attr != "hvac_mode":
                if value not in supported_modes:
                    return []
            elif attr != "hvac_mode" and not supported_modes:
                return []
        elif attr not in state.attributes:
            return []
        return [self._entity_id]
