"""This platform allows several climate devices to be grouped into one climate device."""
from __future__ import annotations

import logging
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
    DOMAIN as CLIMATE_DOMAIN,
    SERVICE_SET_FAN_MODE,
    SERVICE_SET_HUMIDITY,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_PRESET_MODE,
    SERVICE_SET_SWING_HORIZONTAL_MODE,
    SERVICE_SET_SWING_MODE,
    SERVICE_SET_TEMPERATURE,
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
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_SUPPORTED_FEATURES,
    ATTR_TEMPERATURE,
    CONF_ENTITIES,
    CONF_NAME,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    ATTR_ASSUMED_STATE,
    ATTR_CURRENT_HVAC_MODES,
    ATTR_GROUP_IN_SYNC,
    ATTR_LAST_ACTIVE_HVAC_MODE,
    ATTR_TARGET_HVAC_MODE,
    CONF_AVERAGE_OPTION,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_HVAC_MODE_STRATEGY,
    CONF_ROUND_OPTION,
    CONF_TEMP_SENSOR,
    CONF_USE_TEMP_SENSOR,
    HVAC_MODE_STRATEGY_AUTO,
    HVAC_MODE_STRATEGY_NORMAL,
    HVAC_MODE_STRATEGY_OFF_PRIORITY,
    AverageOption,
    RoundOption,
)

CALC_TYPES = {
    AverageOption.MIN: min,
    AverageOption.MAX: max,
    AverageOption.MEAN: mean,
    AverageOption.MEDIAN: median,
}

_LOGGER = logging.getLogger(__name__)

# No limit on parallel updates to enable a group calling another group
PARALLEL_UPDATES = 0

# Supported features for the climate group entity.
SUPPORT_FLAGS = (
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

DEFAULT_SUPPORTED_FEATURES = ClimateEntityFeature.TURN_OFF | ClimateEntityFeature.TURN_ON

def mean_round(value: float | None, round_option: str = RoundOption.NONE) -> float | None:
    """Round the decimal part of a float to an fractional value with a certain precision."""

    if value is None:
        return None

    if round_option == RoundOption.HALF:
        return round(value * 2) / 2
    if round_option == RoundOption.INTEGER:
        return round(value)
    return value


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback
    ) -> None:
    """Initialize Climate Group config entry."""

    # Support both data (initial config) and options (updates via UI)
    config = {**config_entry.data, **config_entry.options}

    registry = er.async_get(hass)
    entities = er.async_validate_entity_ids(registry, config[CONF_ENTITIES])

    # TEMP: Get HVAC mode strategy, migrating from old key if necessary
    hvac_mode_strategy = config.get(CONF_HVAC_MODE_STRATEGY)
    if hvac_mode_strategy is None:
        if config.get("hvac_mode_off_priority", False):
            hvac_mode_strategy = HVAC_MODE_STRATEGY_OFF_PRIORITY
        else:
            hvac_mode_strategy = HVAC_MODE_STRATEGY_NORMAL

    async_add_entities(
        [
            ClimateGroup(
                unique_id=config_entry.unique_id,
                name=config.get(CONF_NAME, config_entry.title),
                entity_ids=entities,
                average_option=config.get(CONF_AVERAGE_OPTION, AverageOption.MEAN),
                round_option=config.get(CONF_ROUND_OPTION, RoundOption.NONE),
                temp_sensor=config.get(CONF_TEMP_SENSOR),
                expose_member_entities=config.get(CONF_EXPOSE_MEMBER_ENTITIES, False),
                hvac_mode_strategy=hvac_mode_strategy,
            )
        ]
    )


