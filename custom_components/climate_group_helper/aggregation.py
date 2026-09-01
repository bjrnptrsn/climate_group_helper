"""State aggregation and member evaluation for Climate Group Helper.

`async_update_group_state()` is a Home Assistant contract: `GroupEntity`
declares it abstract and calls it synchronously before every state write, so it
must stay a `@callback` and hand anything async to a background task.

Four ordering constraints inside it are load-bearing. Three of them are only
*implied* by statement order, and two have their reason in a different file — so
they are listed here, next to the order they govern. Breaking any of them
produces silently wrong values, not a crash:

K1  Calibration runs AFTER `_apply_temperature()` / `_apply_humidity()`.
    `CalibrationHandler.update()` takes no value argument; it reads
    `_attr_current_temperature`, `_attr_current_humidity` and `_member_temp_avg`
    back off the entity (`calibration.py`). Calling it before the apply
    calibrates against the previous cycle — in OFFSET mode with a wrong
    reference temperature.

K2  `change_state` / `_event_entity_id` are written BEFORE `resync()`.
    `SyncModeHandler.resync()` reads `self._group.change_state`. Moving the
    write later hands it the previous cycle's event.

K3  `resync()` runs BEFORE the HVAC mode calculation.
    `resync()` can update `shared_target_state`, and `_determine_hvac_mode()`
    reads it (AUTO strategy). Reversing the two makes the group settle on a mode
    computed from stale target state.

K4  Cold Start runs AFTER `current_group_state` is built — it seeds
    `shared_target_state` from exactly that object.

Additionally, the one-time startup trigger sets `_startup_initialized` before
the early return, and the event cleanup at the end mirrors the one in that early
return — an event must not survive a completed cycle.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from functools import reduce
import logging
import time
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.components.climate import (
    ATTR_CURRENT_HUMIDITY,
    ATTR_CURRENT_TEMPERATURE,
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_ACTION,
    ATTR_HVAC_MODES,
    ATTR_MAX_HUMIDITY,
    ATTR_MAX_TEMP,
    ATTR_MIN_HUMIDITY,
    ATTR_MIN_TEMP,
    ATTR_PRESET_MODE,
    ATTR_PRESET_MODES,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_HORIZONTAL_MODES,
    ATTR_SWING_MODE,
    ATTR_SWING_MODES,
    ATTR_TARGET_HUMIDITY_STEP,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TARGET_TEMP_STEP,
    DEFAULT_MAX_HUMIDITY,
    DEFAULT_MAX_TEMP,
    DEFAULT_MIN_HUMIDITY,
    DEFAULT_MIN_TEMP,
    ClimateEntityFeature,
    HVACAction,
    HVACMode,
)
from homeassistant.components.group.util import (
    find_state_attributes,
    most_frequent_attribute,
    reduce_attribute,
)
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_SUPPORTED_FEATURES,
    ATTR_TEMPERATURE,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Event, State, callback
from homeassistant.helpers.event import async_call_later

from .const import (
    FLOAT_TOLERANCE,
    SUPPORTED_FEATURES,
    TEMP_TARGET_ATTRS,
    DEFAULT_SUPPORTED_FEATURES,
    FeatureStrategy,
    HvacModeStrategy,
    RoundOption,
    SyncMode,
)
from .state import ChangeState, CurrentState, TargetState

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


def within_tolerance(val1: Any, val2: Any, tolerance: float = FLOAT_TOLERANCE) -> bool:
    """Check if two values are within a given tolerance."""
    try:
        return abs(float(val1) - float(val2)) < tolerance
    except (ValueError, TypeError):
        return False


def mean_round(value: float | None, round_option: RoundOption = RoundOption.NONE) -> float | None:
    """Round the decimal part of a float to an fractional value with a certain precision."""
    if value is None:
        return None

    if round_option == RoundOption.HALF:
        return round(value * 2) / 2
    if round_option == RoundOption.INTEGER:
        return round(value)
    return value


@dataclass(frozen=True)
class TemperatureResult:
    """Computed temperature values, before they are written to the entity."""

    member_temp_avg: float | None
    current_temperature: float | None
    target_temperature: float | None
    target_temperature_low: float | None
    target_temperature_high: float | None
    target_temperature_step: float | None
    min_temp: float
    max_temp: float
    # True only when external sensors are configured AND produced a value.
    needs_calibration: bool


@dataclass(frozen=True)
class HumidityResult:
    """Computed humidity values, before they are written to the entity."""

    current_humidity: float | None
    target_humidity: float | None
    target_humidity_step: float | None
    min_humidity: float
    max_humidity: float
    needs_calibration: bool


@dataclass(frozen=True)
class ModeResult:
    """Computed fan/preset/swing modes and supported features."""

    fan_modes: list[str]
    fan_mode: str | None
    preset_modes: list[str]
    preset_mode: str | None
    swing_modes: list[str]
    swing_mode: str | None
    swing_horizontal_modes: list[str]
    swing_horizontal_mode: str | None
    supported_features: ClimateEntityFeature


class Aggregator:
    """Handles member state reads, aggregation, and group state calculation."""

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the aggregator."""
        self._group = group
        self.states: list[State] = []
        self.capability_states: list[State] = []
        self._grace_period_unsub: Callable[[], None] | None = None
        self._grace_period_last_ts: float | None = None

    def read_member_state(self, entity_id: str) -> State | None:
        """Central member-state read — the only path that applies Member Templates.

        All code that needs a member's state must go through this method; direct
        `hass.states.get(member_id)` calls bypass any active template and
        produce inconsistent behaviour. Returns the real state untouched when
        no template applies (template disabled, entity not covered, or the
        group is not in the relevant mode). See `member_template.py` for the
        manipulation logic.
        """
        state = self._group.hass.states.get(entity_id)
        if state is None:
            return state
        return self._group.member_template_manager.apply_state(entity_id, state)

    def read_member_event(self, event: Event) -> tuple[State | None, State | None]:
        """Unpack a `state_changed` event into template-rendered `(new_state, old_state)`.

        Called once at the source in `_state_change_listener` so every downstream
        consumer (`ChangeState.from_event`, `SyncModeHandler._has_relevant_changes`)
        sees a rendered event without having to call a gateway itself.
        """
        entity_id = event.data.get("entity_id")
        new_state = event.data.get("new_state")
        old_state = event.data.get("old_state")
        if entity_id is None:
            return new_state, old_state
        manager = self._group.member_template_manager
        new_wrapped = manager.apply_state(entity_id, new_state) if new_state else None
        old_wrapped = manager.apply_state(entity_id, old_state) if old_state else None
        return new_wrapped, old_wrapped

    def _get_valid_member_states(
        self, entity_ids: list[str], skip_isolated: bool = True
    ) -> tuple[list[State], bool]:
        """Get valid states for provided entities.

        Excludes isolated members (e.g. curtain closed) from all calculations.

        `skip_isolated=False` keeps them in — used for capability aggregation
        (see `capability_states`): isolation says "don't touch this device right
        now", it does not change what the device can do.

        Returns:
            Tuple of (valid_states, all_ready) where all_ready is True when
            all entity_ids have a valid (not unavailable/unknown) state.
        """
        excluded = self._group.run_state.isolated_members if skip_isolated else frozenset()
        expected_entity_ids = [entity_id for entity_id in entity_ids if entity_id not in excluded]

        all_states = [
            state
            for entity_id in expected_entity_ids
            if (state := self.read_member_state(entity_id)) is not None
        ]
        valid_states = [state for state in all_states if state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)]
        all_ready = len(valid_states) == len(expected_entity_ids) if expected_entity_ids else True
        return valid_states, all_ready

    def _get_avg_sensor_value(self, sensor_ids: list[str], calc_func: Callable[[list[float]], float]) -> float | None:
        """Calculate average value from multiple sensors."""
        if not sensor_ids:
            return None

        valid_states, _ = self._get_valid_member_states(sensor_ids)
        values = []
        for state in valid_states:
            try:
                values.append(float(state.state))
            except (ValueError, TypeError):
                pass

        if values:
            return calc_func(values)
        return None

    def _reduce_attributes(self, attributes: list[Any], default: Any = None) -> list[Any] | int:
        """Reduce a list of attributes (modes or features) based on the feature strategy."""
        if not attributes:
            return default if default is not None else []

        # Handle list of features [ClimateEntityFeature | int]
        if isinstance(attributes[0], (ClimateEntityFeature, int)):
            # Intersection (common features)
            if self._group._feature_strategy == FeatureStrategy.INTERSECTION:
                return reduce(lambda x, y: x & y, attributes)  # type: ignore[no-any-return]
            # Union (all features)
            return reduce(lambda x, y: x | y, attributes)  # type: ignore[no-any-return]

        # Handle list of modes [HVACMode | str]
        # Filter out empty attributes or None
        valid_attributes = [attr for attr in attributes if attr]
        if not valid_attributes:
            return []

        # Intersection (common modes)
        if self._group._feature_strategy == FeatureStrategy.INTERSECTION:
            modes = list(reduce(lambda x, y: set(x) & set(y), valid_attributes))
        # Union (all modes)
        else:
            modes = list(reduce(lambda x, y: set(x) | set(y), valid_attributes))

        return modes

    def _sort_hvac_modes(self, modes: list[Any]) -> list[HVACMode]:
        """Sort HVAC modes based on a predefined order."""
        # Make sure OFF is always included
        all_modes = set(modes) | {HVACMode.OFF}

        # Return modes sorted in the order of the HVACMode enum
        return [m for m in HVACMode if m in all_modes]

    def _determine_hvac_mode(self, current_hvac_modes: list[str]) -> HVACMode | None:
        """Determine the group's HVAC mode based on member modes and strategy."""
        if (val := self._get_optimistic_value("hvac_mode")) is not None:
            return HVACMode(val)

        active_hvac_modes = [mode for mode in current_hvac_modes if mode != HVACMode.OFF]

        most_common_active_hvac_mode: HVACMode | None = None
        if active_hvac_modes:
            most_common_active_hvac_mode = HVACMode(max(active_hvac_modes, key=active_hvac_modes.count))

        strategy = self._group._hvac_mode_strategy

        # Auto strategy
        if strategy == HvacModeStrategy.AUTO:
            # If target HVAC mode is OFF or None, use normal strategy
            if self._group.shared_target_state.hvac_mode in (HVACMode.OFF, None):
                strategy = HvacModeStrategy.NORMAL
            # If target HVAC mode is ON (e.g. heat, cool), use off priority strategy
            else:
                strategy = HvacModeStrategy.OFF_PRIORITY

        # Normal strategy
        if strategy == HvacModeStrategy.NORMAL:
            # If all members are OFF, the group is OFF
            if all(mode == HVACMode.OFF for mode in current_hvac_modes) if current_hvac_modes else False:
                return HVACMode.OFF
            # Otherwise, return the most common active HVAC mode
            return most_common_active_hvac_mode

        # Off priority strategy
        if strategy == HvacModeStrategy.OFF_PRIORITY:
            # If any member is OFF, the group is OFF
            if HVACMode.OFF in current_hvac_modes:
                return HVACMode.OFF
            # Otherwise, return the most common active HVAC mode
            return most_common_active_hvac_mode

        # Default to OFF if no other mode is determined
        return HVACMode.OFF

    def _determine_hvac_action(self, current_hvac_actions: list[HVACAction | None]) -> HVACAction | None:
        """Determine the group's HVAC action based on member actions and a priority."""
        # 1. Priority: Active states (heating, cooling, etc.)
        active_hvac_actions = [
            action
            for action in current_hvac_actions
            if action not in (HVACAction.OFF, HVACAction.IDLE, None)
        ]
        if active_hvac_actions:
            # Set hvac_action to the most common active HVAC action
            return max(active_hvac_actions, key=active_hvac_actions.count)
        # 2. Priority: Idle state
        if HVACAction.IDLE in current_hvac_actions:
            return HVACAction.IDLE
        # 3. Priority: Off state
        if HVACAction.OFF in current_hvac_actions:
            return HVACAction.OFF
        # 4. Fallback
        return None

    def _start_grace_period_timer(self, remaining: float) -> None:
        """(Re-)start the one-shot timer that forces a state refresh when the grace period expires.

        Always replaces an existing timer so that a new UI command correctly extends
        the window to _grace_period seconds from the latest change.
        """
        if self._grace_period_unsub is not None:
            self._grace_period_unsub()

        @callback
        def _grace_period_expired(_now: Any) -> None:
            self._grace_period_unsub = None
            self._grace_period_last_ts = None
            _LOGGER.debug("[%s] Grace period expired, forcing state refresh", self._group.entity_id)
            self._group.async_defer_or_update_ha_state()

        _LOGGER.debug("[%s] Grace period started, refresh in %.1f seconds", self._group.entity_id, remaining)
        self._grace_period_unsub = async_call_later(self._group.hass, remaining, _grace_period_expired)

    def _cancel_grace_period_timer(self) -> None:
        """Cancel a pending grace period timer, if any."""
        if self._grace_period_unsub is not None:
            self._grace_period_unsub()
            self._grace_period_unsub = None
        self._grace_period_last_ts = None

    def _get_optimistic_value(self, attr: str) -> Any:
        """Return the target state value while the UI grace period is active, else None.

        Shows the commanded value instead of the live member average for up to
        _grace_period seconds after a direct UI command, preventing flicker while
        slow devices echo their old state back.
        """
        if self._group._grace_period <= 0:
            return None

        timestamp = self._group.shared_target_state.last_timestamp or 0
        elapsed = time.time() - timestamp

        if self._group.shared_target_state.last_source == "ui" and elapsed < self._group._grace_period:
            if timestamp != self._grace_period_last_ts:
                self._grace_period_last_ts = timestamp
                self._start_grace_period_timer(self._group._grace_period - elapsed)
            return getattr(self._group.shared_target_state, attr, None)

        self._cancel_grace_period_timer()
        return None

    def _resolve_master_or_avg(
        self,
        use_master: bool,
        master_value: float | None,
        attr: str,
        avg_calc: Callable[[Any], float | None],
        states: list[State],
    ) -> float | None:
        """Return the display value for a temperature or humidity attribute.

        Priority: master entity → offset-corrected average → raw member average.
        `states` is provided by the caller — either the full self.states or a pre-filtered
        subset (e.g. without OFF members). Offset correction subtracts each member's
        per-device offset so the group shows the logical set point — in the master
        path just as in the averaging path (same `member_offset_correction` flag).
        """
        offset_correction = (
            bool(self._group._temp_offset_map)
            and self._group._member_offset_correction
            and attr in TEMP_TARGET_ATTRS
        )

        if use_master and self._group._master_entity_id and master_value is not None:
            if offset_correction:
                return master_value - self._group._temp_offset_map.get(self._group._master_entity_id, 0.0)
            return master_value

        if offset_correction:
            values = [
                val - self._group._temp_offset_map.get(s.entity_id, 0.0)
                for s in states
                if (val := s.attributes.get(attr)) is not None
            ]
            return avg_calc(values) if values else None

        return reduce_attribute(states, attr, reduce=lambda *data: avg_calc(data))  # type: ignore[no-any-return]

    def _compute_temperature(self) -> TemperatureResult:
        """Calculate all temperature-related values without writing them.

        temp_states excludes OFF members when CONF_IGNORE_OFF_MEMBERS_TEMPERATURE is set.
        min_temp, max_temp, and temp_step use capability_states — device limits must
        reflect the full group regardless of which members are currently active or
        isolated.

        Pure: the caller applies the result and only then triggers calibration —
        `CalibrationHandler.update()` reads the applied values back off the entity
        (see `_apply_temperature`).
        """
        temp_states = (
            [
                s for s in self.states
                if self._group.member_template_manager.display_mode(s) != HVACMode.OFF
            ]
            if self._group._ignore_off_members_temperature
            else self.states
        )

        # Current temperature
        member_temp_avg = reduce_attribute(
            temp_states, ATTR_CURRENT_TEMPERATURE, reduce=lambda *data: self._group._temp_current_avg_calc(data)
        )
        needs_calibration = False
        if self._group.temp_sensor_entity_ids:  # always empty in simple mode
            current_temperature = self._get_avg_sensor_value(
                self._group.temp_sensor_entity_ids, self._group._temp_current_avg_calc
            )
            if current_temperature is not None:
                needs_calibration = True
            else:
                _LOGGER.debug("[%s] External temp sensors unavailable.", self._group.entity_id)
        else:
            current_temperature = member_temp_avg

        # Target temperatures: grace period → master override → offset-corrected member average.
        # Rounding applies to BOTH branches — the optimistic value must be rounded
        # exactly like the master/average one, or the UI would show a different
        # value during the grace period than after it expires.
        def _resolve(attr: str, master_value: float | None, state_attr: str) -> float | None:
            val = self._get_optimistic_value(attr)
            if val is None:
                val = self._resolve_master_or_avg(
                    self._group._temp_use_master, master_value, state_attr,
                    self._group._temp_target_avg_calc, temp_states,
                )
            return mean_round(val, self._group._temp_round) if val is not None else None

        master = self._group.current_master_state
        target_temperature = _resolve("temperature", master.temperature, ATTR_TEMPERATURE)
        target_temperature_low = _resolve("target_temp_low", master.target_temp_low, ATTR_TARGET_TEMP_LOW)
        target_temperature_high = _resolve("target_temp_high", master.target_temp_high, ATTR_TARGET_TEMP_HIGH)

        # Temperature limits and step
        if self._group._feature_strategy == FeatureStrategy.UNION:
            # Union: widest range — lowest min, highest max
            min_temp = reduce_attribute(self.capability_states, ATTR_MIN_TEMP, reduce=min, default=DEFAULT_MIN_TEMP)
            max_temp = reduce_attribute(self.capability_states, ATTR_MAX_TEMP, reduce=max, default=DEFAULT_MAX_TEMP)
        else:
            # Intersection (default): narrowest range — highest min, lowest max
            min_temp = reduce_attribute(self.capability_states, ATTR_MIN_TEMP, reduce=max, default=DEFAULT_MIN_TEMP)
            max_temp = reduce_attribute(self.capability_states, ATTR_MAX_TEMP, reduce=min, default=DEFAULT_MAX_TEMP)

        return TemperatureResult(
            member_temp_avg=member_temp_avg,
            current_temperature=current_temperature,
            target_temperature=target_temperature,
            target_temperature_low=target_temperature_low,
            target_temperature_high=target_temperature_high,
            target_temperature_step=reduce_attribute(self.capability_states, ATTR_TARGET_TEMP_STEP, reduce=max),
            min_temp=min_temp,
            max_temp=max_temp,
            needs_calibration=needs_calibration,
        )

    def _apply_temperature(self, result: TemperatureResult) -> None:
        """Write the computed temperature values to the entity."""
        self._group._member_temp_avg = result.member_temp_avg
        self._group._attr_current_temperature = result.current_temperature
        self._group._attr_target_temperature = result.target_temperature
        self._group._attr_target_temperature_low = result.target_temperature_low
        self._group._attr_target_temperature_high = result.target_temperature_high
        self._group._attr_target_temperature_step = result.target_temperature_step
        self._group._attr_min_temp = result.min_temp
        self._group._attr_max_temp = result.max_temp

    def _compute_humidity(self) -> HumidityResult:
        """Calculate all humidity-related values without writing them.

        Pure — see `_compute_temperature` for why calibration runs after the apply.
        """
        # Current humidity
        needs_calibration = False
        if self._group.humidity_sensor_entity_ids:  # always empty in simple mode
            current_humidity = self._get_avg_sensor_value(
                self._group.humidity_sensor_entity_ids, self._group._humidity_current_avg_calc
            )
            if current_humidity is not None:
                needs_calibration = True
            else:
                _LOGGER.debug("[%s] External humidity sensors unavailable.", self._group.entity_id)
        else:
            current_humidity = reduce_attribute(
                self.states, ATTR_CURRENT_HUMIDITY, reduce=lambda *data: self._group._humidity_current_avg_calc(data)
            )

        # Target humidity: grace period → master override → member average
        target_humidity = self._get_optimistic_value("humidity")
        if target_humidity is None:
            target_humidity = self._resolve_master_or_avg(
                self._group._humidity_use_master, self._group.current_master_state.humidity, ATTR_HUMIDITY, self._group._humidity_target_avg_calc, self.states
            )
        if target_humidity is not None:
            target_humidity = mean_round(target_humidity, self._group._humidity_round)

        return HumidityResult(
            current_humidity=current_humidity,
            target_humidity=target_humidity,
            target_humidity_step=reduce_attribute(self.capability_states, ATTR_TARGET_HUMIDITY_STEP, reduce=max),
            min_humidity=reduce_attribute(self.capability_states, ATTR_MIN_HUMIDITY, reduce=max, default=DEFAULT_MIN_HUMIDITY),
            max_humidity=reduce_attribute(self.capability_states, ATTR_MAX_HUMIDITY, reduce=min, default=DEFAULT_MAX_HUMIDITY),
            needs_calibration=needs_calibration,
        )

    def _apply_humidity(self, result: HumidityResult) -> None:
        """Write the computed humidity values to the entity."""
        self._group._attr_current_humidity = result.current_humidity
        self._group._attr_target_humidity = result.target_humidity
        self._group._attr_target_humidity_step = result.target_humidity_step
        self._group._attr_min_humidity = result.min_humidity
        self._group._attr_max_humidity = result.max_humidity

    def _compute_modes(self) -> ModeResult:
        """Calculate fan, preset, swing modes and supported features without writing them."""
        fan_modes = self._reduce_attributes(list(find_state_attributes(self.capability_states, ATTR_FAN_MODES)))
        val = self._get_optimistic_value("fan_mode")
        fan_mode = val if val is not None else most_frequent_attribute(self.states, ATTR_FAN_MODE)

        native_preset_modes = self._reduce_attributes(list(find_state_attributes(self.capability_states, ATTR_PRESET_MODES)))
        preset_modes = self._group.preset_manager.get_preset_modes(
            native_preset_modes if isinstance(native_preset_modes, list) else []
        )
        # Physical aggregate only — a virtual preset name is never reported by a
        # member and must not leak into `current_group_state`, which feeds the
        # sync diffing. The virtual overlay lives in the `preset_mode` property.
        #
        # The grace-period value is read from `target_state`, which *does* carry
        # the virtual name, so it is dropped here rather than overlaid: a UI
        # command selecting a group preset would otherwise put that name into the
        # physical aggregate for the length of the grace period. Native preset
        # names still get the anti-flicker treatment.
        val = self._get_optimistic_value("preset_mode")
        if val is not None and self._group.preset_manager.is_virtual(val):
            val = None
        preset_mode = val if val is not None else most_frequent_attribute(self.states, ATTR_PRESET_MODE)

        swing_modes = self._reduce_attributes(list(find_state_attributes(self.capability_states, ATTR_SWING_MODES)))
        val = self._get_optimistic_value("swing_mode")
        swing_mode = val if val is not None else most_frequent_attribute(self.states, ATTR_SWING_MODE)

        swing_horizontal_modes = self._reduce_attributes(list(find_state_attributes(self.capability_states, ATTR_SWING_HORIZONTAL_MODES)))
        val = self._get_optimistic_value("swing_horizontal_mode")
        swing_horizontal_mode = val if val is not None else most_frequent_attribute(self.states, ATTR_SWING_HORIZONTAL_MODE)

        # Supported features — reads the *local* preset_modes, not the entity field
        attr_supported_features = self._reduce_attributes(list(find_state_attributes(self.capability_states, ATTR_SUPPORTED_FEATURES)), default=0)
        features = attr_supported_features if isinstance(attr_supported_features, int) else 0
        range_template = self._group.member_template_manager.range_template
        if range_template is not None and range_template.entity_ids:
            features |= ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
        if preset_modes:
            features |= ClimateEntityFeature.PRESET_MODE

        return ModeResult(
            fan_modes=sorted(fan_modes) if isinstance(fan_modes, list) else [],
            fan_mode=fan_mode,
            preset_modes=preset_modes,
            preset_mode=preset_mode,
            swing_modes=sorted(swing_modes) if isinstance(swing_modes, list) else [],
            swing_mode=swing_mode,
            swing_horizontal_modes=sorted(swing_horizontal_modes) if isinstance(swing_horizontal_modes, list) else [],
            swing_horizontal_mode=swing_horizontal_mode,
            supported_features=(features | DEFAULT_SUPPORTED_FEATURES) & SUPPORTED_FEATURES,
        )

    def _apply_modes(self, result: ModeResult) -> None:
        """Write the computed mode values to the entity."""
        self._group._attr_fan_modes = result.fan_modes
        self._group._attr_fan_mode = result.fan_mode
        self._group._attr_preset_modes = result.preset_modes
        self._group._attr_preset_mode = result.preset_mode
        self._group._attr_swing_modes = result.swing_modes
        self._group._attr_swing_mode = result.swing_mode
        self._group._attr_swing_horizontal_modes = result.swing_horizontal_modes
        self._group._attr_swing_horizontal_mode = result.swing_horizontal_mode
        self._group._attr_supported_features = result.supported_features

    @callback
    def async_update_group_state(self) -> None:
        """Query all members and determine the climate group state.

        Called by HA whenever a member entity changes state. Responsibilities:
        - Collect valid member states (excludes isolated and unavailable members).
        - Set startup_time once all members are ready and trigger startup resync.
        - Aggregate hvac_mode, hvac_action, temperature/humidity readings.
        - Apply Range Template to covered members before aggregation.
        - Update group attributes (min/max/step, supported features, hvac_modes).
        - Push calibration and temperature update targets if configured.
        """
        # Check if there are any valid states
        self.states, all_members_ready = self._get_valid_member_states(self._group.climate_entity_ids)
        # Capability aggregation keeps isolated members: what a device *can* do
        # does not change while it is isolated. Without this, isolating the only
        # member that supports a mode/feature removes it from the group — and an
        # HVAC_MODE rule would strip the very mode needed to release it.
        self.capability_states, _ = self._get_valid_member_states(
            self._group.climate_entity_ids, skip_isolated=False
        )

        # One-time startup trigger once all members are ready: slot apply +
        # calibration force-sync. startup_time itself is armed in
        # async_added_to_hass() (independent of readiness) — this flag only guards
        # the once-semantics of the two.
        if all_members_ready and not self._group._startup_initialized:
            self._group._startup_initialized = True
            if self._group.advanced_mode:
                self._group.hass.async_create_background_task(
                    self._group.schedule_handler.on_slot_change(),
                    name="climate_group_startup_slot"
                )
                self._group.calibration_handler.update("temperature", force_sync=True)
                self._group.calibration_handler.update("humidity", force_sync=True)
            _LOGGER.debug("[%s] All members ready the first time.", self._group.entity_id)

        # No states available
        if not self.states:
            self._group._attr_hvac_mode = None
            self._group._attr_available = False
            # Same cleanup as the regular path below: an event must not survive a
            # completed update cycle, or the next event-less caller (boost,
            # isolation, group offset, schedule, ...) re-enters and re-processes it.
            self._group.change_state = None
            self._group.event = None
            self._group._event_entity_id = None
            return

        # Load master entity state
        if self._group._master_entity_id:
            raw = self.read_member_state(self._group._master_entity_id)
            if raw and raw.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                self._group.master_state = raw
                self._group.current_master_state = CurrentState(
                    hvac_mode=raw.state,
                    temperature=raw.attributes.get(ATTR_TEMPERATURE),
                    target_temp_low=raw.attributes.get(ATTR_TARGET_TEMP_LOW),
                    target_temp_high=raw.attributes.get(ATTR_TARGET_TEMP_HIGH),
                    humidity=raw.attributes.get(ATTR_HUMIDITY),
                )
            else:
                self._group.master_state = None
                self._group.current_master_state = CurrentState()

        # Dynamic Master Fallback: pause MASTER_LOCK when master is unavailable
        new_fallback = (
            self._group._master_entity_id is not None
            and self._group.master_state is None
            and self._group.sync_mode_handler.sync_mode == SyncMode.MASTER_LOCK
        )
        if new_fallback != self._group.run_state.master_fallback_active:
            self._group.run_state = replace(self._group.run_state, master_fallback_active=new_fallback)
            _LOGGER.warning(
                "[%s] Master entity unavailable — fallback to member average active: %s",
                self._group.entity_id, new_fallback,
            )

        # Calculate and store ChangeState — must stay ahead of resync(), which
        # reads self._group.change_state (K2, see module docstring).
        if self._group.event:
            self._group.change_state = ChangeState.from_event(
                self._group.event,
                self._group.shared_target_state,
                offset_map=self._group._temp_offset_map or None,
            )
            self._group._event_entity_id = self._group.event.data.get(ATTR_ENTITY_ID)

            # Check if the change state is from a member entity.
            # resync() must stay ahead of the HVAC mode calculation below: it can
            # update shared_target_state, which _determine_hvac_mode() reads
            # (K3, see module docstring).
            if self._group.change_state and self._group.change_state.entity_id in self._group.climate_entity_ids:
                self._group.sync_mode_handler.resync()

                # Range Template owns covered members: drive their changeover/correction
                # via the TemplateCallHandler — independent of sync_mode. The SyncCallHandler
                # excludes covered members, so this is the sole, intentional driver.
                if self._group.member_template_manager.is_covered_state(self._group.event.data.get("new_state")):
                    self._group._trigger_template_changeover()

        # All available HVAC modes --> list of HVACMode (str), e.g. [<HVACMode.OFF: 'off'>, <HVACMode.HEAT: 'heat'>, <HVACMode.AUTO: 'auto'>, ...]
        hvac_modes = self._reduce_attributes(list(find_state_attributes(self.capability_states, ATTR_HVAC_MODES)))
        hvac_modes_list = hvac_modes if isinstance(hvac_modes, list) else []
        # Not redundant with the call in `_state_change_listener`: three of the four
        # paths into this method (setup, handler setup, grace-period expiry) never
        # pass through that listener, so this is their only coverage refresh. On the
        # event path it is a cheap idempotent recompute whose return value is needed
        # for the HEAT_COOL enrichment below.
        template_member_ids = self._group.member_template_manager.update_members()
        if template_member_ids and HVACMode.HEAT_COOL not in hvac_modes_list:
            hvac_modes_list = list(hvac_modes_list) + [HVACMode.HEAT_COOL]
        self._group._attr_hvac_modes = self._sort_hvac_modes(hvac_modes_list)

        # A list of all HVAC modes that are currently set
        self._group._current_hvac_modes = [
            self._group.member_template_manager.display_mode(state) for state in self.states
        ]

        # Determine the group's HVAC mode and update the attribute
        self._group._attr_hvac_mode = self._determine_hvac_mode(self._group._current_hvac_modes)

        # Update last active HVAC mode
        if self._group._attr_hvac_mode is not None and self._group._attr_hvac_mode not in (HVACMode.OFF, self._group.run_state.last_active_hvac_mode):
            self._group.run_state = replace(self._group.run_state, last_active_hvac_mode=self._group._attr_hvac_mode)

        # The group is available if any member is available
        self._group._attr_available = True

        # The group state is assumed if not all states are equal
        display_modes = [
            self._group.member_template_manager.display_mode(state) for state in self.states
        ]
        self._group._attr_assumed_state = len(set(display_modes)) > 1

        # Determine HVAC action
        current_hvac_actions = list(find_state_attributes(self.states, ATTR_HVAC_ACTION))
        self._group._attr_hvac_action = self._determine_hvac_action(current_hvac_actions)

        # Get temperature unit from system settings
        self._group._attr_temperature_unit = self._group.hass.config.units.temperature_unit

        # Compute → apply → side effect, bundled per domain. The calibration call
        # must run AFTER the apply (K1, see the module docstring) and the domains
        # stay in their original order so no observable behaviour shifts.
        temperature = self._compute_temperature()
        self._apply_temperature(temperature)
        if temperature.needs_calibration:
            self._group.calibration_handler.update("temperature", self._group._event_entity_id)

        humidity = self._compute_humidity()
        self._apply_humidity(humidity)
        if humidity.needs_calibration:
            self._group.calibration_handler.update("humidity", self._group._event_entity_id)

        self._apply_modes(self._compute_modes())

        # Populate current_group_state
        self._group.current_group_state = CurrentState(
            hvac_mode=self._group._attr_hvac_mode,
            temperature=self._group._attr_target_temperature,
            target_temp_low=self._group._attr_target_temperature_low,
            target_temp_high=self._group._attr_target_temperature_high,
            humidity=self._group._attr_target_humidity,
            preset_mode=self._group._attr_preset_mode,
            fan_mode=self._group._attr_fan_mode,
            swing_mode=self._group._attr_swing_mode,
            swing_horizontal_mode=self._group._attr_swing_horizontal_mode
        )

        # Cold Start: Populate target store from current group state if empty and all members are ready.
        # Must stay after current_group_state is built — it seeds from that object (K4).
        if self._group.shared_target_state == TargetState() and all_members_ready:
            initial_data = self._group.current_group_state.to_dict()
            if initial_data:
                self._group.shared_target_state = self._group.shared_target_state.update(**initial_data)
                _LOGGER.debug("[%s] Initialized Persistent Target State from current values: %s", self._group.entity_id, self._group.shared_target_state)

        # Clear instance-level event state after use — all three are persisted across
        # calls, so stale values would cause spurious resync() or calibration triggers.
        self._group.change_state = None
        self._group.event = None
        self._group._event_entity_id = None
