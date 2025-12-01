"""Constants for the Climate Group helper integration."""

from enum import StrEnum

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
CONF_CURRENT_AVG_OPTION = "current_avg_option"
CONF_DEBOUNCE_DELAY = "debounce_delay"
CONF_EXPOSE_ATTRIBUTE_SENSORS = "expose_attribute_sensors"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_FEATURE_STRATEGY = "feature_strategy"
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"
CONF_RETRY_ATTEMPTS = "retry_attempts"
CONF_RETRY_DELAY = "retry_delay"
CONF_ROUND_OPTION = "round_option"
CONF_SYNC_MODE = "sync_mode"
CONF_SYNC_RETRY = "sync_retry"
CONF_SYNC_DELAY = "sync_delay"
CONF_TARGET_AVG_OPTION = "target_avg_option"
CONF_TEMP_SENSOR = "temp_sensor"
CONF_USE_TEMP_SENSOR = "use_temp_sensor"

# HVAC mode strategies
HVAC_MODE_STRATEGY_AUTO = "auto"
HVAC_MODE_STRATEGY_NORMAL = "normal"
HVAC_MODE_STRATEGY_OFF_PRIORITY = "off_priority"

# Feature strategies
FEATURE_STRATEGY_INTERSECTION = "intersection"
FEATURE_STRATEGY_UNION = "union"

# Attribute keys
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_AVERAGED_CURRENT_TEMPERATURE = "averaged_current_temperature"
ATTR_CURRENT_HVAC_MODES = "current_hvac_modes"
ATTR_GROUP_IN_SYNC = "group_in_sync"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"
ATTR_TARGET_HVAC_MODE = "target_hvac_mode"

# Sync Mode
SYNC_MODE_WATCHED_ATTRIBUTES = {
    "hvac_mode": None,
    "temperature": "temperature",
    "fan_mode": "fan_mode",
    "preset_mode": "preset_mode",
    "swing_mode": "swing_mode",
}