class ClimateGroup(GroupEntity, ClimateEntity):
    """Representation of a climate group."""

    def __init__(
        self,
        unique_id: str | None,
        name: str,
        entity_ids: list[str],
        average_option: str,
        round_option: str,
        temp_sensor: str | None,
        expose_member_entities: bool,
        hvac_mode_strategy: str,
    ) -> None:
        """Initialize a climate group."""

        self._attr_unique_id = unique_id
        self._attr_name = name
        self._climate_entity_ids = entity_ids
        self._average_calc = CALC_TYPES[average_option]
        self._round_option = round_option
        self._temp_sensor_entity_id = temp_sensor
        self._expose_member_entities = expose_member_entities
        self._hvac_mode_strategy = hvac_mode_strategy

        # The list of entities to be tracked by GroupEntity
        self._entity_ids = entity_ids.copy()
        if temp_sensor:
            self._entity_ids.append(temp_sensor)

        self._target_hvac_mode = None
        self._last_active_hvac_mode = None

        self._attr_supported_features = DEFAULT_SUPPORTED_FEATURES
        self._attr_temperature_unit = UnitOfTemperature.CELSIUS

        self._attr_available = False
        self._attr_assumed_state = True

        self._attr_extra_state_attributes = {}

        self._attr_current_temperature = None
        self._attr_averaged_current_temperature = None
        self._attr_target_temperature = None
        self._attr_target_temperature_step = None
        self._attr_target_temperature_low = None
        self._attr_target_temperature_high = None
        self._attr_min_temp = None
        self._attr_max_temp = None
        self._attr_current_humidity = None
        self._attr_target_humidity = None
        self._attr_min_humidity = None
        self._attr_max_humidity = None

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

    @callback
    def async_update_group_state(self) -> None:
        """Query all members and determine the climate group state."""

        # Initialize extra state attributes
        self._attr_extra_state_attributes = {
            CONF_AVERAGE_OPTION: self._average_calc.__name__,
            CONF_ROUND_OPTION: self._round_option,
            CONF_TEMP_SENSOR: self._temp_sensor_entity_id,
            CONF_EXPOSE_MEMBER_ENTITIES: self._expose_member_entities,
            CONF_HVAC_MODE_STRATEGY: self._hvac_mode_strategy,
        }

        # Determine assumed state and availability for the group
        all_states = [
            state
            for entity_id in self._climate_entity_ids
            if (state := self.hass.states.get(entity_id)) is not None
        ]

        # Filter out unavailable and unknown states
        states = [state for state in all_states if state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)]

        # Check if there are any valid states
        if states:
            # All available HVAC modes
            available_hvac_modes = list(find_state_attributes(states, ATTR_HVAC_MODES))
            self._attr_hvac_modes = list(set().union(*available_hvac_modes)) if available_hvac_modes else [HVACMode.OFF]

            # A list of all HVAC modes that are currently set
            current_hvac_modes = sorted([state.state for state in states])

            # A list of active HVAC modes that are currently set
            active_hvac_modes = [mode for mode in current_hvac_modes if mode != HVACMode.OFF]

            # Determine most common active HVAC mode
            most_common_active_hvac_mode = max(active_hvac_modes, key=active_hvac_modes.count) if active_hvac_modes else None

            # Determine the group's HVAC mode based on the strategy
            strategy = self._hvac_mode_strategy

            if strategy == HVAC_MODE_STRATEGY_AUTO:
                if self._target_hvac_mode in (HVACMode.OFF, None):
                    strategy = HVAC_MODE_STRATEGY_NORMAL
                else:
                    strategy = HVAC_MODE_STRATEGY_OFF_PRIORITY

            if strategy == HVAC_MODE_STRATEGY_NORMAL:
                if all(mode == HVACMode.OFF for mode in current_hvac_modes) if current_hvac_modes else False:
                    self._attr_hvac_mode = HVACMode.OFF
                else:
                    self._attr_hvac_mode = most_common_active_hvac_mode
            elif strategy == HVAC_MODE_STRATEGY_OFF_PRIORITY:
                if HVACMode.OFF in current_hvac_modes:
                    self._attr_hvac_mode = HVACMode.OFF
                else:
                    self._attr_hvac_mode = most_common_active_hvac_mode

            # Update last active HVAC mode if it has changed and is not HVACMode.OFF
            if (self._attr_hvac_mode != HVACMode.OFF) and (self._attr_hvac_mode != self._last_active_hvac_mode):
                self._last_active_hvac_mode = self._attr_hvac_mode

            # The group is available if any member is available
            self._attr_available = True

            # The group state is assumed if not all states are equal
            self._attr_assumed_state = not states_equal(states)

            # Get temperature unit from system settings
            self._attr_temperature_unit = self.hass.config.units.temperature_unit

            # Averaged current temperature of all members
            self._attr_averaged_current_temperature = reduce_attribute(states, ATTR_CURRENT_TEMPERATURE, reduce=lambda *data: mean(data))

            # Get current temperature from sensor or fallback to averaged temperature
            self._attr_current_temperature = self._attr_averaged_current_temperature
            if self._temp_sensor_entity_id is not None:
                sensor_state = self.hass.states.get(self._temp_sensor_entity_id)
                if sensor_state and sensor_state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                    try:
                        self._attr_current_temperature = float(sensor_state.state)
                    except (ValueError, TypeError):
                        _LOGGER.warning("Could not retrieve temperature from sensor %s, falling back to averaged temperature", self._temp_sensor_entity_id)
                else:
                    _LOGGER.warning("Sensor %s is unavailable, falling back to averaged temperature", self._temp_sensor_entity_id)

            # Target temperature is calculated using the 'average_option' method from all ATTR_TEMPERATURE values.
            self._attr_target_temperature = reduce_attribute(states, ATTR_TEMPERATURE, reduce=lambda *data: self._average_calc(data))
            # The result is rounded according to the 'round_option' config
            if self._attr_target_temperature is not None:
                self._attr_target_temperature = mean_round(self._attr_target_temperature, self._round_option)

            # Target temperature low is calculated using the 'average_option' method from all ATTR_TARGET_TEMP_LOW values
            self._attr_target_temperature_low = reduce_attribute(states, ATTR_TARGET_TEMP_LOW, reduce=lambda *data: self._average_calc(data))
            # The result is rounded according to the 'round_option' config
            if self._attr_target_temperature_low is not None:
                self._attr_target_temperature_low = mean_round(self._attr_target_temperature_low, self._round_option    )

            # Target temperature high is calculated using the 'average_option' method from all ATTR_TARGET_TEMP_HIGH values
            self._attr_target_temperature_high = reduce_attribute(states, ATTR_TARGET_TEMP_HIGH, reduce=lambda *data: self._average_calc(data))
            # The result is rounded according to the 'round_option' config
            if self._attr_target_temperature_high is not None:
                self._attr_target_temperature_high = mean_round(self._attr_target_temperature_high, self._round_option)

            # Target temperature step is the highest of all ATTR_TARGET_TEMP_STEP values
            self._attr_target_temperature_step = reduce_attribute(states, ATTR_TARGET_TEMP_STEP, reduce=max)

            # Min temperature is the highest of all ATTR_MIN_TEMP values
            self._attr_min_temp = reduce_attribute(states, ATTR_MIN_TEMP, reduce=max, default=DEFAULT_MIN_TEMP)

            # Max temperature is the lowest of all ATTR_MAX_TEMP values
            self._attr_max_temp = reduce_attribute(states, ATTR_MAX_TEMP, reduce=min, default=DEFAULT_MAX_TEMP)

            # Current humidity is the average of all ATTR_CURRENT_HUMIDITY values
            self._attr_current_humidity = reduce_attribute(states, ATTR_CURRENT_HUMIDITY, reduce=lambda *data: mean(data))

            # Target humidity is calculated using the 'average_option' method from all ATTR_HUMIDITY values.
            self._attr_target_humidity = reduce_attribute(states, ATTR_HUMIDITY, reduce=lambda *data: self._average_calc(data))
            # The result is rounded according to the 'round_option' config
            if self._attr_target_humidity is not None:
                self._attr_target_humidity = mean_round(self._attr_target_humidity, self._round_option)

            # Min humidity is the highest of all ATTR_MIN_HUMIDITY values
            self._attr_min_humidity = reduce_attribute(states, ATTR_MIN_HUMIDITY, reduce=max, default=DEFAULT_MIN_HUMIDITY)

            # Max humidity is the lowest of all ATTR_MAX_HUMIDITY values
            self._attr_max_humidity = reduce_attribute(states, ATTR_MAX_HUMIDITY, reduce=min, default=DEFAULT_MAX_HUMIDITY)

            # HVAC action is the most common active action
            current_hvac_actions = list(find_state_attributes(states, ATTR_HVAC_ACTION))
            if current_hvac_actions:
                # Get all active HVAC actions (except HVACAction.OFF)
                active_hvac_actions = [action for action in current_hvac_actions if action != HVACAction.OFF]
                if active_hvac_actions:
                    # Set hvac_action to the most common active HVAC action
                    self._attr_hvac_action = max(active_hvac_actions, key=active_hvac_actions.count)
                # Set hvac_action to HVACAction.OFF if all actions are HVACAction.OFF
                elif all(action == HVACAction.OFF for action in current_hvac_actions):
                    self._attr_hvac_action = HVACAction.OFF
            else:
                # No HCVAC actions, set to None
                self._attr_hvac_action = None

            # Available fan modes
            fan_modes = list(find_state_attributes(states, ATTR_FAN_MODES))
            self._attr_fan_modes = list(set().union(*fan_modes)) if fan_modes else None
            self._attr_fan_mode = most_frequent_attribute(states, ATTR_FAN_MODE)

            # Available preset modes
            preset_modes = list(find_state_attributes(states, ATTR_PRESET_MODES))
            self._attr_preset_modes = list(set().union(*preset_modes)) if preset_modes else None
            self._attr_preset_mode = most_frequent_attribute(states, ATTR_PRESET_MODE)

            # Available swing modes
            swing_modes = list(find_state_attributes(states, ATTR_SWING_MODES))
            self._attr_swing_modes = list(set().union(*swing_modes)) if swing_modes else None
            self._attr_swing_mode = most_frequent_attribute(states, ATTR_SWING_MODE)

            # Available horizontal swing modes
            swing_horizontal_modes = list(find_state_attributes(states, ATTR_SWING_HORIZONTAL_MODES))
            self._attr_swing_horizontal_modes = list(set().union(*swing_horizontal_modes)) if swing_horizontal_modes else None
            self._attr_swing_horizontal_mode = most_frequent_attribute(states, ATTR_SWING_HORIZONTAL_MODE)

            # Supported features
            self._attr_supported_features = DEFAULT_SUPPORTED_FEATURES
            for support in find_state_attributes(states, ATTR_SUPPORTED_FEATURES):
                # Initialize supported features with the first member's features
                if self._attr_supported_features == DEFAULT_SUPPORTED_FEATURES:
                    self._attr_supported_features = support
                    continue
                # Bitwise AND the supported features of all members
                self._attr_supported_features &= support

            # Update extra state attributes
            self._attr_extra_state_attributes[ATTR_ASSUMED_STATE] = self._attr_assumed_state
            self._attr_extra_state_attributes[ATTR_LAST_ACTIVE_HVAC_MODE] = self._last_active_hvac_mode
            self._attr_extra_state_attributes[ATTR_TARGET_HVAC_MODE] = self._target_hvac_mode
            self._attr_extra_state_attributes[ATTR_CURRENT_HVAC_MODES] = current_hvac_modes
            # Check if all members are in sync with the target HVAC mode
            self._attr_extra_state_attributes[ATTR_GROUP_IN_SYNC] = (
                len(set(current_hvac_modes)) == 1 and current_hvac_modes[0] == self._target_hvac_mode
            )
            # Expose member entities if configured
            if self._expose_member_entities:
                self._attr_extra_state_attributes[ATTR_ENTITY_ID] = self._climate_entity_ids

        # No states available
        else:
            self._attr_hvac_mode = None
            self._attr_available = False

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Forward the set_temperature command to all climate in the climate group."""

        data = {ATTR_ENTITY_ID: self._climate_entity_ids}

        if ATTR_HVAC_MODE in kwargs:
            await self.async_set_hvac_mode(kwargs[ATTR_HVAC_MODE])

        if ATTR_TEMPERATURE in kwargs:
            data[ATTR_TEMPERATURE] = kwargs[ATTR_TEMPERATURE]
        if ATTR_TARGET_TEMP_LOW in kwargs:
            data[ATTR_TARGET_TEMP_LOW] = kwargs[ATTR_TARGET_TEMP_LOW]
        if ATTR_TARGET_TEMP_HIGH in kwargs:
            data[ATTR_TARGET_TEMP_HIGH] = kwargs[ATTR_TARGET_TEMP_HIGH]

        _LOGGER.debug("Setting temperature: %s", data)

        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_TEMPERATURE, data, blocking=True, context=self._context
        )

    async def async_set_humidity(self, humidity: int) -> None:
        """Set new target humidity."""

        data = {ATTR_ENTITY_ID: self._climate_entity_ids, ATTR_HUMIDITY: humidity}
        _LOGGER.debug("Setting humidity: %s", data)
        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_HUMIDITY, data, blocking=True, context=self._context
        )

    async def async_set_fan_mode(self, fan_mode: str) -> None:
        """Forward the set_fan_mode to all climate in the climate group."""

        data = {ATTR_ENTITY_ID: self._climate_entity_ids, ATTR_FAN_MODE: fan_mode}
        _LOGGER.debug("Setting fan mode: %s", data)
        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_FAN_MODE, data, blocking=True, context=self._context
        )

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Forward the set_hvac_mode command to all climate in the climate group."""

        # Update target HVAC mode
        self._target_hvac_mode = hvac_mode
        self.async_defer_or_update_ha_state()  # Update group state and write ha state

        data = {ATTR_ENTITY_ID: self._climate_entity_ids, ATTR_HVAC_MODE: hvac_mode}
        _LOGGER.debug("Setting HVAC mode: %s", data)
        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_HVAC_MODE, data, blocking=True, context=self._context
        )

    async def async_set_swing_mode(self, swing_mode: str) -> None:
        """Forward the set_swing_mode to all climate in the climate group."""

        data = {ATTR_ENTITY_ID: self._climate_entity_ids, ATTR_SWING_MODE: swing_mode}
        _LOGGER.debug("Setting swing mode: %s", data)
        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_SWING_MODE, data, blocking=True, context=self._context,
        )

    async def async_set_swing_horizontal_mode(self, swing_horizontal_mode: str) -> None:
        """Set new target horizontal swing operation."""

        data = {ATTR_ENTITY_ID: self._climate_entity_ids, ATTR_SWING_HORIZONTAL_MODE: swing_horizontal_mode}
        _LOGGER.debug("Setting horizontal swing mode: %s", data)
        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_SWING_HORIZONTAL_MODE, data, blocking=True, context=self._context,
        )

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        """Forward the set_preset_mode to all climate in the climate group."""
        data = {ATTR_ENTITY_ID: self._climate_entity_ids, ATTR_PRESET_MODE: preset_mode}
        _LOGGER.debug("Setting preset mode: %s", data)
        await self.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_PRESET_MODE, data, blocking=True, context=self._context,
        )

    async def async_turn_on(self) -> None:
        """Forward the turn_on command to all climate in the climate group."""

        # Set to the last active HVAC mode if available
        if self._last_active_hvac_mode is not None:
            _LOGGER.debug("Turn on with the last active HVAC mode: %s", self._last_active_hvac_mode)
            await self.async_set_hvac_mode(self._last_active_hvac_mode)

        # Try to set the first available HVAC mode
        elif self._attr_hvac_modes:
            for mode in self._attr_hvac_modes:
                if mode != HVACMode.OFF:
                    _LOGGER.debug("Turn on with first available HVAC mode: %s", mode)
                    await self.async_set_hvac_mode(mode)
                    break

        # No HVAC modes available
        else:
            _LOGGER.debug("Can't turn on: No HVAC modes available")

    async def async_turn_off(self) -> None:
        """Forward the turn_off command to all climate in the climate group."""

        # Only turn off if HVACMode.OFF is supported
        if HVACMode.OFF in self._attr_hvac_modes:
            _LOGGER.debug("Turn off with HVAC mode 'off'")
            await self.async_set_hvac_mode(HVACMode.OFF)

        # HVACMode.OFF not supported
        else:
            _LOGGER.debug("Can't turn off: HVAC mode 'off' not available")

    async def async_toggle(self) -> None:
        """Toggle the entity."""

        if self._attr_hvac_mode == HVACMode.OFF:
            await self.async_turn_on()
        else:
            await self.async_turn_off()
