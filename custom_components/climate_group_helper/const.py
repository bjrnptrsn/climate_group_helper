"""Constants for the Climate Group helper integration."""

from enum import StrEnum

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_PRESET_MODE,
    ATTR_PRESET_MODES,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_HORIZONTAL_MODES,
    ATTR_SWING_MODE,
    ATTR_SWING_MODES,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
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

# Member options
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"
HVAC_MODE_STRATEGY_AUTO = "auto"
HVAC_MODE_STRATEGY_NORMAL = "normal"
HVAC_MODE_STRATEGY_OFF_PRIORITY = "off_priority"
CONF_FEATURE_STRATEGY = "feature_strategy"
FEATURE_STRATEGY_INTERSECTION = "intersection"
FEATURE_STRATEGY_UNION = "union"

# Temperature options
CONF_TEMP_TARGET_AVG = "temp_target_avg"
CONF_TEMP_TARGET_ROUND = "temp_target_round"
CONF_TEMP_CURRENT_AVG = "temp_current_avg"
CONF_TEMP_SENSORS = "temp_sensors"
CONF_TEMP_UPDATE_TARGETS = "temp_update_targets"

# Humidity options
CONF_HUMIDITY_TARGET_AVG = "humidity_target_avg"
CONF_HUMIDITY_TARGET_ROUND = "humidity_target_round"
CONF_HUMIDITY_CURRENT_AVG = "humidity_current_avg"
CONF_HUMIDITY_SENSORS = "humidity_sensors"
CONF_HUMIDITY_UPDATE_TARGETS = "humidity_update_targets"

# Timings options
CONF_DEBOUNCE_DELAY = "debounce_delay"
CONF_RETRY_ATTEMPTS = "retry_attempts"
CONF_RETRY_DELAY = "retry_delay"

# Sync options
CONF_SYNC_MODE = "sync_mode"
CONF_SYNC_ATTRS = "sync_attributes"

# Window options
CONF_WINDOW_MODE = "window_mode"
CONF_ROOM_SENSOR = "room_sensor"
CONF_ZONE_SENSOR = "zone_sensor"
CONF_ROOM_OPEN_DELAY = "room_open_delay"
CONF_ZONE_OPEN_DELAY = "zone_open_delay"
CONF_CLOSE_DELAY = "close_delay"
DEFAULT_ROOM_OPEN_DELAY = 15
DEFAULT_ZONE_OPEN_DELAY = 300
DEFAULT_CLOSE_DELAY = 30

# Schedule options
CONF_SCHEDULE_ENTITY = "schedule_entity"

# Other options
CONF_EXPOSE_SMART_SENSORS = "expose_smart_sensors"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"


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


class WindowControlMode(StrEnum):
    """Window control modes."""

    OFF = "off"
    ON = "on"


# Extra attribute keys
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_CURRENT_HVAC_MODES = "current_hvac_modes"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"

# Attribute to service call mapping
ATTR_SERVICE_MAP = {
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

# Attribute mode to modes mapping
MODE_MODES_MAP = {
    ATTR_FAN_MODE: ATTR_FAN_MODES,
    ATTR_HVAC_MODE: ATTR_HVAC_MODES,
    ATTR_PRESET_MODE: ATTR_PRESET_MODES,
    ATTR_SWING_MODE: ATTR_SWING_MODES,
    ATTR_SWING_HORIZONTAL_MODE: ATTR_SWING_HORIZONTAL_MODES,
}

# Controllable sync attributes
SYNC_TARGET_ATTRS = list(ATTR_SERVICE_MAP.keys())

# Float comparison tolerance for temperature and humidity
FLOAT_TOLERANCE = 0.1

STARTUP_BLOCK_DELAY = 5.0