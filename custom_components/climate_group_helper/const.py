"""Constants for the Climate Group helper integration."""

DOMAIN = "climate_group_helper"
DEFAULT_NAME = "Climate Group"

class AverageOption:
    """Averaging options for temperature."""

    MEAN = "mean"
    MEDIAN = "median"
    MIN = "min"
    MAX = "max"

class RoundOption:
    """Rounding options for temperature."""

    NONE = "none"
    HALF = "half"
    INTEGER = "integer"


# Configuration keys
CONF_AVERAGE_OPTION = "average_option"
CONF_ROUND_OPTION = "round_option"
CONF_USE_TEMP_SENSOR = "use_temp_sensor"
CONF_TEMP_SENSOR = "temp_sensor"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"

# HVAC mode strategies
HVAC_MODE_STRATEGY_NORMAL = "normal"
HVAC_MODE_STRATEGY_OFF_PRIORITY = "off_priority"
HVAC_MODE_STRATEGY_AUTO = "auto"

# Attribute keys
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_CURRENT_HVAC_MODES = "current_hvac_modes"
ATTR_GROUP_IN_SYNC = "group_in_sync"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"
ATTR_TARGET_HVAC_MODE = "target_hvac_mode"
