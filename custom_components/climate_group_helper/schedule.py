"""Schedule handler for automatic state changes based on HA Schedule entities."""

from __future__ import annotations

import logging
import asyncio
from abc import ABC, abstractmethod
import yaml  # type: ignore[import-untyped]
from dataclasses import replace
from typing import TYPE_CHECKING, Any, Callable

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
from homeassistant.const import ATTR_TEMPERATURE, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    CONF_SCHEDULE_ENTITY,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_SCHEDULE_FALLBACK_PAYLOAD,
    FLOAT_TOLERANCE,
)
from .meta_processor import MetaProcessResult


def _attr_values_match(val1: Any, val2: Any) -> bool:
    """Compare attribute values with float tolerance for numeric attributes."""
    if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
        return abs(val1 - val2) <= FLOAT_TOLERANCE
    return val1 == val2

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

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .state import ScheduleStateManager, TargetState
    from .service_call import ScheduleCallHandler


_LOGGER = logging.getLogger(__name__)


def normalize_yaml_bool_modes(payload: dict[str, Any]) -> dict[str, Any]:
    """Fix the YAML pitfall where unquoted 'on'/'off' is parsed as True/False.

    Only applied to mode attributes (hvac_mode, fan_mode, …) — numeric/other
    attributes must keep their native type.
    """
    return {
        attr: ("on" if value else "off") if attr in _CLIMATE_MODE_ATTRS and isinstance(value, bool) else value
        for attr, value in payload.items()
    }


def _parse_fallback_payload(raw: Any, entity_id: str, raise_on_error: bool = False) -> dict[str, Any]:
    """Parse and validate a fallback schedule payload (dict or YAML string)."""
    if not raw:
        return {}
    if isinstance(raw, dict):
        return normalize_yaml_bool_modes(raw)
    if isinstance(raw, str):
        cleaned = raw.strip()
        if not cleaned:
            return {}
        try:
            parsed = yaml.safe_load(cleaned)
            if isinstance(parsed, dict):
                return normalize_yaml_bool_modes(parsed)
            if parsed is None:
                return {}
            msg = f"Fallback schedule payload must be a mapping (got {type(parsed).__name__})."
            if raise_on_error:
                raise ServiceValidationError(msg)
            _LOGGER.warning("[%s] %s — ignored.", entity_id, msg)
            return {}
        except yaml.YAMLError as err:
            if raise_on_error:
                raise ServiceValidationError(f"Fallback schedule payload has invalid YAML: {err}") from err
            _LOGGER.warning("[%s] Fallback schedule payload has invalid YAML: %s — ignored.", entity_id, err)
            return {}
    msg = f"Fallback schedule payload must be a dictionary or YAML string (got {type(raw).__name__})."
    if raise_on_error:
        raise ServiceValidationError(msg)
    _LOGGER.warning("[%s] %s — ignored.", entity_id, msg)
    return {}


