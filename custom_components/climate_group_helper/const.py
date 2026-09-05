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
    ClimateEntityFeature,
)
from homeassistant.const import (
    ATTR_TEMPERATURE,
    CONF_ENTITIES,
    CONF_NAME,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)

DEFAULT_NAME = "Climate Group"
DOMAIN = "climate_group_helper"

# Member & Modes
CONF_ADVANCED_MODE = "advanced_mode"
CONF_FEATURE_STRATEGY = "feature_strategy"
CONF_HVAC_MODE_STRATEGY = "hvac_mode_strategy"
CONF_MASTER_ENTITY = "master_entity"
CONF_UNION_OUT_OF_BOUNDS_ACTION = "union_out_of_bounds_action"
CONF_UNION_UNSUPPORTED_HVAC_ACTION = "union_unsupported_hvac_action"

# Supported features for the climate group entity. Shared by the aggregation,
# restore and entity-setup paths — one source of truth so they cannot drift.
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

# Temperature Settings
CONF_CALIBRATION_HEARTBEAT = "calibration_heartbeat"
CONF_CALIBRATION_IGNORE_OFF = "calibration_ignore_off"
CONF_TEMP_CALIBRATION_MODE = "temp_calibration_mode"
CONF_TEMP_CURRENT_AVG = "temp_current_avg"
CONF_TEMP_SENSORS = "temp_sensors"
CONF_TEMP_TARGET_AVG = "temp_target_avg"
CONF_TEMP_TARGET_ROUND = "temp_target_round"
CONF_TEMP_UPDATE_TARGETS = "temp_update_targets"
CONF_TEMP_USE_MASTER = "temp_use_master"

# Humidity Settings
CONF_HUMIDITY_CURRENT_AVG = "humidity_current_avg"
CONF_HUMIDITY_SENSORS = "humidity_sensors"
CONF_HUMIDITY_TARGET_AVG = "humidity_target_avg"
CONF_HUMIDITY_TARGET_ROUND = "humidity_target_round"
CONF_HUMIDITY_UPDATE_TARGETS = "humidity_update_targets"
CONF_HUMIDITY_USE_MASTER = "humidity_use_master"

# Sync Mode
CONF_IGNORE_OFF_MEMBERS_SYNC = "ignore_off_members_sync"
CONF_SYNC_ATTRS = "sync_attributes"
CONF_SYNC_MODE = "sync_mode"

# Window Control
CONF_CLOSE_DELAY = "close_delay"
CONF_ROOM_OPEN_DELAY = "room_open_delay"
CONF_ROOM_SENSOR = "room_sensor"
CONF_WINDOW_ACTION = "window_action"
CONF_WINDOW_ADOPT_MANUAL_CHANGES = "window_adopt_manual_changes"
CONF_WINDOW_MODE = "window_mode"
CONF_WINDOW_TEMPERATURE = "window_temperature"
CONF_ZONE_OPEN_DELAY = "zone_open_delay"
CONF_ZONE_SENSOR = "zone_sensor"
DEFAULT_CLOSE_DELAY = 30
DEFAULT_ROOM_OPEN_DELAY = 15
DEFAULT_ZONE_OPEN_DELAY = 300

# Presence Control
CONF_PRESENCE_ACTION = "presence_action"
CONF_PRESENCE_AWAY_DELAY = "presence_away_delay"
CONF_PRESENCE_AWAY_OFFSET = "presence_away_offset"
CONF_PRESENCE_AWAY_PRESET = "presence_away_preset"
CONF_PRESENCE_AWAY_TEMPERATURE = "presence_away_temperature"
CONF_PRESENCE_MODE = "presence_mode"
CONF_PRESENCE_RETURN_DELAY = "presence_return_delay"
CONF_PRESENCE_SENSOR = "presence_sensor"
CONF_PRESENCE_ZONE = "presence_zone"
DEFAULT_PRESENCE_AWAY_DELAY = 0
DEFAULT_PRESENCE_RETURN_DELAY = 0

# Member Offsets
CONF_MEMBER_OFFSET_CORRECTION = "member_offset_correction"
CONF_MEMBER_TEMP_OFFSETS = "member_temp_offsets"

