"""Schedule handler for automatic state changes based on HA Schedule entities."""

from __future__ import annotations

import logging
import yaml
from dataclasses import fields, replace
from enum import StrEnum
from typing import TYPE_CHECKING

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_PRESET_MODE,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_MODE,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
)
from homeassistant.const import ATTR_TEMPERATURE
from homeassistant.core import callback
from homeassistant.helpers.event import async_track_state_change_event, async_call_later

from .const import (
    CONF_SCHEDULE_ENTITY,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_RESYNC_INTERVAL,
    CONF_OVERRIDE_DURATION,
    CONF_PERSIST_CHANGES,
)
from .meta_processor import MetaProcessResult
from .state import ClimateState

_CLIMATE_MODE_ATTRS: frozenset[str] = frozenset(
    {
        ATTR_HVAC_MODE,
        ATTR_FAN_MODE,
        ATTR_PRESET_MODE,
        ATTR_SWING_MODE,
        ATTR_SWING_HORIZONTAL_MODE,
    }
)
_CLIMATE_NUMERIC_ATTRS: frozenset[str] = frozenset(
    {
        ATTR_TEMPERATURE,
        ATTR_TARGET_TEMP_LOW,
        ATTR_TARGET_TEMP_HIGH,
        ATTR_HUMIDITY,
    }
)


class ScheduleCaller(StrEnum):
    """Caller identifiers for schedule_listener."""

    SLOT = "slot"
    SERVICE_CALL = "service_call"  # Genuine user command (climate_call_handler)
    SYNC_CALL = (
        "sync_call"  # Sync enforcement / MIRROR adoption (sync_mode_call_handler)
    )
    RESYNC = "resync"
    SWITCH = "switch"


if TYPE_CHECKING:
    from .climate import ClimateGroup


_LOGGER = logging.getLogger(__name__)