class ScheduleBaseHandler(ABC):
    """Shared logic for basis schedule and bypass layers.

    Drives the slot processing pipeline (on_slot_change) with pure climate
    resolution and bypass delta tracking.

    Derived classes:
    - ScheduleHandler: subscribes to the basis schedule/calendar entity.
    - ScheduleBypassHandler: subscribes to the bypass entity.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group
        self._hass = group.hass
        self._bypass_was_active: bool = False

    @property
    def state_manager(self) -> ScheduleStateManager:
        return self._group.schedule_state_manager

    @property
    def call_handler(self) -> ScheduleCallHandler:
        return self._group.schedule_call_handler

    @property
    def target_state(self) -> TargetState:
        return self._group.shared_target_state

    @property
    def slot_transition_lock(self) -> asyncio.Lock:
        """Return the shared group-level slot transition lock."""
        return self._group.slot_transition_lock

    @property
    @abstractmethod
    def schedule_entity_id(self) -> str | None:
        """Return the active basis schedule entity ID."""

    @property
    @abstractmethod
    def bypass_entity_id(self) -> str | None:
        """Return the active bypass entity ID."""

    @property
    def active_layer(self) -> str:
        """Return the currently active schedule layer ('basis' | 'bypass' | 'fallback' | 'none')."""
        bypass_eid = self.bypass_entity_id
        if bypass_eid and (bypass_state := self._hass.states.get(bypass_eid)) and bypass_state.state == "on":
            return "bypass"
        schedule_eid = self.schedule_entity_id
        if schedule_eid and (basis_state := self._hass.states.get(schedule_eid)):
            if basis_state.state == "on":
                return "basis"
            if basis_state.state == "off" and self._group.schedule_handler.fallback_payload:
                return "fallback"
        return "none"

    def parse_entity_state(self, state: Any) -> dict[str, Any]:
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

    def _validate_climate_payload(self, entity_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Filter a climate payload, dropping invalid values with a warning.

        Mode attributes (hvac_mode, fan_mode, …) must be non-empty strings.
        Numeric attributes (temperature, humidity, …) must be float-convertible.
        """
        valid = {}
        payload = normalize_yaml_bool_modes(payload)
        for attr, value in payload.items():
            if attr in _CLIMATE_MODE_ATTRS:
                if not isinstance(value, str) or not value:
                    _LOGGER.warning(
                        "[%s] Schedule slot: '%s' expects a non-empty string, got %r — ignored.",
                        entity_id, attr, value,
                    )
                    continue
            elif attr in _CLIMATE_NUMERIC_ATTRS:
                try:
                    value = float(value)
                except (TypeError, ValueError):
                    _LOGGER.warning(
                        "[%s] Schedule slot: '%s' expects a numeric value, got %r — ignored.",
                        entity_id, attr, value,
                    )
                    continue
            valid[attr] = value
        return valid

    async def on_slot_change(self) -> None:
        """Read both entity states, process meta-keys, update target_state, sync members.

        Single parameterless entry point for all slot changes. Resolves basis,
        bypass, and fallback payloads into a single write, managing the bypass
        delta for pre-value restoration.
        """
        async with self.slot_transition_lock:
            basis_state = self._hass.states.get(self.schedule_entity_id) if self.schedule_entity_id else None
            bypass_state = self._hass.states.get(self.bypass_entity_id) if self.bypass_entity_id else None

            if self.schedule_entity_id and basis_state:
                if basis_state.state == "on":
                    basis_data = self.parse_entity_state(basis_state)
                elif basis_state.state == "off" and (fallback_payload := self._group.schedule_handler.fallback_payload):
                    basis_data = dict(fallback_payload)
                else:
                    basis_data = {}
            else:
                basis_data = {}

            bypass_data = self.parse_entity_state(bypass_state) if (bypass_state and bypass_state.state == "on") else {}
            bypass_active = bypass_state is not None and bypass_state.state == "on"

            _LOGGER.debug(
                "[%s] Slot change: basis=%s, bypass=%s (bypass_active=%s)",
                self._group.entity_id, list(basis_data.keys()) or "off",
                list(bypass_data.keys()) or "off", bypass_active
            )

            result: MetaProcessResult = await self._group.slot_meta_processor.process(basis_data, bypass_data)

            basis_payload = self._validate_climate_payload(self._group.entity_id, result.climate_payload)
            bypass_payload = self._validate_climate_payload(self._group.entity_id, result.climate_bypass_payload)

            # Check if bypass delta is present from restore
            was_active = self._bypass_was_active or bool(self._group.run_state.bypass_delta)

            # Handle bypass delta lifecycle
            if bypass_active:
                if not was_active:
                    # Off -> On transition: capture pre_value from target_state for each bypass attribute
                    delta_dict = {}
                    for attr, val in bypass_payload.items():
                        pre_val = getattr(self.target_state, attr, None)
                        if pre_val is not None:
                            delta_dict[attr] = (pre_val, val)
                    self._group.run_state = self._group.run_state.set_bypass_delta(delta_dict)
                    self._bypass_was_active = True
                else:
                    # Stays on: update bypass_value in delta if bypass payload changed, preserving pre_value
                    current_delta = dict(self._group.run_state.bypass_delta)
                    updated = False
                    for attr, val in bypass_payload.items():
                        if attr in current_delta:
                            pre_val, old_byp = current_delta[attr]
                            if not _attr_values_match(old_byp, val):
                                current_delta[attr] = (pre_val, val)
                                updated = True
                        else:
                            pre_val = getattr(self.target_state, attr, None)
                            if pre_val is not None:
                                current_delta[attr] = (pre_val, val)
                                updated = True
                    if updated:
                        self._group.run_state = self._group.run_state.set_bypass_delta(current_delta)
                    self._bypass_was_active = True

                resolved = {**basis_payload, **bypass_payload}
                if resolved:
                    self.state_manager.update(**resolved)
                if not self._group.run_state.temporary_state_active and resolved:
                    await self.call_handler.call_immediate(resolved)

            else:
                # Bypass is off
                if was_active:
                    # On -> Off transition: restore pre-values from bypass_delta
                    delta = self._group.run_state.bypass_delta
                    delta_update = {
                        attr: pre_val
                        for attr, (pre_val, byp_val) in delta.items()
                        if _attr_values_match(getattr(self.target_state, attr, None), byp_val)
                    }
                    final = {**delta_update, **basis_payload}
                    self._group.run_state = self._group.run_state.clear_bypass_delta()
                    self._bypass_was_active = False

                    if final:
                        self.state_manager.update(**final)
                    if not self._group.run_state.temporary_state_active and final:
                        await self.call_handler.call_immediate(final)
                else:
                    self._bypass_was_active = False
                    if basis_payload:
                        self.state_manager.update(**basis_payload)
                    if not self._group.run_state.temporary_state_active and basis_payload:
                        await self.call_handler.call_immediate(basis_payload)