# Member Isolation
CONF_ISOLATION_ACTIVATE_DELAY = "isolation_activate_delay"
CONF_ISOLATION_ENTITIES = "isolation_entities"
CONF_ISOLATION_RESTORE_DELAY = "isolation_restore_delay"
CONF_ISOLATION_RULES = "isolation_rules"
CONF_ISOLATION_RULES_COUNT = "isolation_rule_count"
# UI slot a rule belongs to (1-4). The sole link between a rule and its form
# position: the list index cannot serve, because a deleted rule shifts every
# rule behind it into a different slot.
CONF_ISOLATION_SLOT = "isolation_slot"
CONF_ISOLATION_SENSOR = "isolation_sensor"
CONF_ISOLATION_TRIGGER = "isolation_trigger"
CONF_ISOLATION_TRIGGER_HVAC_MODES = "isolation_trigger_hvac_modes"
CONF_ISOLATION_ACTION_TYPE = "isolation_action_type"
CONF_ISOLATION_ACTION_HVAC_MODE = "isolation_action_hvac_mode"
CONF_ISOLATION_ACTION_PRESET_MODE = "isolation_action_preset_mode"

# Schedule Automation
CONF_IGNORE_OFF_MEMBERS_SCHEDULE = "ignore_off_members_schedule"
CONF_IGNORE_OFF_MEMBERS_TEMPERATURE = "ignore_off_members_temperature"
CONF_RETAIN_SERVICE_CHANGES_SCHEDULE = "retain_service_changes_schedule"
CONF_SCHEDULE_BYPASS_ENTITY = "schedule_bypass_entity"
CONF_SCHEDULE_FALLBACK_PAYLOAD = "schedule_fallback_payload"
CONF_SCHEDULE_ENTITY = "schedule_entity"

# Presets
CONF_GROUP_PRESETS = "group_presets"
CONF_RETAIN_SERVICE_CHANGES_PRESETS = "retain_service_changes_presets"

# Advanced options
CONF_DEBOUNCE_DELAY = "debounce_delay"
CONF_EXPOSE_CONFIG = "expose_config"
CONF_EXPOSE_MEMBER_ENTITIES = "expose_member_entities"
CONF_EXPOSE_SMART_SENSORS = "expose_smart_sensors"
CONF_FORCE_RETRY = "force_retry"
CONF_GRACE_PERIOD = "grace_period"
CONF_MIN_TEMP_OFF = "min_temp_off"
CONF_RANGE_TEMPLATE_COOL_ENTITIES = "range_template_cool_entities"
CONF_RANGE_TEMPLATE_DEADBAND_ACTION = "range_template_deadband_action"
CONF_RANGE_TEMPLATE_ENABLED = "range_template_enabled"
CONF_RANGE_TEMPLATE_HEAT_ENTITIES = "range_template_heat_entities"
CONF_RANGE_TEMPLATE_HUMIDITY_ACTION = "range_template_humidity_action"
CONF_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY = "range_template_humidity_deactivation_delay"
CONF_RANGE_TEMPLATE_HUMIDITY_ENABLED = "range_template_humidity_enabled"
CONF_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS = "range_template_humidity_hysteresis"
CONF_RETRY_ATTEMPTS = "retry_attempts"
CONF_RETRY_DELAY = "retry_delay"
DEFAULT_RANGE_TEMPLATE_HUMIDITY_ACTION = "dry"
DEFAULT_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS = 3.0
DEFAULT_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY = 0.0
# Small window so triggers arriving a few ms apart (startup resync next to a
# schedule slot, a slider sending several values) collapse into one run
# instead of each sending its own command batch to the devices.
DEFAULT_DEBOUNCE_DELAY = 0.3
DEFAULT_GRACE_PERIOD = 3.0

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


class UnsupportedHvacAction(StrEnum):
    """How to handle members that don't support the active HVAC mode."""

    IGNORE = "ignore"
    OFF = "off"


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
    FOLLOW_ONLY = "follow_only"
    LOCK = "lock"
    MIRROR = "mirror"
    MASTER_LOCK = "master_lock"
    MIRROR_LOCK = "mirror_lock"


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


class RangeTemplateDeadbandAction(StrEnum):
    """Physical action when a range-template member is inside the deadband."""

    NONE = "none"
    OFF = "off"
    FAN_ONLY = "fan_only"


class RangeTemplateHumidityAction(StrEnum):
    """Physical action when humidity condition is active in deadband."""

    FAN_ONLY = "fan_only"
    DRY = "dry"


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


class IsolationActionType(StrEnum):
    """Isolation action types."""

    HVAC_MODE = "hvac_mode"
    PRESET_MODE = "preset_mode"


