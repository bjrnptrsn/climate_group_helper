"""This platform allows several climate devices to be grouped into one climate device."""
from __future__ import annotations

from dataclasses import fields
from functools import reduce
import logging
import time
from statistics import mean, median
from typing import Any

from homeassistant.components.climate import (
    ATTR_CURRENT_HUMIDITY,
    ATTR_CURRENT_TEMPERATURE,
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_ACTION,
    ATTR_HVAC_MODE,
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
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TARGET_TEMP_STEP,
    DEFAULT_MAX_HUMIDITY,
    DEFAULT_MAX_TEMP,
    DEFAULT_MIN_HUMIDITY,
    DEFAULT_MIN_TEMP,
    ClimateEntity,
    ClimateEntityFeature,
    HVACAction,
    HVACMode,
)
from homeassistant.components.group.entity import GroupEntity
from homeassistant.components.group.util import (
    find_state_attributes,
    most_frequent_attribute,
    reduce_attribute,
    states_equal,
)
from homeassistant.components.number import DOMAIN as NUMBER_DOMAIN
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_SUPPORTED_FEATURES,
    ATTR_TEMPERATURE,
    CONF_ENTITIES,
    CONF_NAME,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import HomeAssistant, State, callback, Event
from datetime import timedelta, datetime

from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import (
    ATTR_ASSUMED_STATE,
    ATTR_CURRENT_HVAC_MODES,
    ATTR_LAST_ACTIVE_HVAC_MODE,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_FEATURE_STRATEGY,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HVAC_MODE_STRATEGY,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_SYNC_MODE,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_MIN_TEMP_OFF,
    DOMAIN,
    FEATURE_STRATEGY_INTERSECTION,
    FLOAT_TOLERANCE,
    HVAC_MODE_STRATEGY_AUTO,
    HVAC_MODE_STRATEGY_NORMAL,
    HVAC_MODE_STRATEGY_OFF_PRIORITY,
    AverageOption,
    RoundOption,
    CalibrationMode,
    SyncMode,
)
from .schedule import ScheduleHandler
from .service_call import SyncCallHandler, ScheduleCallHandler, WindowControlCallHandler, ClimateCallHandler
from .state import ClimateState, TargetState, CurrentState, ChangeState, SyncModeStateManager, ScheduleStateManager, WindowControlStateManager, ClimateStateManager
from .sync_mode import SyncModeHandler
from .window_control import WindowControlHandler

CALC_TYPES = {
    AverageOption.MIN: min,
    AverageOption.MAX: max,
    AverageOption.MEAN: mean,
    AverageOption.MEDIAN: median,
}

# No limit on parallel updates to enable a group calling another group
PARALLEL_UPDATES = 0

# Supported features for the climate group entity.
SUPPORTED_FEATURES = (
    ClimateEntityFeature.TARGET_TEMPERATURE
    | ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
    | ClimateEntityFeature.TARGET_HUMIDITY
    | ClimateEntityFeature.FAN_MODE
    | ClimateEntityFeature.PRESET_MODE
    | ClimateEntityFeature.SWING_MODE
    | ClimateEntityFeature.TURN_OFF
    | ClimateEntityFeature.TURN_ON
    | ClimateEntityFeature.SWING_HORIZONTAL_MODE
)