class ScheduleBaseHandler:
    """Shared logic for basis schedule and bypass layers.

    Owns the timer slot, slot processing pipeline (_on_slot_change), and
    all helpers used by both ScheduleHandler and ScheduleBypassHandler.
    """

    def __init__(self, group: ClimateGroup) -> None:
        self._group = group
        self._hass = group.hass
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY) if group.advanced_mode else None
        self._bypass_entity = group.config.get(CONF_SCHEDULE_BYPASS_ENTITY) if group.advanced_mode else None

        self._resync_interval = group.config.get(CONF_RESYNC_INTERVAL, 0) if group.advanced_mode else 0
        self._override_duration = group.config.get(CONF_OVERRIDE_DURATION, 0) if group.advanced_mode else 0
        self._persist_changes = group.config.get(CONF_PERSIST_CHANGES, False) if group.advanced_mode else False

        # Shared timer slot — either resync or schedule-override, never both simultaneously.
        self._timer = None
        self._active_timer_type: str | None = None

        _LOGGER.debug(
            "[%s] Schedule initialized: basis='%s', bypass='%s' (resync=%sm, override=%sm, sticky=%s)",
            self._group.entity_id, self._schedule_entity, self._bypass_entity,
            self._resync_interval, self._override_duration, self._persist_changes
        )

    @property
    def state_manager(self):
        return self._group.schedule_state_manager

    @property
    def call_handler(self):
        return self._group.schedule_call_handler

    @property
    def target_state(self):
        return self._group.shared_target_state

    @property
    def schedule_entity_id(self) -> str | None:
        """Return the active basis schedule entity ID."""
        return self._schedule_entity

    @property
    def bypass_entity_id(self) -> str | None:
        """Return the active bypass entity ID."""
        return self._bypass_entity

    @callback
    def service_call_trigger(self) -> None:
        """Hook: a genuine user command was executed via climate_call_handler."""
        self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.SERVICE_CALL))

    @callback
    def sync_call_trigger(self) -> None:
        """Hook: sync enforcement or MIRROR adoption was executed."""
        self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.SYNC_CALL))

    def _parse_entity_state(self, state) -> dict:
        """Extract a slot data dict from a schedule or calendar entity.

        schedule.*: attributes are used directly.
        calendar.*: the 'description' attribute is YAML-parsed. Invalid or
                    non-mapping YAML is discarded with a warning.
        """
        if not state:
            return {}
        if state.entity_id.split(".")[0] == "calendar":
            raw = state.attributes.get("description")
            if not raw:
                return {}
            try:
                data = yaml.safe_load(raw)
            except yaml.YAMLError:
                _LOGGER.warning(
                    "[%s] Calendar description is not valid YAML — ignored. Content: %r",
                    state.entity_id, raw,
                )
                return {}
            if not isinstance(data, dict):
                _LOGGER.warning(
                    "[%s] Calendar description parsed as %s, expected a mapping — ignored.",
                    state.entity_id, type(data).__name__,
                )
                return {}
            if title := state.attributes.get("message"):
                data["message"] = title
            return data
        return dict(state.attributes)

    def _snapshot_to_kwargs(self, snapshot) -> dict:
        """Return climate-relevant fields from a TargetState snapshot.

        Metadata fields (last_source, last_entity, last_timestamp) are excluded
        so the restore gets fresh source information from the StateManager.
        """
        return {
            f.name: getattr(snapshot, f.name)
            for f in fields(ClimateState)
            if getattr(snapshot, f.name, None) is not None
        }

    def _validate_climate_payload(self, entity_id: str, payload: dict) -> dict:
        """Filter a climate payload, dropping invalid values with a warning.

        Mode attributes (hvac_mode, fan_mode, …) must be non-empty strings.
        Numeric attributes (temperature, humidity, …) must be float-convertible.
        """
        valid = {}
        for attr, value in payload.items():
            if attr in _CLIMATE_MODE_ATTRS:
                # YAML pitfall: unquoted 'on'/'off' becomes True/False.
                if isinstance(value, bool):
                    value = "on" if value else "off"
                if not isinstance(value, str) or not value:
                    _LOGGER.warning(
                        "[%s] Schedule slot: '%s' expects a non-empty string, got %r — ignored.",
                        entity_id, attr, value,
                    )
                    continue
            elif attr in _CLIMATE_NUMERIC_ATTRS:
                try:
                    float(value)
                except (TypeError, ValueError):
                    _LOGGER.warning(
                        "[%s] Schedule slot: '%s' expects a numeric value, got %r — ignored.",
                        entity_id, attr, value,
                    )
                    continue
            valid[attr] = value
        return valid

    def _cancel_timer(self) -> None:
        """Cancel the active timer and clear any associated schedule_override RunState."""
        if self._timer:
            self._timer()
            self._timer = None
            self._active_timer_type = None
            if self._group.run_state.active_override == "schedule_override":
                self._group.run_state = self._group.run_state.clear_override()

    def _start_timer(self, timer_type: str, duration_seconds: int | None = None) -> None:
        """Start a resync or override timer. Both fire schedule_listener(RESYNC) on expiry."""
        if duration_seconds is None:
            duration_seconds = 60 * (
                self._resync_interval if timer_type == "resync" else self._override_duration
            )
        if duration_seconds <= 0:
            return
        self._cancel_timer()

        if timer_type == "override":
            self._group.run_state = self._group.run_state.set_override(
                "schedule_override", duration_seconds
            )

        @callback
        def handle_timer_timeout(_now):
            self._timer = None
            self._active_timer_type = None
            self._group.run_state = self._group.run_state.clear_override()
            self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.RESYNC))

        self._timer = async_call_later(self._hass, duration_seconds, handle_timer_timeout)
        self._active_timer_type = timer_type
        _LOGGER.debug(
            "[%s] %s timer started: %.0fs",
            self._group.entity_id, timer_type.capitalize(), duration_seconds,
        )

    async def schedule_listener(self, caller: ScheduleCaller):
        """Entry point for all basis-schedule events: apply slot, manage timers."""
        _LOGGER.debug("[%s] Schedule listener triggered by: %s", self._group.entity_id, caller)

        if not self._schedule_entity:
            return

        # Sticky Override (Persist Changes): if the user is in control, ignore slot transitions.
        if (
            caller == ScheduleCaller.SLOT
            and self._persist_changes
            and self.target_state.last_source not in ("schedule", None)
        ):
            _LOGGER.debug("[%s] Sticky override active — ignoring slot transition", self._group.entity_id)
            return

        # SERVICE_CALL / SYNC_CALL only manage timers; slot state is applied for all other callers.
        if caller not in (ScheduleCaller.SERVICE_CALL, ScheduleCaller.SYNC_CALL):
            await self._on_slot_change(caller)

        # Never touch the timer while an external override (e.g. boost) is active.
        if self._group.run_state.active_override:
            return

        # While bypass is active the basis timer is suspended — bypass has no timer of its own
        # and holds priority until it deactivates.
        if self._bypass_entity:
            if state := self._hass.states.get(self._bypass_entity):
                if state.state == "on":
                    return

        # LOCK enforcement (last_source != "sync_mode") reverts a member without changing
        # target_state — no user-visible change, so the timer must not be touched.
        if caller == ScheduleCaller.SYNC_CALL and self.target_state.last_source != "sync_mode":
            return

        wants_override = (
            caller in (ScheduleCaller.SERVICE_CALL, ScheduleCaller.SYNC_CALL)
            and self._override_duration > 0
        )
        if wants_override:
            self._start_timer("override")
        else:
            self._start_timer("resync")

    async def _on_slot_change(self, caller: ScheduleCaller) -> None:
        """Read both entity states, process meta-keys, update target_state, sync members.

        Always reads the current state of both entities so the result is consistent
        regardless of which side triggered the call.
        """
        basis_state  = self._hass.states.get(self._schedule_entity) if self._schedule_entity else None
        bypass_state = self._hass.states.get(self._bypass_entity)   if self._bypass_entity   else None

        basis_data  = self._parse_entity_state(basis_state)  if (basis_state  and basis_state.state  == "on") else {}
        bypass_data = self._parse_entity_state(bypass_state) if (bypass_state and bypass_state.state == "on") else {}
        bypass_active = bypass_state is not None and bypass_state.state == "on"

        _LOGGER.debug(
            "[%s] Slot change (caller=%s): basis=%s, bypass=%s (bypass_active=%s)",
            self._group.entity_id, caller, list(basis_data.keys()) or "off",
            list(bypass_data.keys()) or "off", bypass_active
        )

        result: MetaProcessResult = await self._group.slot_meta_processor.process(basis_data, bypass_data)

        basis_payload  = self._validate_climate_payload(self._group.entity_id, result.climate_payload)
        bypass_payload = self._validate_climate_payload(self._group.entity_id, result.climate_bypass_payload)

        # Write the basis slot into target_state. ScheduleStateManager never blocks, so
        # this always lands even when a window or switch block is active — ensures the
        # correct temperature is ready for restore when the block lifts.
        if basis_payload:
            self.state_manager.update(**basis_payload)

        if bypass_active:
            # Bypass takes priority: abort any active boost, take a snapshot of the basis
            # target_state so we can restore it when bypass ends, then push the bypass payload.
            self._group.boost_override_manager.abort()

            # Only snapshot on the first bypass activation — consecutive basis-slot changes
            # while bypass is active must not overwrite the original pre-bypass state.
            if self._group.run_state.active_override is None and self._group.run_state.target_state_snapshot is None:
                self._group.run_state = replace(
                    self._group.run_state,
                    target_state_snapshot=self._group.shared_target_state,
                )
                _LOGGER.debug("[%s] Bypass activated — snapshot saved", self._group.entity_id)

            if bypass_payload:
                self.state_manager.update(**bypass_payload)
            await self.call_handler.call_immediate(bypass_payload or None)

        elif self._group.run_state.target_state_snapshot:
            # Bypass just deactivated: restore the pre-bypass basis state from the snapshot.
            snapshot = self._group.run_state.target_state_snapshot
            self._group.run_state = replace(self._group.run_state, target_state_snapshot=None)
            self.state_manager.update(**self._snapshot_to_kwargs(snapshot))
            await self.call_handler.call_immediate()
            _LOGGER.debug("[%s] Bypass deactivated — snapshot restored", self._group.entity_id)

        else:
            # No bypass: sync members with the basis payload.
            # SLOT/SWITCH send only the slot-defined attributes to avoid forwarding stale
            # target_state attrs (e.g. temperature when the slot only sets hvac_mode).
            slot_only = caller in (ScheduleCaller.SLOT, ScheduleCaller.SWITCH)
            await self.call_handler.call_immediate(basis_payload if slot_only else None)