# Service Constants
SERVICE_SET_SCHEDULE_ENTITY = "set_schedule_entity"
SERVICE_SET_SCHEDULE_BYPASS_ENTITY = "set_schedule_bypass_entity"
SERVICE_SET_SCHEDULE_FALLBACK_PAYLOAD = "set_schedule_fallback_payload"
SERVICE_SET_GROUP_PRESET = "set_group_preset"
SERVICE_BOOST = "boost"
SERVICE_RESET = "reset"
SERVICE_APPLY_CONFIG = "apply_config"

ATTR_SCHEDULE_ENTITY = "schedule_entity"
ATTR_SCHEDULE_BYPASS_ENTITY = "schedule_bypass_entity"
ATTR_FALLBACK_PAYLOAD = "fallback_payload"
ATTR_PAYLOAD = "payload"
ATTR_SETTINGS = "settings"
ATTR_INCLUDE_MEMBER_LIST = "include_member_list"
ATTR_INCLUDE_ENTITY_SELECTORS = "include_entity_selectors"
ATTR_RESET_ALL = "everything"
ATTR_RESET_BOOST = "boost"
ATTR_RESET_OFFSET = "offset"
ATTR_RESET_SCHEDULE = "schedule"
ATTR_RESET_BYPASS = "bypass"
ATTR_RESET_FALLBACK = "fallback"
ATTR_RESET_PRESETS = "presets"

# Extra attribute keys
ATTR_ACTIVE_VIRTUAL_PRESET = "active_virtual_preset"
ATTR_RUNTIME_GROUP_PRESETS = "runtime_group_presets"
ATTR_BOOST_TEMPERATURE = "boost_temperature"
ATTR_BOOST_UNTIL = "boost_until"
ATTR_ACTIVE_SCHEDULE_BYPASS_ENTITY = "active_schedule_bypass_entity"
ATTR_ACTIVE_SCHEDULE_ENTITY = "active_schedule_entity"
ATTR_ACTIVE_SCHEDULE_SLOT_TITLE = "active_schedule_slot_title"
ATTR_SCHEDULE_FALLBACK_PAYLOAD = "schedule_fallback_payload"
ATTR_SCHEDULE_FALLBACK_PAYLOAD_ACTIVE = "schedule_fallback_payload_active"
ATTR_ASSUMED_STATE = "assumed_state"
ATTR_BLOCKING_SOURCES = "blocking_sources"
ATTR_BYPASS_DELTA = "bypass_delta"
ATTR_CONFIG_OVERRIDES = "config_overrides"
ATTR_CURRENT_HVAC_MODES = "current_hvac_modes"
ATTR_GROUP_OFFSET = "group_offset"
ATTR_OFFSET_ENTITY_ID = "offset_entity_id"
ATTR_ISOLATED_MEMBERS = "isolated_members"
ATTR_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"
ATTR_MASTER_FALLBACK_ACTIVE = "master_fallback_active"
ATTR_MEMBER_ENTITIES = "member_entities"
ATTR_MEMBER_DIVERGENCE = "member_divergence"
ATTR_OOB_MEMBERS = "oob_members"
ATTR_SETTINGS_JSON = "settings_json"
ATTR_TARGET_STATE = "target_state"
# Configured features (for UI — which icons to show at all)
ATTR_ENABLED_FEATURES = "enabled_features"
# Source information
ATTR_LAST_SOURCE = "last_source"
ATTR_LAST_CHANGED = "last_changed"
ATTR_LAST_ENTITY = "last_entity"
# Analytics
ATTR_ACTIVE_MEMBER_COUNT = "active_member_count"
ATTR_TOTAL_MEMBER_COUNT = "total_member_count"
# Fallback flags
ATTR_PRESENCE_FALLBACK = "presence_fallback"
# Effective config
ATTR_EFFECTIVE_SYNC_MODE = "effective_sync_mode"
ATTR_EFFECTIVE_SYNC_ATTRIBUTES = "effective_sync_attributes"

# Configuration Management Key Groups
IDENTITY_KEYS: frozenset[str] = frozenset({CONF_NAME})

MEMBER_LIST_KEYS: frozenset[str] = frozenset({
    CONF_ENTITIES,
    CONF_MASTER_ENTITY,
    CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
    CONF_RANGE_TEMPLATE_COOL_ENTITIES,
})

