"""Constants for the Climate Group helper integration."""

from enum import StrEnum
from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_HUMIDITY,
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_PRESET_MODE,
    ATTR_PRESET_MODES,
    ATTR_SWING_MODE,
    ATTR_SWING_MODES,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_HORIZONTAL_MODES,
    SERVICE_SET_FAN_MODE,
    SERVICE_SET_HUMIDITY,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_PRESET_MODE,
    SERVICE_SET_SWING_HORIZONTAL_MODE,
    SERVICE_SET_SWING_MODE,
    SERVICE_SET_TEMPERATURE,
)
from homeassistant.const import ATTR_TEMPERATURE

DOMAIN = "climate_group_helper"
DEFAULT_NAME = "Climate Group"


class AverageOption(StrEnum):
    """Averaging options for temperature."""

    MEAN = "mean"
    MEDIAN = "median"
    MIN = "min"
    MAX = "max"


class RoundOption(StrEnum):
    """Rounding options for temperature."""

    NONE = "none"
    HALF = "half"
    INTEGER = "integer"


class SyncMode(StrEnum):
    """Enum for sync modes."""

    STANDARD = "standard"
    LOCK = "lock"
    MIRROR = "mirror"


# Configuration keys
CONF_TEMP_CURRENT_AVG_OPTION = "temp_current_avg_option"
CONF_TEMP_TARGET_AVG_OPTION = "temp_target_avg_option"
CONF_TEMP_TARGET_ROUND_OPTION = "temp_target_round_option"
CONF_HUMIDITY_CURRENT_AVG_OPTION = "humidity_current_avg_option"
CONF_HUMIDITY_TARGET_AVG_OPTION = "humidity_target_avg_option"
CONF_HUMIDITY_TARGET_ROUND_OPTION = "humidity_target_round_option"

CONF_DEBOUNCE_DELAY = "debounce_delay"
CONF_EXPOSE_SMART_SENSORS = "expose_smart_sensors"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_FEATURE_STRATEGY = "feature_strategy"
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"
CONF_RETRY_ATTEMPTS = "retry_attempts"
CONF_RETRY_DELAY = "retry_delay"
CONF_SYNC_MODE = "sync_mode"

CONF_TEMP_UPDATE_TARGETS = "temp_update_targets"
CONF_TEMP_SENSORS = "temp_sensors"
CONF_HUMIDITY_UPDATE_TARGETS = "humidity_update_targets"
CONF_HUMIDITY_SENSORS = "humidity_sensors"

CONF_SYNC_ATTRIBUTES = "sync_attributes"

# HVAC mode strategies
HVAC_MODE_STRATEGY_AUTO = "auto"
HVAC_MODE_STRATEGY_NORMAL = "normal"
HVAC_MODE_STRATEGY_OFF_PRIORITY = "off_priority"

# Feature strategies
FEATURE_STRATEGY_INTERSECTION = "intersection"
FEATURE_STRATEGY_UNION = "union"

# Attribute keys
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_CURRENT_HVAC_MODES = "current_hvac_modes"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"

# Attribute to service call mapping
ATTR_SERVICE_MAPPING = {
    ATTR_HVAC_MODE: SERVICE_SET_HVAC_MODE,
    ATTR_TEMPERATURE: SERVICE_SET_TEMPERATURE,
    ATTR_TARGET_TEMP_LOW: SERVICE_SET_TEMPERATURE,
    ATTR_TARGET_TEMP_HIGH: SERVICE_SET_TEMPERATURE,
    ATTR_HUMIDITY: SERVICE_SET_HUMIDITY,
    ATTR_FAN_MODE: SERVICE_SET_FAN_MODE,
    ATTR_PRESET_MODE: SERVICE_SET_PRESET_MODE,
    ATTR_SWING_MODE: SERVICE_SET_SWING_MODE,
    ATTR_SWING_HORIZONTAL_MODE: SERVICE_SET_SWING_HORIZONTAL_MODE,
}

ATTR_MODES_MAPPING = {
    ATTR_FAN_MODE: ATTR_FAN_MODES,
    ATTR_HVAC_MODE: ATTR_HVAC_MODES,
    ATTR_PRESET_MODE: ATTR_PRESET_MODES,
    ATTR_SWING_MODE: ATTR_SWING_MODES,
    ATTR_SWING_HORIZONTAL_MODE: ATTR_SWING_HORIZONTAL_MODES,
}

# Controllable sync attributes
CONTROLLABLE_ATTRIBUTES = list(ATTR_SERVICE_MAPPING.keys())

# Float comparison tolerance for temperature and humidity
FLOAT_TOLERANCE = 0.1

# Home Assistant recycles Context-IDs for approximately 5 seconds.
# This value reflects HA internals and should NOT be made configurable.
SYNC_BLOCK_WINDOW: float = 5.0
