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

# Member & Modes
CONF_MASTER_ENTITY = "master_entity"
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"
CONF_FEATURE_STRATEGY = "feature_strategy"
CONF_UNION_OUT_OF_BOUNDS_ACTION = "union_out_of_bounds_action"

# Temperature Settings
CONF_TEMP_TARGET_AVG = "temp_target_avg"
CONF_TEMP_TARGET_ROUND = "temp_target_round"
CONF_TEMP_CURRENT_AVG = "temp_current_avg"
CONF_TEMP_USE_MASTER = "temp_use_master"
CONF_TEMP_SENSORS = "temp_sensors"
CONF_TEMP_UPDATE_TARGETS = "temp_update_targets"
CONF_TEMP_CALIBRATION_MODE = "temp_calibration_mode"
CONF_CALIBRATION_HEARTBEAT = "calibration_heartbeat"
CONF_CALIBRATION_IGNORE_OFF = "calibration_ignore_off"
CALIBRATION_DEBOUNCE_DELAY = 3.0   # seconds — collapses rapid sensor ticks into one write
CALIBRATION_WRITE_DELAY    = 0.5  # seconds — gap between sequential Z2M writes

# Humidity Settings
CONF_HUMIDITY_TARGET_AVG = "humidity_target_avg"
CONF_HUMIDITY_TARGET_ROUND = "humidity_target_round"
CONF_HUMIDITY_CURRENT_AVG = "humidity_current_avg"
CONF_HUMIDITY_USE_MASTER = "humidity_use_master"
CONF_HUMIDITY_SENSORS = "humidity_sensors"
CONF_HUMIDITY_UPDATE_TARGETS = "humidity_update_targets"

# Sync Mode
CONF_SYNC_MODE = "sync_mode"
CONF_SYNC_ATTRS = "sync_attributes"
CONF_IGNORE_OFF_MEMBERS_SYNC = "ignore_off_members_sync"

# Window Control
CONF_WINDOW_MODE = "window_mode"
CONF_WINDOW_ADOPT_MANUAL_CHANGES = "window_adopt_manual_changes"
CONF_WINDOW_ACTION = "window_action"
CONF_WINDOW_TEMPERATURE = "window_temperature"
CONF_ROOM_SENSOR = "room_sensor"
CONF_ZONE_SENSOR = "zone_sensor"
CONF_ROOM_OPEN_DELAY = "room_open_delay"
CONF_ZONE_OPEN_DELAY = "zone_open_delay"
CONF_CLOSE_DELAY = "close_delay"
DEFAULT_ROOM_OPEN_DELAY = 15
DEFAULT_ZONE_OPEN_DELAY = 300
DEFAULT_CLOSE_DELAY = 30

# Presence Control
CONF_PRESENCE_MODE = "presence_mode"
CONF_PRESENCE_SENSOR = "presence_sensor"
CONF_PRESENCE_ACTION = "presence_action"
CONF_PRESENCE_AWAY_OFFSET = "presence_away_offset"
CONF_PRESENCE_AWAY_TEMPERATURE = "presence_away_temperature"
CONF_PRESENCE_AWAY_PRESET = "presence_away_preset"
CONF_PRESENCE_AWAY_DELAY = "presence_away_delay"
CONF_PRESENCE_RETURN_DELAY = "presence_return_delay"
DEFAULT_PRESENCE_AWAY_DELAY = 0
DEFAULT_PRESENCE_RETURN_DELAY = 0

# Member Offsets
CONF_MEMBER_TEMP_OFFSETS = "member_temp_offsets"

# Member Isolation
CONF_ISOLATION_SENSOR = "isolation_sensor"
CONF_ISOLATION_ENTITIES = "isolation_entities"
CONF_ISOLATION_ACTIVATE_DELAY = "isolation_activate_delay"
CONF_ISOLATION_RESTORE_DELAY = "isolation_restore_delay"
CONF_ISOLATION_TRIGGER = "isolation_trigger"
CONF_ISOLATION_TRIGGER_HVAC_MODES = "isolation_trigger_hvac_modes"