ENTITY_SELECTOR_KEYS: frozenset[str] = frozenset({
    CONF_TEMP_SENSORS,
    CONF_HUMIDITY_SENSORS,
    CONF_ROOM_SENSOR,
    CONF_ZONE_SENSOR,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_SCHEDULE_ENTITY,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_MEMBER_TEMP_OFFSETS,
})

# Schedule Meta-Keys (v1 — State-Keys only)
META_KEY_TURN_OFF = "turn_off"  # no CONF_ mapping
META_KEY_SYNC_MODE = CONF_SYNC_MODE  # == "sync_mode"
META_KEY_GROUP_OFFSET = ATTR_GROUP_OFFSET  # RunState field, no CONF_ mapping
META_KEY_SYNC_ATTRS = CONF_SYNC_ATTRS  # == "sync_attributes"
META_KEY_PRESENCE = "presence"  # superseded by META_KEY_PRESENCE_MODE, still tolerated

# Feature bypasses: pause a feature for the duration of the slot.
# window_mode/presence_mode carry the same string as their config key, so a slot
# reads like the option it shadows. calibration_mode does NOT map to
# CONF_TEMP_CALIBRATION_MODE — that key selects the arithmetic
# (absolute/offset/scaled), while this one only suspends the writes.
META_KEY_WINDOW_MODE = CONF_WINDOW_MODE  # == "window_mode"
META_KEY_PRESENCE_MODE = CONF_PRESENCE_MODE  # == "presence_mode"
META_KEY_CALIBRATION_MODE = "calibration_mode"  # no CONF_ mapping
META_KEY_ISOLATION_BYPASS = "isolation_bypass"  # no CONF_ mapping

# Only value a pure suspend-key accepts. "enabled" is deliberately absent: a
# meta-key can silence a running evaluation, never create one — with the feature
# disabled in the config there is no subscription to drive it, so the value would
# be a marker without effect.
META_VALUE_DISABLED = "disabled"
# presence_mode's third state: force the away block regardless of the sensors.
META_VALUE_AWAY = "away"
# isolation_bypass sentinel: suspend every rule instead of a slot list.
META_VALUE_ALL = "all"

META_STATE_KEYS: frozenset[str] = frozenset({
    META_KEY_TURN_OFF,
    META_KEY_SYNC_MODE,
    META_KEY_GROUP_OFFSET,
    META_KEY_SYNC_ATTRS,
    META_KEY_PRESENCE,
    META_KEY_WINDOW_MODE,
    META_KEY_PRESENCE_MODE,
    META_KEY_CALIBRATION_MODE,
    META_KEY_ISOLATION_BYPASS,
})

# Meta-keys a group preset may carry, so a manually chosen "party" or "holiday"
# brings its own suspensions along. Two are deliberately absent:
#   turn_off — presets set climate targets; the master switch stays out of reach.
#              It is also a one-shot trigger with no attribute to exit on.
#   presence — superseded by presence_mode; a new definition should not adopt it.
PRESET_META_KEYS: frozenset[str] = frozenset({
    META_KEY_SYNC_MODE,
    META_KEY_SYNC_ATTRS,
    META_KEY_GROUP_OFFSET,
    META_KEY_WINDOW_MODE,
    META_KEY_PRESENCE_MODE,
    META_KEY_CALIBRATION_MODE,
    META_KEY_ISOLATION_BYPASS,
})

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

# The attributes carrying a target temperature — everything the offsets shift,
# the OOB guard bounds-checks and the divergence report compares numerically.
# ATTR_HUMIDITY is deliberately absent: it is a float attribute too, but no
# offset or temperature limit applies to it.
TEMP_TARGET_ATTRS: frozenset[str] = frozenset({
    ATTR_TEMPERATURE,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TARGET_TEMP_HIGH,
})

# Float comparison tolerance for temperature and humidity
FLOAT_TOLERANCE = 0.05

# Startup phase protection: Delay (s) to prevent initial state flood from overwriting target.
STARTUP_BLOCK_DELAY = 5.0

# The two states that carry no usable value. "unknown" belongs with
# "unavailable" everywhere in this integration: an entity that exists but has
# not reported yet is as unusable as one that is gone, and treating them
# differently would only move the missing-value handling one line further down.
# The predicates reading this live in state.py.
TRANSIENT_STATES: frozenset[str] = frozenset({STATE_UNAVAILABLE, STATE_UNKNOWN})