DEFAULT_SUPPORTED_FEATURES = (
    ClimateEntityFeature.TURN_OFF | ClimateEntityFeature.TURN_ON
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Initialize Climate Group config entry."""

    config = {**config_entry.options}

    registry = er.async_get(hass)
    entities = er.async_validate_entity_ids(registry, config[CONF_ENTITIES])

    async_add_entities(
        [
            ClimateGroup(
                hass=hass,
                unique_id=config_entry.unique_id,
                name=config.get(CONF_NAME, config_entry.title),
                entity_ids=entities,
                config=config,
            )
        ]
    )


class ClimateGroup(GroupEntity, ClimateEntity, RestoreEntity):
    """Representation of a climate group."""

    def __init__(
        self,
        hass: HomeAssistant,
        unique_id: str | None,
        name: str,
        entity_ids: list[str],
        config: dict[str, Any],
    ) -> None:
        """Initialize a climate group."""

        # Home Assistant
        self.hass = hass
        self._attr_unique_id = unique_id
        self._attr_name = name
        self.climate_entity_ids = entity_ids
        self.config = config
        self.event: Event = None

        # Temperature calculation options
        self._temp_current_avg_calc = CALC_TYPES[config.get(CONF_TEMP_CURRENT_AVG, AverageOption.MEAN)]
        self._temp_target_avg_calc = CALC_TYPES[config.get(CONF_TEMP_TARGET_AVG, AverageOption.MEAN)]
        self._temp_round = config.get(CONF_TEMP_TARGET_ROUND, RoundOption.NONE)
        # Humidity calculation options
        self._humidity_current_avg_calc = CALC_TYPES[config.get(CONF_HUMIDITY_CURRENT_AVG, AverageOption.MEAN)]
        self._humidity_target_avg_calc = CALC_TYPES[config.get(CONF_HUMIDITY_TARGET_AVG, AverageOption.MEAN)]
        self._humidity_round = config.get(CONF_HUMIDITY_TARGET_ROUND, RoundOption.NONE)
        # HVAC mode strategy
        self._hvac_mode_strategy = config.get(CONF_HVAC_MODE_STRATEGY, HVAC_MODE_STRATEGY_NORMAL)
        # Feature strategy
        self._feature_strategy = config.get(CONF_FEATURE_STRATEGY, FEATURE_STRATEGY_INTERSECTION)
        # Debounce options
        self.debounce_delay = config.get(CONF_DEBOUNCE_DELAY, 0)
        self.retry_attempts = int(config.get(CONF_RETRY_ATTEMPTS, 0))
        self.retry_delay = config.get(CONF_RETRY_DELAY, 1)
        # Sensor entity ids
        self._temp_sensor_entity_ids = config.get(CONF_TEMP_SENSORS, [])
        self._temp_update_target_entity_ids = config.get(CONF_TEMP_UPDATE_TARGETS, [])
        self._humidity_sensor_entity_ids = config.get(CONF_HUMIDITY_SENSORS, [])
        self._humidity_update_target_entity_ids = config.get(CONF_HUMIDITY_UPDATE_TARGETS, [])
        # Expose member entities
        self._expose_member_entities = config.get(CONF_EXPOSE_MEMBER_ENTITIES, False)
        # Sync mode
        self.sync_mode = config.get(CONF_SYNC_MODE, SyncMode.STANDARD)
        self.min_temp_off = config.get(CONF_MIN_TEMP_OFF, False)

        # Calibration options
        self._temp_calibration_mode = config.get(CONF_TEMP_CALIBRATION_MODE, CalibrationMode.ABSOLUTE)
        self._calibration_heartbeat = int(config.get(CONF_CALIBRATION_HEARTBEAT, 0))
        self._calibration_heartbeat_unsub = None
        self._member_temp_avg = None
        self._target_member_map: dict[str, str] = {}

        # The list of entities to be tracked by GroupEntity
        self._entity_ids = entity_ids.copy()
        if self._temp_sensor_entity_ids:
            self._entity_ids.extend(self._temp_sensor_entity_ids)
        if self._humidity_sensor_entity_ids:
            self._entity_ids.extend(self._humidity_sensor_entity_ids)

        # State variables
        self.states: list[State] | None = None
        self.shared_target_state = TargetState()
        self.current_group_state = CurrentState()
        self.change_state: ChangeState | None = None

        # State managers
        self.climate_state_manager = ClimateStateManager(self)
        self.sync_mode_state_manager = SyncModeStateManager(self)
        self.window_control_state_manager = WindowControlStateManager(self)
        self.schedule_state_manager = ScheduleStateManager(self)

        # Call handlers
        self.climate_call_handler = ClimateCallHandler(self)
        self.sync_mode_call_handler = SyncCallHandler(self)
        self.window_control_call_handler = WindowControlCallHandler(self)
        self.schedule_call_handler = ScheduleCallHandler(self)

        # Modules
        self.sync_mode_handler = SyncModeHandler(self)
        self.window_control_handler = WindowControlHandler(self)
        self.schedule_handler = ScheduleHandler(self)

        self.startup_time: float | None = None
        self._last_active_hvac_mode = None

        # Attributes
        self._attr_supported_features = DEFAULT_SUPPORTED_FEATURES
        self._attr_temperature_unit = hass.config.units.temperature_unit

        self._attr_available = False
        self._attr_assumed_state = True

        self._attr_extra_state_attributes = {}

        self._attr_current_temperature = None
        self._attr_target_temperature = None
        self._attr_target_temperature_step = None
        self._attr_target_temperature_low = None
        self._attr_target_temperature_high = None
        self._attr_min_temp = DEFAULT_MIN_TEMP
        self._attr_max_temp = DEFAULT_MAX_TEMP
        self._attr_current_humidity = None
        self._attr_target_humidity = None
        self._attr_min_humidity = DEFAULT_MIN_HUMIDITY
        self._attr_max_humidity = DEFAULT_MAX_HUMIDITY

        self._attr_hvac_modes = [HVACMode.OFF]
        self._attr_hvac_mode = None

        self._attr_hvac_action = None

        self._attr_fan_modes = None
        self._attr_fan_mode = None

        self._attr_preset_modes = None
        self._attr_preset_mode = None

        self._attr_swing_modes = None
        self._attr_swing_mode = None

        self._attr_swing_horizontal_modes = None
        self._attr_swing_horizontal_mode = None

    @property
    def blocking_mode(self) -> bool:
        """Return True if any module is blocking hvac_mode changes (e.g. Window Control)."""
        return self.window_control_handler.force_off

    @property
    def device_info(self) -> dict[str, Any]:
        """Return the device info."""
        return {
            "identifiers": {(DOMAIN, self._attr_unique_id)},
            "name": self._attr_name,
        }

    async def async_added_to_hass(self) -> None:
        """Restore states before registering listeners."""

        # Some integrations, such as HomeKit, Google Home, and Alexa
        # require final property lists during the initialization process e.g. hvac_modes.
        # Therefore, we restore some of the last known states before registering the listeners.
        if (last_state := await self.async_get_last_state()) is not None:
             self._restore_state(last_state)

        # Register listeners
        self.async_on_remove(
            async_track_state_change_event(
                self.hass, self._entity_ids, self._state_change_listener
            )
        )

        # Build mapping between calibration targets and climate members in the same device
        registry = er.async_get(self.hass)
        self._target_member_map = {}
        for target_id in self._temp_update_target_entity_ids:
            if (entry := registry.async_get(target_id)) and entry.device_id:
                # Look for a climate member in the same device
                for climate_id in self.climate_entity_ids:
                    if (c_entry := registry.async_get(climate_id)) and c_entry.device_id == entry.device_id:
                        self._target_member_map[target_id] = climate_id
                        _LOGGER.debug("[%s] Mapped calibration target %s to member %s via device %s", self.entity_id, target_id, climate_id, entry.device_id)
                        break

        # Start calibration heartbeat if configured (requires external sensors as reference)
        if (
            self._calibration_heartbeat > 0
            and self._temp_update_target_entity_ids
            and self._temp_sensor_entity_ids
        ):
            _LOGGER.debug("[%s] Starting calibration heartbeat: %s min", self.entity_id, self._calibration_heartbeat)
            self._calibration_heartbeat_unsub = async_track_time_interval(
                self.hass,
                self._calibration_heartbeat_callback,
                timedelta(minutes=self._calibration_heartbeat)
            )

        # Setup window control (subscribes to sensor events)
        await self.window_control_handler.async_setup()

        # Setup schedule handler (subscribes to schedule entity and execution hooks)
        await self.schedule_handler.async_setup()

        # Update initial state
        self.async_defer_or_update_ha_state()

    async def async_will_remove_from_hass(self) -> None:
        """Handle removal."""
        if self._calibration_heartbeat_unsub:
            self._calibration_heartbeat_unsub()
            self._calibration_heartbeat_unsub = None
        await super().async_will_remove_from_hass()
        await self.climate_call_handler.async_cancel_all()
        self.window_control_handler.async_teardown()
        self.schedule_handler.async_teardown()

    def _restore_state(self, last_state: State) -> None:
        """Restore state from last known state."""
        last_attrs = last_state.attributes

        # We filter for ClimateState fields to ensure we only store relevant climate attributes
        restored_data = {}
        for field in fields(ClimateState):
            key = field.name
            if key == "hvac_mode" and last_state.state:
                restored_data[key] = last_state.state
            elif (value := last_attrs.get(key)) is not None:
                restored_data[key] = value

        if restored_data:
            self.shared_target_state = self.shared_target_state.update(**restored_data)
            _LOGGER.debug("[%s] Restored Persistent Target State: %s", self.entity_id, self.shared_target_state)

        # Restore modes and features
        if last_state.state:
            self._attr_hvac_mode = last_state.state
            self._attr_available = True
            self._attr_assumed_state = True
        if ATTR_HVAC_ACTION in last_attrs:
            self._attr_hvac_action = last_attrs[ATTR_HVAC_ACTION]
        if ATTR_HVAC_MODES in last_attrs:
            self._attr_hvac_modes = self._sort_hvac_modes(last_attrs[ATTR_HVAC_MODES])
        if ATTR_FAN_MODES in last_attrs:
            self._attr_fan_modes = last_attrs[ATTR_FAN_MODES]
        if ATTR_PRESET_MODES in last_attrs:
            self._attr_preset_modes = last_attrs[ATTR_PRESET_MODES]
        if ATTR_SWING_MODES in last_attrs:
            self._attr_swing_modes = last_attrs[ATTR_SWING_MODES]
        if ATTR_SWING_HORIZONTAL_MODES in last_attrs:
            self._attr_swing_horizontal_modes = last_attrs[ATTR_SWING_HORIZONTAL_MODES]
        if ATTR_SUPPORTED_FEATURES in last_attrs:
            self._attr_supported_features = last_attrs[ATTR_SUPPORTED_FEATURES] & SUPPORTED_FEATURES

        # Restore temperature and humidity values
        self._attr_target_temperature = last_attrs.get(ATTR_TEMPERATURE)
        self._attr_target_temperature_low = last_attrs.get(ATTR_TARGET_TEMP_LOW)
        self._attr_target_temperature_high = last_attrs.get(ATTR_TARGET_TEMP_HIGH)
        self._attr_target_temperature_step = last_attrs.get(ATTR_TARGET_TEMP_STEP)
        self._attr_target_humidity = last_attrs.get(ATTR_HUMIDITY)
        self._attr_current_temperature = last_attrs.get(ATTR_CURRENT_TEMPERATURE)
        self._attr_current_humidity = last_attrs.get(ATTR_CURRENT_HUMIDITY)
        self._attr_min_temp = last_attrs.get(ATTR_MIN_TEMP, DEFAULT_MIN_TEMP)
        self._attr_max_temp = last_attrs.get(ATTR_MAX_TEMP, DEFAULT_MAX_TEMP)
        self._attr_min_humidity = last_attrs.get(ATTR_MIN_HUMIDITY, DEFAULT_MIN_HUMIDITY)
        self._attr_max_humidity = last_attrs.get(ATTR_MAX_HUMIDITY, DEFAULT_MAX_HUMIDITY)

    def _reduce_attributes(self, attributes: list[Any], default: Any = None) -> list | int:
        """Reduce a list of attributes (modes or features) based on the feature strategy."""
        if not attributes:
            return default if default is not None else []

        # Handle list of features [ClimateEntityFeature | int]
        if isinstance(attributes[0], (ClimateEntityFeature, int)):
            # Intersection (common features)
            if self._feature_strategy == FEATURE_STRATEGY_INTERSECTION:
                return reduce(lambda x, y: x & y, attributes)
            # Union (all features)
            return reduce(lambda x, y: x | y, attributes)

        # Handle list of modes [HVACMode | str]
        # Filter out empty attributes or None
        valid_attributes = [attr for attr in attributes if attr]
        if not valid_attributes:
            return []

        # Intersection (common modes)
        if self._feature_strategy == FEATURE_STRATEGY_INTERSECTION:
            modes = list(reduce(lambda x, y: set(x) & set(y), valid_attributes))
        # Union (all modes)
        else:
            modes = list(reduce(lambda x, y: set(x) | set(y), valid_attributes))

        return modes

    def _sort_hvac_modes(self, modes: list[HVACMode | str]) -> list[HVACMode]:
        """Sort HVAC modes based on a predefined order."""

        # Make sure OFF is always included
        modes.append(HVACMode.OFF)

        # Return modes sorted in the order of the HVACMode enum
        return [m for m in HVACMode if m in modes]

    def _determine_hvac_mode(self, current_hvac_modes: list[str]) -> HVACMode | str | None:
        """Determine the group's HVAC mode based on member modes and strategy."""

        active_hvac_modes = [mode for mode in current_hvac_modes if mode != HVACMode.OFF]

        most_common_active_hvac_mode = None
        if active_hvac_modes:
            most_common_active_hvac_mode = max(active_hvac_modes, key=active_hvac_modes.count)

        strategy = self._hvac_mode_strategy

        # Auto strategy
        if strategy == HVAC_MODE_STRATEGY_AUTO:
            # If target HVAC mode is OFF or None, use normal strategy
            if self.shared_target_state.hvac_mode in (HVACMode.OFF, None):
                strategy = HVAC_MODE_STRATEGY_NORMAL
            # If target HVAC mode is ON (e.g. heat, cool), use off priority strategy
            else:
                strategy = HVAC_MODE_STRATEGY_OFF_PRIORITY

        # Normal strategy
        if strategy == HVAC_MODE_STRATEGY_NORMAL:
            # If all members are OFF, the group is OFF
            if all(mode == HVACMode.OFF for mode in current_hvac_modes) if current_hvac_modes else False:
                return HVACMode.OFF
            # Otherwise, return the most common active HVAC mode
            return most_common_active_hvac_mode

        # Off priority strategy
        if strategy == HVAC_MODE_STRATEGY_OFF_PRIORITY:
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

    @staticmethod
    def within_tolerance(val1: float, val2: float, tolerance: float = FLOAT_TOLERANCE) -> bool:
        """Check if two values are within a given tolerance."""
        try:
            return abs(float(val1) - float(val2)) < tolerance
        except (ValueError, TypeError):
            return False

    @staticmethod
    def mean_round(value: float | None, round_option: RoundOption = RoundOption.NONE) -> float | None:
        """Round the decimal part of a float to an fractional value with a certain precision."""

        if value is None:
            return None

        if round_option == RoundOption.HALF:
            return round(value * 2) / 2
        if round_option == RoundOption.INTEGER:
            return round(value)
        return value

    def _get_valid_member_states(self, entity_ids: list[str]) -> tuple[list[State], bool]:
        """Get valid states for provided entities.
        
        Returns:
            Tuple of (valid_states, all_ready) where all_ready is True when 
            all entity_ids have a valid (not unavailable/unknown) state.
        """
        all_states = [
            state
            for entity_id in entity_ids
            if (state := self.hass.states.get(entity_id)) is not None
        ]
        valid_states = [state for state in all_states if state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)]
        all_ready = len(valid_states) == len(entity_ids)
        return valid_states, all_ready

    def _get_avg_sensor_value(self, sensor_ids: list[str], calc_func) -> float | None:
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

    @callback
    def _calibration_heartbeat_callback(self, _now: datetime) -> None:
        """Force update calibration targets (heartbeat)."""
        _LOGGER.debug("[%s] Calibration heartbeat triggered", self.entity_id)
        self._sync_calibration(domain="temperature", force=True)

    def _sync_calibration(self, domain: str = "temperature", force: bool = False) -> None:
        """Sync external sensor values to target entities using the configured mode."""
        if domain == "temperature":
            entity_ids = self._temp_update_target_entity_ids
            value = self._attr_current_temperature
            mode = self._temp_calibration_mode
        else:
            entity_ids = self._humidity_update_target_entity_ids
            value = self._attr_current_humidity
            mode = CalibrationMode.ABSOLUTE

        if not entity_ids or value is None:
            return

        valid_states, _ = self._get_valid_member_states(entity_ids)

        for state in valid_states:
            try:
                # 1. Determine Target Value
                target_val = value
                if domain == "temperature":
                    if mode == CalibrationMode.OFFSET:
                        ref_temp = self._member_temp_avg
                        if state.entity_id in self._target_member_map:
                            m_id = self._target_member_map[state.entity_id]
                            if (m_s := self.hass.states.get(m_id)) and (m_t := m_s.attributes.get(ATTR_CURRENT_TEMPERATURE)) is not None:
                                ref_temp = float(m_t)
                        
                        if ref_temp is None:
                            continue

                        try:
                            curr_offset = float(state.state)
                        except (ValueError, TypeError):
                            curr_offset = 0.0
                        target_val = value - (ref_temp - curr_offset)

                    elif mode == CalibrationMode.SCALED:
                        # Scaled values (e.g. for Danfoss Ally) must be integers
                        target_val = int(round(value * 100))

                # 2. Determine if Sync is required
                try:
                    current_val = float(state.state)
                    # Comparison: exact for int (scaled), tolerance for float
                    out_of_sync = current_val != target_val if isinstance(target_val, int) else \
                                 abs(current_val - target_val) > FLOAT_TOLERANCE
                except (ValueError, TypeError):
                    out_of_sync = True # Force sync if current state is not a number

                if not (force or out_of_sync):
                    continue

                # 3. Dispatch Update (Validation via HA Core Exception)
                _LOGGER.debug(
                    "[%s] Updating %s to %s (domain=%s, mode=%s, force=%s)", 
                    self.entity_id, state.entity_id, target_val, domain, mode if domain == "temperature" else "absolute", force
                )
                self.hass.async_create_task(
                    self.hass.services.async_call(
                        NUMBER_DOMAIN,
                        "set_value",
                        {ATTR_ENTITY_ID: state.entity_id, "value": target_val},
                    )
                )
            except Exception as error:
                _LOGGER.error("[%s] Error updating target entity %s: %s", self.entity_id, state.entity_id, error)
                continue

    @callback
    def _state_change_listener(self, event: Event | None = None) -> None:
        """Handle state changes."""
        self.event = event
        self.async_defer_or_update_ha_state()

    @callback
    def async_update_group_state(self) -> None:
        """Query all members and determine the climate group state."""

        # Check if there are any valid states
        self.states, all_members_ready = self._get_valid_member_states(self.climate_entity_ids)

        # Set startup time if all members are ready
        if not self.startup_time and all_members_ready:
            self.startup_time = time.time()
            self.hass.async_create_task(self.schedule_handler.schedule_listener(caller="group"))
            _LOGGER.debug("[%s] All members ready the first time.", self.entity_id)

        # No states available
        if not self.states:
            self._attr_hvac_mode = None
            self._attr_available = False
            return

        # Calculate and store ChangeState
        if self.event:
            self.change_state = ChangeState.from_event(self.event, self.shared_target_state)

        # Check if the change state is from a member entity
        if self.change_state and self.change_state.entity_id in self.climate_entity_ids:
            self.sync_mode_handler.resync()

        # All available HVAC modes --> list of HVACMode (str), e.g. [<HVACMode.OFF: 'off'>, <HVACMode.HEAT: 'heat'>, <HVACMode.AUTO: 'auto'>, ...]
        self._attr_hvac_modes = self._sort_hvac_modes(
            self._reduce_attributes(list(find_state_attributes(self.states, ATTR_HVAC_MODES)))
        )

        # A list of all HVAC modes that are currently set
        current_hvac_modes = [state.state for state in self.states]

        # Determine the group's HVAC mode and update the attribute
        self._attr_hvac_mode = self._determine_hvac_mode(current_hvac_modes)

        # Update last active HVAC mode
        if self._attr_hvac_mode not in (HVACMode.OFF, self._last_active_hvac_mode):
            self._last_active_hvac_mode = self._attr_hvac_mode

        # The group is available if any member is available
        self._attr_available = True

        # The group state is assumed if not all states are equal
        self._attr_assumed_state = not states_equal(self.states)

        # Determine HVAC action
        current_hvac_actions = list(find_state_attributes(self.states, ATTR_HVAC_ACTION))
        self._attr_hvac_action = self._determine_hvac_action(current_hvac_actions)

        # Get temperature unit from system settings
        self._attr_temperature_unit = self.hass.config.units.temperature_unit

        # Calculate Current Temperature
        self._member_temp_avg = reduce_attribute(self.states, ATTR_CURRENT_TEMPERATURE, reduce=lambda *data: self._temp_current_avg_calc(data))

        if self._temp_sensor_entity_ids:
            # Use ONLY external sensors if configured
            self._attr_current_temperature = self._get_avg_sensor_value(self._temp_sensor_entity_ids, self._temp_current_avg_calc)
            # Write calibration targets
            if self._attr_current_temperature is not None:
                self._sync_calibration("temperature")
            else:
                _LOGGER.debug("[%s] External sensors %s configured but unavailable. Current temperature will be None", self.entity_id, self._temp_sensor_entity_ids)
        else:
            # Use member average if NO external sensors configured
            self._attr_current_temperature = self._member_temp_avg

        # Target temperature is calculated using the 'average_option' method from all ATTR_TEMPERATURE values.
        self._attr_target_temperature = reduce_attribute(self.states, ATTR_TEMPERATURE, reduce=lambda *data: self._temp_target_avg_calc(data))
        # The result is rounded according to the 'round' config
        if self._attr_target_temperature is not None:
            self._attr_target_temperature = self.mean_round(self._attr_target_temperature, self._temp_round)

        # Target temperature low is calculated using the 'average_option' method from all ATTR_TARGET_TEMP_LOW values
        self._attr_target_temperature_low = reduce_attribute(self.states, ATTR_TARGET_TEMP_LOW, reduce=lambda *data: self._temp_target_avg_calc(data))
        # The result is rounded according to the 'round' config
        if self._attr_target_temperature_low is not None:
            self._attr_target_temperature_low = self.mean_round(self._attr_target_temperature_low, self._temp_round)

        # Target temperature high is calculated using the 'average_option' method from all ATTR_TARGET_TEMP_HIGH values
        self._attr_target_temperature_high = reduce_attribute(self.states, ATTR_TARGET_TEMP_HIGH, reduce=lambda *data: self._temp_target_avg_calc(data))
        # The result is rounded according to the 'round' config
        if self._attr_target_temperature_high is not None:
            self._attr_target_temperature_high = self.mean_round(self._attr_target_temperature_high, self._temp_round)

        # Target temperature step is the highest of all ATTR_TARGET_TEMP_STEP values
        self._attr_target_temperature_step = reduce_attribute(self.states, ATTR_TARGET_TEMP_STEP, reduce=max)

        # Min temperature is the highest of all ATTR_MIN_TEMP values
        self._attr_min_temp = reduce_attribute(self.states, ATTR_MIN_TEMP, reduce=max, default=DEFAULT_MIN_TEMP)

        # Max temperature is the lowest of all ATTR_MAX_TEMP values
        self._attr_max_temp = reduce_attribute(self.states, ATTR_MAX_TEMP, reduce=min, default=DEFAULT_MAX_TEMP)

        # Calculate Current Humidity
        if self._humidity_sensor_entity_ids:
            # Use ONLY external sensors if configured
            self._attr_current_humidity = self._get_avg_sensor_value(self._humidity_sensor_entity_ids, self._humidity_current_avg_calc)
            if self._attr_current_humidity is not None:
                self._sync_calibration("humidity")
            else:
                _LOGGER.debug("[%s] External sensors %s configured but unavailable. Current humidity will be None", self.entity_id, self._humidity_sensor_entity_ids)
        else:
            # Use member average if NO external sensors configured
            self._attr_current_humidity = reduce_attribute(self.states, ATTR_CURRENT_HUMIDITY, reduce=lambda *data: self._humidity_current_avg_calc(data))

        # Target humidity is calculated using the 'average_option' method from all ATTR_HUMIDITY values.
        self._attr_target_humidity = reduce_attribute(self.states, ATTR_HUMIDITY, reduce=lambda *data: self._humidity_target_avg_calc(data))
        # The result is rounded according to the 'round' config
        if self._attr_target_humidity is not None:
            self._attr_target_humidity = self.mean_round(self._attr_target_humidity, self._humidity_round)

        # Min humidity is the highest of all ATTR_MIN_HUMIDITY values
        self._attr_min_humidity = reduce_attribute(self.states, ATTR_MIN_HUMIDITY, reduce=max, default=DEFAULT_MIN_HUMIDITY)

        # Max humidity is the lowest of all ATTR_MAX_HUMIDITY values
        self._attr_max_humidity = reduce_attribute(self.states, ATTR_MAX_HUMIDITY, reduce=min, default=DEFAULT_MAX_HUMIDITY)

        # Available fan modes --> list of list of strings, e.g. [['auto', 'low', 'medium', 'high'], ['auto', 'silent', 'turbo'], ...]
        self._attr_fan_modes = sorted(self._reduce_attributes(list(find_state_attributes(self.states, ATTR_FAN_MODES))))
        self._attr_fan_mode = most_frequent_attribute(self.states, ATTR_FAN_MODE)

        # Available preset modes --> list of list of strings, e.g. [['home', 'away', 'eco'], ['home', 'sleep', 'away', 'boost'], ...]
        self._attr_preset_modes = sorted(self._reduce_attributes(list(find_state_attributes(self.states, ATTR_PRESET_MODES))))
        self._attr_preset_mode = most_frequent_attribute(self.states, ATTR_PRESET_MODE)

        # Available swing modes --> list of list of strings, e.g. [['off', 'left', 'right', 'center', 'swing'], ['off', 'swing'], ...]
        self._attr_swing_modes = sorted(self._reduce_attributes(list(find_state_attributes(self.states, ATTR_SWING_MODES))))
        self._attr_swing_mode = most_frequent_attribute(self.states, ATTR_SWING_MODE)

        # Available horizontal swing modes --> list of list of strings, e.g. [['off', 'left', 'right', 'center', 'swing'], ['off', 'swing'], ...]
        self._attr_swing_horizontal_modes = sorted(self._reduce_attributes(list(find_state_attributes(self.states, ATTR_SWING_HORIZONTAL_MODES))))
        self._attr_swing_horizontal_mode = most_frequent_attribute(self.states, ATTR_SWING_HORIZONTAL_MODE)

        # Supported features --> list of unionized ClimateEntityFeature (int), e.g. [<ClimateEntityFeature.TARGET_TEMPERATURE_RANGE|FAN_MODE|PRESET_MODE|SWING_MODE|TURN_OFF|TURN_ON: 442>, <ClimateEntityFeature...: 941>, ...]
        attr_supported_features = self._reduce_attributes(list(find_state_attributes(self.states, ATTR_SUPPORTED_FEATURES)), default=0)

        # Add default supported features
        self._attr_supported_features = attr_supported_features | DEFAULT_SUPPORTED_FEATURES

        # Remove unsupported features
        self._attr_supported_features &= SUPPORTED_FEATURES

        # Populate current_group_state
        self.current_group_state = CurrentState(
            hvac_mode=self._attr_hvac_mode,
            temperature=self._attr_target_temperature,
            target_temp_low=self._attr_target_temperature_low,
            target_temp_high=self._attr_target_temperature_high,
            humidity=self._attr_target_humidity,
            preset_mode=self._attr_preset_mode,
            fan_mode=self._attr_fan_mode,
            swing_mode=self._attr_swing_mode,
            swing_horizontal_mode=self._attr_swing_horizontal_mode
        )

        # Update extra state attributes
        self._attr_extra_state_attributes = {
            CONF_TEMP_SENSORS: self._temp_sensor_entity_ids,
            CONF_HUMIDITY_SENSORS: self._humidity_sensor_entity_ids,
            CONF_SYNC_MODE: self.sync_mode,
            ATTR_ASSUMED_STATE: self._attr_assumed_state,
            ATTR_LAST_ACTIVE_HVAC_MODE: self._last_active_hvac_mode,
            ATTR_CURRENT_HVAC_MODES: current_hvac_modes,
        }

        # Expose member entities if configured
        if self._expose_member_entities:
            self._attr_extra_state_attributes[ATTR_ENTITY_ID] = self.climate_entity_ids

        # Cold Start: Populate target store from current group state if empty.
        if self.shared_target_state == TargetState():
            initial_data = self.current_group_state.to_dict()
            if initial_data:
                # We use restore source to bypass blocking during startup
                self.schedule_state_manager.update(last_source="restore", **initial_data)
                _LOGGER.debug("[%s] Initialized Persistent Target State from current values: %s", self.entity_id, self.shared_target_state)

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Forward the set_hvac_mode command to all climate in the climate group."""
        self.climate_state_manager.update(hvac_mode=hvac_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_HVAC_MODE: hvac_mode})

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Forward the set_temperature command to all climate in the climate group."""
        self.climate_state_manager.update(**kwargs)
        await self.climate_call_handler.call_debounced(data=kwargs)

    async def async_set_humidity(self, humidity: int) -> None:
        """Set new target humidity."""
        self.climate_state_manager.update(humidity=humidity)
        await self.climate_call_handler.call_debounced(data={ATTR_HUMIDITY: humidity})

    async def async_set_fan_mode(self, fan_mode: str) -> None:
        """Forward the set_fan_mode to all climate in the climate group."""
        self.climate_state_manager.update(fan_mode=fan_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_FAN_MODE: fan_mode})

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        """Forward the set_preset_mode to all climate in the climate group."""
        self.climate_state_manager.update(preset_mode=preset_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_PRESET_MODE: preset_mode})

    async def async_set_swing_mode(self, swing_mode: str) -> None:
        """Forward the set_swing_mode to all climate in the climate group."""
        self.climate_state_manager.update(swing_mode=swing_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_SWING_MODE: swing_mode})

    async def async_set_swing_horizontal_mode(self, swing_horizontal_mode: str) -> None:
        """Set new target horizontal swing operation."""
        self.climate_state_manager.update(swing_horizontal_mode=swing_horizontal_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_SWING_HORIZONTAL_MODE: swing_horizontal_mode})

    async def async_turn_on(self) -> None:
        """Forward the turn_on command to all climate in the climate group."""

        # Set to the last active HVAC mode if available
        if self._last_active_hvac_mode is not None:
            _LOGGER.debug("[%s] Turn on with the last active HVAC mode: %s", self.entity_id, self._last_active_hvac_mode)
            await self.async_set_hvac_mode(self._last_active_hvac_mode)

        # Try to set the first available HVAC mode
        elif self._attr_hvac_modes:
            for mode in self._attr_hvac_modes:
                if mode != HVACMode.OFF:
                    _LOGGER.debug("[%s] Turn on with first available HVAC mode: %s", self.entity_id, mode)
                    await self.async_set_hvac_mode(mode)
                    break

        # No HVAC modes available
        else:
            _LOGGER.debug("[%s] Can't turn on: No HVAC modes available", self.entity_id)

    async def async_turn_off(self) -> None:
        """Forward the turn_off command to all climate in the climate group."""

        # Only turn off if HVACMode.OFF is supported
        if HVACMode.OFF in self._attr_hvac_modes:
            _LOGGER.debug("[%s] Turn off with HVAC mode 'off'", self.entity_id)
            await self.async_set_hvac_mode(HVACMode.OFF)

        # HVACMode.OFF not supported
        else:
            _LOGGER.debug("[%s] Can't turn off: HVAC mode 'off' not available", self.entity_id)

    async def async_toggle(self) -> None:
        """Toggle the entity."""

        if self._attr_hvac_mode == HVACMode.OFF:
            await self.async_turn_on()
        else:
            await self.async_turn_off()