class ScheduleHandler(ScheduleBaseHandler):
    """Manages the basis schedule entity: listener lifecycle and dynamic entity switching."""

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY) if group.advanced_mode else None
        raw_fallback = group.config.get(CONF_SCHEDULE_FALLBACK_PAYLOAD, "") if group.advanced_mode else ""
        self._config_fallback_payload: dict[str, Any] = _parse_fallback_payload(
            raw_fallback, group.entity_id, raise_on_error=False
        )
        self._fallback_payload_override: dict[str, Any] | None = None
        super().__init__(group)
        self._unsub_listener: Callable[[], None] | None = None
        _LOGGER.debug(
            "[%s] Schedule basis handler initialized: basis='%s' (fallback_payload=%s)",
            self._group.entity_id, self._schedule_entity,
            list(self.fallback_payload.keys()) or "(none)",
        )

    @property
    def fallback_payload(self) -> dict[str, Any]:
        """Return the effective fallback slot payload for inactive schedule periods."""
        if self._fallback_payload_override is not None:
            return self._fallback_payload_override
        return self._config_fallback_payload

    @property
    def config_fallback_payload(self) -> dict[str, Any]:
        """Return the configured baseline fallback slot payload."""
        return self._config_fallback_payload

    @property
    def schedule_entity_id(self) -> str | None:
        """Return the active basis schedule entity ID."""
        return self._schedule_entity

    @property
    def bypass_entity_id(self) -> str | None:
        """Delegate to ScheduleBypassHandler — single source of truth."""
        return self._group.schedule_bypass_handler.bypass_entity_id

    async def async_setup(self) -> None:
        """Subscribe to the schedule entity."""
        self._subscribe()
        _LOGGER.debug(
            "[%s] Schedule handler setup complete (subscribed to: %s)",
            self._group.entity_id, self._schedule_entity
        )

    def async_teardown(self) -> None:
        """Unsubscribe from the schedule entity."""
        self._unsubscribe()

    def _subscribe(self) -> None:
        if not self._schedule_entity:
            return

        @callback
        def handle_state_change(event: Any) -> None:
            new_state = event.data.get("new_state")
            if new_state is None or new_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                return
            self._hass.async_create_task(self.on_slot_change())

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._schedule_entity], handle_state_change
        )

    def _unsubscribe(self) -> None:
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    def restore_schedule_entity(self, entity_id: str) -> None:
        """Restore active schedule entity from persisted state."""
        self._schedule_entity = entity_id

    def restore_fallback_payload(self, fallback_payload: dict[str, Any]) -> None:
        """Restore fallback payload override from persisted state."""
        self._fallback_payload_override = fallback_payload

    async def update_schedule_entity(self, new_entity_id: str | None) -> None:
        """Switch the active schedule entity at runtime (service: set_schedule_entity).

        Passing None reverts to the configured default and acts as a full reset:
        the boost is aborted and group_offset is cleared.
        Switching to a different entity preserves the current offset.
        """
        is_reset = not new_entity_id
        self._unsubscribe()
        if is_reset:
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
            await self.on_slot_change()
        else:
            # Reset to "no schedule at all": unwind the meta-key state left by the last slot.
            _LOGGER.debug(
                "[%s] Schedule reset to none — running meta-key unwind",
                self._group.entity_id,
            )
            await self.on_slot_change()

    async def update_fallback_payload(self, new_payload: Any = None) -> None:
        """Switch or reset the fallback slot payload at runtime (service: set_schedule_fallback_payload).

        Passing None, an empty string, or an empty dict clears the runtime override
        and reverts to the configured default fallback payload.
        """
        if not new_payload or (isinstance(new_payload, str) and not new_payload.strip()):
            self._fallback_payload_override = None
            _LOGGER.debug(
                "[%s] Schedule fallback payload reset to configured default: %s",
                self._group.entity_id,
                list(self._config_fallback_payload.keys()) or "(none)",
            )
        else:
            parsed = _parse_fallback_payload(new_payload, self._group.entity_id, raise_on_error=True)
            self._fallback_payload_override = parsed if parsed else None
            _LOGGER.debug(
                "[%s] Schedule fallback payload override set: %s",
                self._group.entity_id,
                list(self._fallback_payload_override.keys()) if self._fallback_payload_override else "(none, reset to config)",
            )

        self._group.async_defer_or_update_ha_state()

        if self._schedule_entity:
            await self.on_slot_change()


