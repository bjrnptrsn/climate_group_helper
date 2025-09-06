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
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_HVAC_MODE_OFF_PRIORITY = "hvac_mode_off_priority"

# Attribute keys
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"