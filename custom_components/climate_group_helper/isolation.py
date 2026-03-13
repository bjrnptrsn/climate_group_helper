"""Member isolation handler for climate group."""
from __future__ import annotations

import logging
from dataclasses import replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_ON
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_SENSOR,
    DEFAULT_ISOLATION_ACTIVATE_DELAY,
    DEFAULT_ISOLATION_RESTORE_DELAY,
)
from .service_call import BaseServiceCallHandler

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


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
        if not state:
            return []
        # For float attrs just check existence; for mode attrs delegate to parent
        from .const import MODE_MODES_MAP  # local import to avoid circular
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


class MemberIsolationHandler:
    """Monitors an isolation sensor and manages RunState.isolated_members.

    When the sensor turns ON:
      1. Optionally waits for activate_delay seconds.
      2. Adds the configured entities to run_state.isolated_members.
      3. Actively turns each isolated entity OFF.

    When the sensor turns OFF:
      1. Optionally waits for restore_delay seconds.
      2. Removes the entities from run_state.isolated_members.
      3. Immediately syncs each entity back to the current target_state.
    """

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the member isolation handler."""
        self._group = group
        self._hass = group.hass

        self._sensor_id: str | None = group.config.get(CONF_ISOLATION_SENSOR)
        self._isolation_entity_ids: list[str] = group.config.get(CONF_ISOLATION_ENTITIES, [])
        self._activate_delay: float = group.config.get(CONF_ISOLATION_ACTIVATE_DELAY, DEFAULT_ISOLATION_ACTIVATE_DELAY)
        self._restore_delay: float = group.config.get(CONF_ISOLATION_RESTORE_DELAY, DEFAULT_ISOLATION_RESTORE_DELAY)

        self._unsub_listener = None
        self._pending_timer: Any = None

        # Per-entity call handlers (created lazily in async_setup)
        self._call_handlers: dict[str, IsolationCallHandler] = {}

        _LOGGER.debug(
            "[%s] MemberIsolation initialized. sensor=%s, entities=%s, activate_delay=%ss, restore_delay=%ss",
            group.entity_id, self._sensor_id, self._isolation_entity_ids,
            self._activate_delay, self._restore_delay,
        )

    async def async_setup(self) -> None:
        """Subscribe to isolation sensor state changes."""
        if not self._sensor_id or not self._isolation_entity_ids:
            _LOGGER.debug("[%s] Member isolation disabled (no sensor or entities configured)", self._group.entity_id)
            return

        # Create per-entity call handlers
        for entity_id in self._isolation_entity_ids:
            self._call_handlers[entity_id] = IsolationCallHandler(self._group, entity_id)

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._sensor_id], self._state_change_listener,
        )
        _LOGGER.debug("[%s] Member isolation subscribed to sensor: %s", self._group.entity_id, self._sensor_id)

        # Check initial sensor state
        if (state := self._hass.states.get(self._sensor_id)) and state.state == STATE_ON:
            _LOGGER.debug("[%s] Isolation sensor already ON at startup, activating immediately", self._group.entity_id)
            await self._activate_isolation()

    def async_teardown(self) -> None:
        """Unsubscribe from sensor and cancel pending timers."""
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    @callback
    def _state_change_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle sensor state change."""
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        _LOGGER.debug("[%s] Isolation sensor %s changed to: %s", self._group.entity_id, self._sensor_id, new_state.state)
        self._cancel_timer()

        if new_state.state == STATE_ON:
            if self._activate_delay > 0:
                _LOGGER.debug("[%s] Scheduling isolation activation in %.1fs", self._group.entity_id, self._activate_delay)
                self._pending_timer = async_call_later(self._hass, self._activate_delay, self._timer_activate)
            else:
                self._hass.async_create_task(self._activate_isolation())
        else:
            if self._restore_delay > 0:
                _LOGGER.debug("[%s] Scheduling isolation restore in %.1fs", self._group.entity_id, self._restore_delay)
                self._pending_timer = async_call_later(self._hass, self._restore_delay, self._timer_restore)
            else:
                self._hass.async_create_task(self._deactivate_isolation())

    @callback
    def _timer_activate(self, _now: Any) -> None:
        """Timer callback for delayed activation."""
        self._pending_timer = None
        self._hass.async_create_task(self._activate_isolation())

    @callback
    def _timer_restore(self, _now: Any) -> None:
        """Timer callback for delayed restore."""
        self._pending_timer = None
        self._hass.async_create_task(self._deactivate_isolation())

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
            handler = self._call_handlers.get(entity_id)
            if handler is None:
                continue
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
