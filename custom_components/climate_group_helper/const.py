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


# Configuration keys
CONF_CURRENT_AVG_OPTION = "current_avg_option"
CONF_TARGET_AVG_OPTION = "target_avg_option"
CONF_ROUND_OPTION = "round_option"
CONF_USE_TEMP_SENSOR = "use_temp_sensor"
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"
CONF_FEATURE_STRATEGY = "feature_strategy"
CONF_TEMP_SENSOR = "temp_sensor"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_EXPOSE_ATTRIBUTE_SENSORS = "expose_attribute_sensors"

# HVAC mode strategies
HVAC_MODE_STRATEGY_NORMAL = "normal"
HVAC_MODE_STRATEGY_OFF_PRIORITY = "off_priority"
HVAC_MODE_STRATEGY_AUTO = "auto"

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