class ScheduleHandler(ScheduleBaseHandler):
    """Manages the basis schedule entity: listener lifecycle and dynamic entity switching."""

    def __init__(self, group: ClimateGroup) -> None:
        super().__init__(group)
        self._unsub_listener = None

    async def async_setup(self) -> None:
        """Subscribe to the schedule entity and register call triggers."""
        self._subscribe()
        self._group.climate_call_handler.register_call_trigger(self.service_call_trigger)
        self._group.sync_mode_call_handler.register_call_trigger(self.sync_call_trigger)
        _LOGGER.debug(
            "[%s] Schedule handler setup complete (subscribed to: %s)",
            self._group.entity_id, self._schedule_entity
        )

    def async_teardown(self) -> None:
        """Unsubscribe from the schedule entity and cancel any active timer."""
        self._unsubscribe()
        self._cancel_timer()

    def _subscribe(self) -> None:
        if not self._schedule_entity:
            return

        @callback
        def handle_state_change(_event):
            self._hass.async_create_task(self.schedule_listener(caller=ScheduleCaller.SLOT))

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._schedule_entity], handle_state_change
        )

    def _unsubscribe(self) -> None:
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def update_schedule_entity(self, new_entity_id: str | None) -> None:
        """Switch the active schedule entity at runtime (service: set_schedule_entity).

        Passing None reverts to the configured default and acts as a full reset:
        the boost is aborted, the timer is cancelled, and group_offset is cleared.
        Switching to a different entity preserves the current offset.
        """
        is_reset = not new_entity_id
        self._unsubscribe()
        self._cancel_timer()
        self._group.boost_override_manager.abort()

        if is_reset:
            new_entity_id = self._group.config.get(CONF_SCHEDULE_ENTITY)
            _LOGGER.debug(
                "[%s] Schedule reset to configured default: %s",
                self._group.entity_id, new_entity_id or "(none)",
            )
            # Full reset clears group_offset so the slot temperature reaches members
            # without the offset skewing the diff check.
            if self._group.run_state.group_offset != 0.0:
                if self._group.offset_set_callback:
                    await self._group.offset_set_callback(0.0)
                else:
                    self._group.run_state = replace(self._group.run_state, group_offset=0.0)
        else:
            _LOGGER.debug(
                "[%s] Switching schedule entity: '%s' → '%s'",
                self._group.entity_id, self._schedule_entity, new_entity_id,
            )

        self._schedule_entity = new_entity_id or self._group.config.get(CONF_SCHEDULE_ENTITY)

        if self._schedule_entity:
            self._subscribe()
            await self.schedule_listener(caller=ScheduleCaller.SWITCH)


