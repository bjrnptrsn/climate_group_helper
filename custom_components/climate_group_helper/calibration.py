"""Calibration handler for Climate Group Helper."""
from __future__ import annotations

import asyncio
import logging
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.components.climate import ATTR_CURRENT_TEMPERATURE, HVACMode
from homeassistant.components.number import DOMAIN as NUMBER_DOMAIN
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.event import async_track_time_interval

from .const import (
    CONF_CALIBRATION_HEARTBEAT,
    CONF_CALIBRATION_IGNORE_OFF,
    CONF_TEMP_CALIBRATION_MODE,
    FLOAT_TOLERANCE,
    META_KEY_CALIBRATION_MODE,
    META_VALUE_DISABLED,
    CalibrationMode,
)
from .state import is_available

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


class CalibrationHandler:
    """Syncs external sensor readings to TRV calibration number entities.

    Supports three modes: ABSOLUTE (direct value), OFFSET (delta calculation),
    and SCALED (×100 integer, e.g. Danfoss Ally). Writes are batched via a
    Debouncer to prevent Z2M flooding from rapid sensor updates. force_sync=True
    (startup, heartbeat) skips the out-of-sync check so all targets are written
    regardless of their current state.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the calibration handler."""
        self._group = group
        self._hass = group.hass

        # The member, sensor and calibration-target lists are read off the group
        # at call time, never copied here: this runs in the entity's __init__,
        # while `strip_self_reference()` and `filter_sensor_entities()` replace
        # those lists later in `async_added_to_hass` (loop protection). A copy
        # taken now would keep the unfiltered list and write to a CGH entity the
        # group itself has rejected — in a real setup its own offset slider.
        self._ignore_off: bool = group.config.get(CONF_CALIBRATION_IGNORE_OFF, False)
        self._temp_calibration_mode = CalibrationMode(group.config.get(CONF_TEMP_CALIBRATION_MODE, CalibrationMode.ABSOLUTE))
        self._calibration_heartbeat = int(group.config.get(CONF_CALIBRATION_HEARTBEAT, 0))

        # Runtime state
        self._heartbeat_unsub: Callable[[], None] | None = None
        self._pending: dict[str, float | int] = {}
        self._debouncer: Debouncer[Any] | None = None
        # Built in async_setup via device registry: target_entity_id → climate_member_id
        self._target_member_map: dict[str, str] = {}

    async def async_setup(self) -> None:
        """Build target→member mapping, start heartbeat timer if configured."""
        registry = er.async_get(self._hass)
        all_target_ids = [
            *self._group.temp_update_target_entity_ids,
            *self._group.humidity_update_target_entity_ids,
        ]
        for target_id in all_target_ids:
            if (entry := registry.async_get(target_id)) and entry.device_id:
                for climate_id in self._group.climate_entity_ids:
                    if (c_entry := registry.async_get(climate_id)) and c_entry.device_id == entry.device_id:
                        self._target_member_map[target_id] = climate_id
                        _LOGGER.debug(
                            "[%s] Mapped calibration target %s to member %s via device %s",
                            self._group.entity_id, target_id, climate_id, entry.device_id,
                        )
                        break
            if target_id not in self._target_member_map:
                _LOGGER.debug(
                    "[%s] Calibration target %s shares no device with any group member — "
                    "member-specific handling (OFFSET reference, ignore-off, isolation) unavailable",
                    self._group.entity_id, target_id,
                )

        if (
            self._calibration_heartbeat > 0
            and self._group.temp_update_target_entity_ids
            and self._group.temp_sensor_entity_ids
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
        if self._debouncer:
            self._debouncer.async_shutdown()
            self._debouncer = None
        self._pending.clear()

    @property
    def bypassed(self) -> bool:
        """Return True while a slot suspends calibration writes.

        Read at call time rather than captured in __init__, so a slot can
        suspend and resume writes without reloading the handler — the same
        pattern the other meta-keys use for their handler modes.
        """
        return (
            self._group.run_state.config_overrides.get(META_KEY_CALIBRATION_MODE)
            == META_VALUE_DISABLED
        )

    @callback
    def _heartbeat(self, _now: Any) -> None:
        _LOGGER.debug("[%s] Calibration heartbeat triggered", self._group.entity_id)
        self.update("temperature", force_sync=True)
        self.update("humidity", force_sync=True)

    def _skip_reason(self, target_entity_id: str) -> str | None:
        """Return why this target's member must not be written to, or None.

        Evaluated twice per write: once when the value is queued and again when
        it is flushed. The second pass is what makes the guards hold — a member
        can go OFF or unavailable while a batch is in flight, and the Debouncer
        drops any trigger arriving during a flush, so nothing would correct the
        already-queued value. Writing it anyway is the zigbee wake-up that
        Battery Saver exists to prevent.
        """
        member_id = self._target_member_map.get(target_entity_id)
        if not member_id:
            return None

        if member_id in self._group.run_state.isolated_members:
            return "isolated"

        member_state = self._hass.states.get(member_id)
        if member_state is None:
            return None
        if not is_available(member_state):
            return "unavailable"
        if self._ignore_off and member_state.state == HVACMode.OFF:
            return "OFF (Battery Saver)"
        return None

    def update(self, domain: str, event_entity_id: str | None = None, force_sync: bool = False) -> None:
        """Queue calibration writes for all target entities in the given domain.

        event_entity_id: the entity that triggered the update (used for smart-filtering).
          - None → always runs (startup, heartbeat).
          - sensor entity → updates all targets (ABSOLUTE/SCALED) or all targets (OFFSET).
          - member entity → OFFSET only: updates only the target mapped to that member.
          - anything else → skipped (irrelevant trigger).

        force_sync=True skips the out-of-sync check so all targets are written even
        if their current state already matches. Used by startup and heartbeat.

        A slot may suspend calibration writes entirely; the sensors keep running,
        so the values resume from their current readings when the slot ends.
        """
        if self.bypassed:
            return

        if domain == "temperature":
            entity_ids = self._group.temp_update_target_entity_ids
            value = self._group._attr_current_temperature
            mode = self._temp_calibration_mode
        elif domain == "humidity":
            entity_ids = self._group.humidity_update_target_entity_ids
            value = self._group._attr_current_humidity
            mode = CalibrationMode.ABSOLUTE
        else:
            return

        if not entity_ids or value is None:
            return

        # Smart-filtering: skip unless the triggering entity is relevant
        if event_entity_id:
            if domain == "temperature":
                if mode == CalibrationMode.OFFSET:
                    # Sensor trigger → all targets; member trigger → only its mapped target.
                    # Restricted to `entity_ids` (already the temperature-domain targets) —
                    # `_target_member_map` also holds humidity targets on the same device,
                    # which must never receive a temperature-computed OFFSET value.
                    if event_entity_id not in self._group.temp_sensor_entity_ids:
                        if event_entity_id not in self._target_member_map.values():
                            return
                        entity_ids = [
                            target for target in entity_ids
                            if self._target_member_map.get(target) == event_entity_id
                        ]
                elif event_entity_id not in self._group.temp_sensor_entity_ids:
                    return
            elif event_entity_id not in self._group.humidity_sensor_entity_ids:
                return

        valid_states, _ = self._group.aggregator._get_valid_member_states(entity_ids)

        for target_state in valid_states:
            # Resolve the climate member paired with this calibration target (may be None)
            member_id = self._target_member_map.get(target_state.entity_id)
            member_state = self._hass.states.get(member_id) if member_id else None

            if reason := self._skip_reason(target_state.entity_id):
                _LOGGER.debug(
                    "[%s] Skipping calibration update for %s because member %s is %s",
                    self._group.entity_id, target_state.entity_id, member_id, reason,
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
                    # Restore the original type: SCALED produces an int, but the
                    # float() comparisons above turn a clamped value into a float,
                    # which would flip the tolerance branch below and send a float
                    # to a number entity that expects an integer.
                    if isinstance(target_val, int) and not isinstance(clamped, int):
                        clamped = int(round(clamped))
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
                    tolerance = FLOAT_TOLERANCE * 100 if isinstance(target_val, int) else FLOAT_TOLERANCE
                    out_of_sync = abs(current_val - target_val) > tolerance
                except (ValueError, TypeError):
                    out_of_sync = True  # force sync if current state is not a number

                if not (force_sync or out_of_sync):
                    continue

                self._pending[target_state.entity_id] = target_val
            except Exception:
                _LOGGER.exception("[%s] Error updating target entity %s", self._group.entity_id, target_state.entity_id)
                continue

        if not self._pending:
            return

        _LOGGER.debug(
            "[%s] Queued %d calibration updates (domain=%s, mode=%s, force_sync=%s, trigger=%s)",
            self._group.entity_id, len(self._pending), domain, mode, force_sync, event_entity_id,
        )

        if not self._debouncer:
            self._debouncer = Debouncer(
                hass=self._hass,
                logger=_LOGGER,
                cooldown=self._group.debounce_delay,
                immediate=False,
                function=self._flush,
            )
        self._hass.async_create_background_task(
            self._debouncer.async_call(),
            name=f"climate_group_calibration_flush:{self._group.entity_id}",
        )

    async def _flush(self) -> None:
        """Write queued calibration values to number entities."""
        # A slot may have started after the value was queued: the bypass suspends
        # writes for its whole duration, so a flush firing inside it drops the
        # queued value. The slot-end cleanup withdraws the override before its
        # catch-up force_sync, so that path is unaffected.
        if self.bypassed:
            self._pending.clear()
            return
        pending = list(self._pending.items())
        self._pending.clear()
        member_command_delay = self._group.member_command_delay

        # Resolved up front so the delay below counts actual writes, not raw
        # queue entries — a member that went OFF/unavailable during the
        # debouncer cooldown must not consume a gap between two real writes.
        writes = []
        for entity_id, value in pending:
            if reason := self._skip_reason(entity_id):
                _LOGGER.debug(
                    "[%s] Dropping queued calibration for %s — member is %s",
                    self._group.entity_id, entity_id, reason,
                )
                continue
            writes.append((entity_id, value))

        # Lock shared with the climate call handlers — a calibration write to a
        # device's number entity must not land in the gap between two staggered
        # climate calls to that same device, or vice versa. Held across the
        # whole batch, not per write: released between writes, a climate batch
        # already waiting would slip into the sub-ms handoff right after a
        # write — effectively simultaneous on the same radio path.
        async with self._group.member_command_scope():
            for index, (entity_id, value) in enumerate(writes):
                _LOGGER.debug("[%s] Writing calibration %s → %s", self._group.entity_id, entity_id, value)
                try:
                    if index > 0 and member_command_delay:
                        await asyncio.sleep(member_command_delay)

                    await self._hass.services.async_call(
                        NUMBER_DOMAIN, "set_value",
                        {ATTR_ENTITY_ID: entity_id, "value": value},
                    )
                except Exception:
                    _LOGGER.exception("[%s] Failed to write calibration to %s", self._group.entity_id, entity_id)