class ScheduleBypassHandler(ScheduleBaseHandler):
    """Manages the bypass entity lifecycle (e.g. a vacation calendar).

    The bypass layer sits above the basis schedule but below blocking sources.
    It has no timer — on_slot_change() is called directly on every state change.
    ScheduleHandler.async_setup() must run first so the basis entity is already
    subscribed when the startup check fires here.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._bypass_entity = group.config.get(CONF_SCHEDULE_BYPASS_ENTITY) if group.advanced_mode else None
        super().__init__(group)
        self._unsub_listener: Callable[[], None] | None = None
        _LOGGER.debug(
            "[%s] Schedule bypass handler initialized: bypass='%s'",
            self._group.entity_id, self._bypass_entity
        )

    @property
    def schedule_entity_id(self) -> str | None:
        """Delegate to ScheduleHandler — single source of truth."""
        return self._group.schedule_handler.schedule_entity_id

    @property
    def bypass_entity_id(self) -> str | None:
        """Return the active bypass entity ID."""
        return self._bypass_entity

    def restore_bypass_entity(self, entity_id: str) -> None:
        """Restore active bypass entity from persisted state.

        Called before async_setup() subscribes, so the restored entity is the
        one that gets subscribed to.
        """
        self._bypass_entity = entity_id

    async def async_setup(self) -> None:
        """Subscribe to the bypass entity and apply current state if already active."""
        self._subscribe()

        # HA restart while a bypass event is already running: apply the current slot now.
        if self._bypass_entity:
            if state := self._hass.states.get(self._bypass_entity):
                if state.state == "on":
                    _LOGGER.debug("[%s] Bypass entity already active at startup — applying slot", self._group.entity_id)
                    await self.on_slot_change()

        _LOGGER.debug("[%s] Bypass handler setup complete (subscribed to: %s)", self._group.entity_id, self._bypass_entity)

    def async_teardown(self) -> None:
        """Unsubscribe from the bypass entity."""
        self._unsubscribe()

    def _subscribe(self) -> None:
        if not self._bypass_entity:
            return

        @callback
        def handle_state_change(event: Any) -> None:
            new_state = event.data.get("new_state")
            if new_state is None or new_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                return
            self._hass.async_create_task(self.on_slot_change())

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._bypass_entity], handle_state_change
        )

    def _unsubscribe(self) -> None:
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def update_bypass_entity(self, new_entity_id: str | None) -> None:
        """Switch the active bypass entity at runtime (service: set_schedule_bypass_entity).

        Passing None reverts to the configured default. If no default is configured,
        the bypass layer is cleared entirely — on_slot_change() still runs once so an
        active bypass payload/delta is unwound instead of leaving the group stuck on
        the last bypass state.
        """
        self._unsubscribe()
        self._bypass_entity = new_entity_id or self._group.config.get(CONF_SCHEDULE_BYPASS_ENTITY)

        _LOGGER.debug("[%s] Bypass entity updated: %s", self._group.entity_id, self._bypass_entity or "(none)")

        if self._bypass_entity:
            self._subscribe()
        await self.on_slot_change()