class ScheduleBypassHandler(ScheduleBaseHandler):
    """Manages the bypass entity lifecycle (e.g. a vacation calendar).

    The bypass layer sits above the basis schedule but below blocking sources.
    It has no timer — _on_slot_change() is called directly on every state change.
    ScheduleHandler.async_setup() must run first so the basis entity is already
    subscribed when the startup check fires here.
    """

    def __init__(self, group: ClimateGroup) -> None:
        super().__init__(group)
        self._unsub_listener = None

    async def async_setup(self) -> None:
        """Subscribe to the bypass entity and apply current state if already active."""
        self._subscribe()

        # HA restart while a bypass event is already running: apply the current slot now.
        if self._bypass_entity:
            if state := self._hass.states.get(self._bypass_entity):
                if state.state == "on":
                    _LOGGER.debug("[%s] Bypass entity already active at startup — applying slot", self._group.entity_id)
                    await self._on_slot_change(caller=ScheduleCaller.SLOT)

        _LOGGER.debug("[%s] Bypass handler setup complete (subscribed to: %s)", self._group.entity_id, self._bypass_entity)

    def async_teardown(self) -> None:
        """Unsubscribe from the bypass entity."""
        self._unsubscribe()

    def _subscribe(self) -> None:
        if not self._bypass_entity:
            return

        @callback
        def handle_state_change(_event):
            # Go directly to _on_slot_change — schedule_listener would start resync/override
            # timers that have no meaning for the bypass layer.
            self._hass.async_create_task(self._on_slot_change(caller=ScheduleCaller.SLOT))

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._bypass_entity], handle_state_change
        )

    def _unsubscribe(self) -> None:
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def update_bypass_entity(self, new_entity_id: str | None) -> None:
        """Switch the active bypass entity at runtime (service: set_schedule_bypass_entity)."""
        self._unsubscribe()
        self._bypass_entity = new_entity_id or self._group.config.get(CONF_SCHEDULE_BYPASS_ENTITY)
        _LOGGER.debug("[%s] Bypass entity updated: %s", self._group.entity_id, self._bypass_entity or "(none)")

        if self._bypass_entity:
            self._subscribe()
            await self._on_slot_change(caller=ScheduleCaller.SWITCH)