# Schedule Automation
CONF_SCHEDULE_ENTITY = "schedule_entity"
CONF_RESYNC_INTERVAL = "resync_interval"
CONF_OVERRIDE_DURATION = "override_duration"
CONF_PERSIST_CHANGES = "persist_changes"
CONF_PERSIST_ACTIVE_SCHEDULE = "persist_active_schedule"
CONF_IGNORE_OFF_MEMBERS_SCHEDULE = "ignore_off_members_schedule"

# Advanced options
CONF_DEBOUNCE_DELAY = "debounce_delay"
CONF_RETRY_ATTEMPTS = "retry_attempts"
CONF_RETRY_DELAY = "retry_delay"
CONF_MIN_TEMP_OFF = "min_temp_off"
CONF_EXPOSE_SMART_SENSORS = "expose_smart_sensors"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_EXPOSE_CONFIG = "expose_config"

# UI options
CONF_EXPAND_SECTIONS = "expand_sections"


class HvacModeStrategy(StrEnum):
    """HVAC mode aggregation strategy."""

    AUTO = "auto"
    NORMAL = "normal"
    OFF_PRIORITY = "off_priority"


class FeatureStrategy(StrEnum):
    """Feature (temp range, modes) aggregation strategy."""

    INTERSECTION = "intersection"
    UNION = "union"


class UnionOutOfBoundsAction(StrEnum):
    """Out-of-bounds action when union strategy is active."""

    OFF = "off"
    CLAMP = "clamp"


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


class CalibrationMode(StrEnum):
    """Calibration modes for external sensors."""

    ABSOLUTE = "absolute"
    OFFSET = "offset"
    SCALED = "scaled"


class SyncMode(StrEnum):
    """Enum for sync modes."""

    DISABLED = "disabled"
    LOCK = "lock"
    MIRROR = "mirror"
    MASTER_LOCK = "master_lock"


class WindowControlMode(StrEnum):
    """Window control modes."""

    DISABLED = "disabled"
    ENABLED = "enabled"


class AdoptManualChanges(StrEnum):
    """Adopt manual changes options for window control."""

    OFF = "off"
    ALL = "all"
    MASTER_ONLY = "master_only"


class WindowControlAction(StrEnum):
    """Window control actions."""

    OFF = "off"
    TEMPERATURE = "temperature"


class PresenceMode(StrEnum):
    """Presence control modes."""

    DISABLED = "disabled"
    ENABLED = "enabled"


class PresenceAction(StrEnum):
    """Presence control actions."""

    OFF = "off"
    AWAY_OFFSET = "away_offset"
    AWAY_TEMPERATURE = "away_temperature"
    AWAY_PRESET = "away_preset"


class IsolationTrigger(StrEnum):
    """Isolation trigger modes."""

    DISABLED = "disabled"
    SENSOR = "sensor"
    HVAC_MODE = "hvac_mode"
    MEMBER_OFF = "member_off"


# Service Constants
SERVICE_SET_SCHEDULE_ENTITY = "set_schedule_entity"
SERVICE_BOOST = "boost"
ATTR_SCHEDULE_ENTITY = "schedule_entity"

# Extra attribute keys
ATTR_ACTIVE_SCHEDULE_ENTITY = "active_schedule_entity"
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_BLOCKING_SOURCES = "blocking_sources"
ATTR_CURRENT_HVAC_MODES = "current_hvac_modes"
ATTR_ISOLATED_MEMBERS = "isolated_members"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"
ATTR_OOB_MEMBERS = "oob_members"
ATTR_ACTIVE_OVERRIDE = "active_override"
ATTR_MASTER_FALLBACK_ACTIVE = "master_fallback_active"
ATTR_ACTIVE_OVERRIDE_END = "active_override_end"

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
FLOAT_TOLERANCE = 0.05

# Startup phase protection: Delay (s) to prevent initial state flood from overwriting target.
STARTUP_BLOCK_DELAY = 5.0