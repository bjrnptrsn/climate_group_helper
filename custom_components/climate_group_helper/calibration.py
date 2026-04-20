"""Calibration handler for Climate Group Helper."""
from __future__ import annotations

import asyncio
import logging
from datetime import timedelta
from typing import TYPE_CHECKING

from homeassistant.components.climate import ATTR_CURRENT_TEMPERATURE, HVACMode
from homeassistant.components.number import DOMAIN as NUMBER_DOMAIN
from homeassistant.const import ATTR_ENTITY_ID, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later, async_track_time_interval

from .const import (
    CALIBRATION_DEBOUNCE_DELAY,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_CALIBRATION_IGNORE_OFF,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_TEMP_UPDATE_TARGETS,
    FLOAT_TOLERANCE,
    CalibrationMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class CalibrationHandler:
    """Syncs external sensor readings to TRV calibration number entities.

    Supports three modes: ABSOLUTE (direct value), OFFSET (delta calculation),
    and SCALED (×100 integer, e.g. Danfoss Ally). Writes are debounced to avoid
    Z2M flooding; force=True (heartbeat, startup) bypasses the debounce.
    """

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the calibration handler."""
        self._group = group
        self._hass = group.hass
        self._climate_entity_ids = group.climate_entity_ids
        self._temp_sensor_entity_ids = group._temp_sensor_entity_ids
        self._humidity_sensor_entity_ids = group._humidity_sensor_entity_ids
        self._get_valid_member_states = group._get_valid_member_states

        # Configuration
        self._temp_update_target_entity_ids: list[str] = group.config.get(CONF_TEMP_UPDATE_TARGETS, [])
        self._humidity_update_target_entity_ids: list[str] = group.config.get(CONF_HUMIDITY_UPDATE_TARGETS, [])
        self._ignore_off: bool = group.config.get(CONF_CALIBRATION_IGNORE_OFF, False)
        self._temp_calibration_mode = CalibrationMode(group.config.get(CONF_TEMP_CALIBRATION_MODE, CalibrationMode.ABSOLUTE))
        self._calibration_heartbeat = int(group.config.get(CONF_CALIBRATION_HEARTBEAT, 0))

        # Runtime state
        self._heartbeat_unsub = None
        self._pending: dict[str, float | int] = {}
        self._debounce_unsub = None
        # Built in async_setup via device registry: target_entity_id → climate_member_id
        self._target_member_map: dict[str, str] = {}

    async def async_setup(self) -> None:
        """Build target→member mapping, start heartbeat timer if configured."""
        registry = er.async_get(self._hass)
        for target_id in self._temp_update_target_entity_ids:
            if (entry := registry.async_get(target_id)) and entry.device_id:
                for climate_id in self._climate_entity_ids:
                    if (c_entry := registry.async_get(climate_id)) and c_entry.device_id == entry.device_id:
                        self._target_member_map[target_id] = climate_id
                        _LOGGER.debug(
                            "[%s] Mapped calibration target %s to member %s via device %s",
                            self._group.entity_id, target_id, climate_id, entry.device_id,
                        )
                        break

        if (
            self._calibration_heartbeat > 0
            and self._temp_update_target_entity_ids
            and self._temp_sensor_entity_ids
        ):
            _LOGGER.debug("[%s] Starting calibration heartbeat: %s min", self._group.entity_id, self._calibration_heartbeat)
            self._heartbeat_unsub = async_track_time_interval(
                self._hass,
                self._heartbeat,
                timedelta(minutes=self._calibration_heartbeat),
            )

    def async_teardown(self) -> None:
        """Cancel debounce timer, cancel heartbeat timer, clear pending dict."""
        if self._heartbeat_unsub:
            self._heartbeat_unsub()
            self._heartbeat_unsub = None
        if self._debounce_unsub:
            self._debounce_unsub()
            self._debounce_unsub = None
        self._pending.clear()

    @callback
    def _heartbeat(self, _now=None) -> None:
        _LOGGER.debug("[%s] Calibration heartbeat triggered", self._group.entity_id)
        self.update("temperature", force=True)

    def update(self, domain: str, event_entity_id: str | None = None, force: bool = False) -> None:
        """Queue calibration writes for all target entities in the given domain.

        Smart-filtering: without force=True, only reacts to triggers from the
        configured sensor entities (or, in OFFSET mode, from mapped climate members).
        Writes are debounced; force=True (heartbeat, startup) flushes immediately.
        """
        if domain == "temperature":
            entity_ids = self._temp_update_target_entity_ids
            value = self._group._attr_current_temperature
            mode = self._temp_calibration_mode
        else:
            entity_ids = self._humidity_update_target_entity_ids
            value = self._group._attr_current_humidity
            mode = CalibrationMode.ABSOLUTE  # humidity is always absolute

        if not entity_ids or value is None:
            return

        # Smart-filtering: skip unless the triggering entity is relevant
        if event_entity_id and not force:
            if domain == "temperature":
                if mode == CalibrationMode.OFFSET:
                    # Sensor trigger → all targets; member trigger → only its mapped target
                    if event_entity_id not in self._temp_sensor_entity_ids:
                        if event_entity_id not in self._target_member_map.values():
                            return
                        entity_ids = [
                            target for target, member in self._target_member_map.items()
                            if member == event_entity_id
                        ]
                elif event_entity_id not in self._temp_sensor_entity_ids:
                    return
            elif event_entity_id not in self._humidity_sensor_entity_ids:
                return

        valid_states, _ = self._get_valid_member_states(entity_ids)

        for target_state in valid_states:
            # Resolve the climate member paired with this calibration target (may be None)
            member_id = self._target_member_map.get(target_state.entity_id)
            member_state = self._hass.states.get(member_id) if member_id else None

            # Skip guards
            if member_state and member_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                _LOGGER.debug(
                    "[%s] Skipping calibration update for %s because member %s is unavailable",
                    self._group.entity_id, target_state.entity_id, member_id,
                )
                continue

            if self._ignore_off and member_state and member_state.state == HVACMode.OFF:
                _LOGGER.debug(
                    "[%s] Skipping calibration update for %s because member %s is OFF (Battery Saver)",
                    self._group.entity_id, target_state.entity_id, member_id,
                )
                continue

            try:
                # Compute target value
                target_val = value
                if domain == "temperature":
                    if mode == CalibrationMode.OFFSET:
                        # Prefer the mapped member's own temperature; fall back to group average
                        ref_temp = self._group._member_temp_avg
                        if member_state and (member_temp := member_state.attributes.get(ATTR_CURRENT_TEMPERATURE)) is not None:
                            ref_temp = float(member_temp)
                        if ref_temp is None:
                            continue
                        try:
                            curr_offset = float(target_state.state)
                        except (ValueError, TypeError):
                            curr_offset = 0.0
                        target_val = value - (ref_temp - curr_offset)
                    elif mode == CalibrationMode.SCALED:
                        target_val = int(round(value * 100))

                if isinstance(target_val, float):
                    target_val = round(target_val, 1)

                # Clamp to entity min/max — prevents ServiceValidationError: out_of_range
                try:
                    entity_min = target_state.attributes.get("min")
                    entity_max = target_state.attributes.get("max")
                    clamped = target_val
                    if entity_min is not None:
                        clamped = max(float(entity_min), clamped)
                    if entity_max is not None:
                        clamped = min(float(entity_max), clamped)
                    if clamped != target_val:
                        _LOGGER.warning(
                            "[%s] Clamped calibration value for %s from %s to %s (entity range: %s–%s)",
                            self._group.entity_id, target_state.entity_id, target_val, clamped, entity_min, entity_max,
                        )
                        target_val = clamped
                except (ValueError, TypeError):
                    pass

                # Skip if already in sync
                try:
                    current_val = float(target_state.state)
                    if isinstance(target_val, int):
                        out_of_sync = current_val != target_val
                    else:
                        out_of_sync = abs(current_val - target_val) > FLOAT_TOLERANCE
                except (ValueError, TypeError):
                    out_of_sync = True  # force sync if current state is not a number

                if not (force or out_of_sync):
                    continue

                self._pending[target_state.entity_id] = target_val
            except Exception as error:
                _LOGGER.error("[%s] Error updating target entity %s: %s", self._group.entity_id, target_state.entity_id, error)
                continue

        if not self._pending:
            return

        _LOGGER.debug(
            "[%s] Queued %d calibration updates (domain=%s, mode=%s, force=%s)",
            self._group.entity_id, len(self._pending), domain, mode, force,
        )

        if force:
            self._hass.async_create_task(self._flush())
        else:
            if self._debounce_unsub:
                self._debounce_unsub()
            self._debounce_unsub = async_call_later(
                self._hass, CALIBRATION_DEBOUNCE_DELAY, self._flush
            )

    async def _flush(self, _now=None) -> None:
        """Write queued calibration values, with optional stagger delay between writes."""

        self._debounce_unsub = None
        stagger_delay = self._group.stagger_delay
        pending = list(self._pending.items())
        self._pending.clear()

        for i, (entity_id, value) in enumerate(pending):

            # Stagger delay between calls (not before first, not after last)
            if i > 0 and stagger_delay:
                await asyncio.sleep(stagger_delay)

            _LOGGER.debug("[%s] Writing calibration %s → %s", self._group.entity_id, entity_id, value)
            await self._hass.services.async_call(
                NUMBER_DOMAIN,
                "set_value",
                {ATTR_ENTITY_ID: entity_id, "value": value},
            )
