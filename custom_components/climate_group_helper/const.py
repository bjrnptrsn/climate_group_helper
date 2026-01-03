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
ATTR_TARGET_HVAC_MODE = "target_hvac_mode"
ATTR_EXTERNAL_CONTROLLED = "external_controlled"

# Sync Mode
SYNCABLE_ATTRIBUTES = [
    "hvac_mode",
    "temperature",
    "humidity",
    "fan_mode",
    "preset_mode",
    "swing_mode",
    "swing_horizontal_mode",
]
