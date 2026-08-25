"""Setup, restoration, and entity filtering helpers for ClimateGroupHelper."""

from __future__ import annotations

from dataclasses import fields, replace
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import (
    ATTR_CURRENT_HUMIDITY,
    ATTR_CURRENT_TEMPERATURE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_ACTION,
    ATTR_HVAC_MODES,
    ATTR_MAX_HUMIDITY,
    ATTR_MAX_TEMP,
    ATTR_MIN_HUMIDITY,
    ATTR_MIN_TEMP,
    ATTR_PRESET_MODES,
    ATTR_SWING_HORIZONTAL_MODES,
    ATTR_SWING_MODES,
    ATTR_TARGET_HUMIDITY_STEP,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TARGET_TEMP_STEP,
    ATTR_TEMPERATURE,
    DEFAULT_MAX_HUMIDITY,
    DEFAULT_MAX_TEMP,
    DEFAULT_MIN_HUMIDITY,
    DEFAULT_MIN_TEMP,
    HVACMode,
)
from homeassistant.const import ATTR_SUPPORTED_FEATURES
from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import entity_registry as er

from .const import (
    ATTR_ACTIVE_SCHEDULE_BYPASS_ENTITY,
    ATTR_ACTIVE_SCHEDULE_ENTITY,
    ATTR_ACTIVE_VIRTUAL_PRESET,
    ATTR_BYPASS_DELTA,
    ATTR_GROUP_OFFSET,
    ATTR_ISOLATED_MEMBERS,
    ATTR_LAST_ACTIVE_HVAC_MODE,
    ATTR_RUNTIME_GROUP_PRESETS,
    ATTR_SCHEDULE_FALLBACK_PAYLOAD,
    ATTR_TARGET_STATE,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RULES,
    CONF_ISOLATION_SENSOR,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_RETAIN_SERVICE_CHANGES_PRESETS,
    CONF_RETAIN_SERVICE_CHANGES_SCHEDULE,
    CONF_ROOM_SENSOR,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_SCHEDULE_ENTITY,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_ZONE_SENSOR,
    DOMAIN,
    SUPPORTED_FEATURES,
)
from .number import clean_offset
from .payload import normalize_yaml_bool_modes
from .state import ClimateState

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


def strip_self_reference(group: ClimateGroupHelper) -> None:
    """Remove the group itself from climate_entity_ids (loop protection).

    The config flow only filters by domain, and a group is a climate entity like
    any other — so it can be selected as its own member. Self-reference makes the
    group aggregate its own output and command itself. Other CGH groups stay
    allowed: nesting a floor group out of room groups is a legitimate setup
    ("Climate Wars" is a separate, documented concern about two groups fighting
    over one device).

    Must run before `restore_state()` — see the call site in `climate.py`.
    """
    if group.entity_id in group.climate_entity_ids:
        _LOGGER.warning(
            "[%s] Loop protection: the group is listed as its own member — ignoring. "
            "Remove it from the member list in the integration options.",
            group.entity_id,
        )
        group.climate_entity_ids = [
            eid for eid in group.climate_entity_ids if eid != group.entity_id
        ]


def filter_cgh_entities(
    hass: HomeAssistant,
    entity_ids: list[str],
    label: str,
    group_entity_id: str = "",
) -> list[str]:
    """Remove own CGH entities from a list and log a warning for each one found."""
    registry = er.async_get(hass)
    valid_entities: list[str] = []
    for eid in entity_ids:
        entry = registry.async_get(eid)
        if entry and entry.platform == DOMAIN:
            _LOGGER.warning(
                "[%s] Loop protection: '%s' is a CGH entity and cannot be used as "
                "external %s input — ignoring. Remove it in the integration options.",
                group_entity_id,
                eid,
                label,
            )
        else:
            valid_entities.append(eid)
    return valid_entities


def filter_sensor_entities(group: ClimateGroupHelper) -> None:
    """Drop own CGH entities from sensor/calibration lists, rebuild _entity_ids.

    Guards against feedback loops from misconfigured CGH sensors: `_entity_ids`
    drives the state listener, so a group's own sensor left in these lists would
    make it react to itself.
    """
    group.temp_sensor_entity_ids = filter_cgh_entities(
        group.hass, group.temp_sensor_entity_ids, "temperature sensor", group.entity_id
    )
    group.humidity_sensor_entity_ids = filter_cgh_entities(
        group.hass, group.humidity_sensor_entity_ids, "humidity sensor", group.entity_id
    )
    group.temp_update_target_entity_ids = filter_cgh_entities(
        group.hass,
        group.temp_update_target_entity_ids,
        "temperature calibration target",
        group.entity_id,
    )
    group.humidity_update_target_entity_ids = filter_cgh_entities(
        group.hass,
        group.humidity_update_target_entity_ids,
        "humidity calibration target",
        group.entity_id,
    )
    group._entity_ids = (
        group.climate_entity_ids
        + group.temp_sensor_entity_ids
        + group.humidity_sensor_entity_ids
    )


def warn_missing_entities(
    hass: HomeAssistant, config: dict[str, Any], group_entity_id: str
) -> None:
    """Log a warning for each configured entity that no longer exists in the state machine."""
    registry = er.async_get(hass)
    checks: list[tuple[str, str]] = []
    for key in (
        CONF_ROOM_SENSOR,
        CONF_ZONE_SENSOR,
        CONF_SCHEDULE_ENTITY,
        CONF_SCHEDULE_BYPASS_ENTITY,
    ):
        if val := config.get(key):
            checks.append((key, val))
    for key in (
        CONF_PRESENCE_SENSOR,
        CONF_PRESENCE_ZONE,
        CONF_TEMP_UPDATE_TARGETS,
        CONF_HUMIDITY_UPDATE_TARGETS,
    ):
        for eid in config.get(key, []):
            checks.append((key, eid))
    # Isolation entities and sensors are nested inside CONF_ISOLATION_RULES
    for rule in config.get(CONF_ISOLATION_RULES, []):
        if sensor := rule.get(CONF_ISOLATION_SENSOR):
            checks.append((CONF_ISOLATION_SENSOR, sensor))
        for eid in rule.get(CONF_ISOLATION_ENTITIES, []):
            checks.append((CONF_ISOLATION_ENTITIES, eid))
    for key, eid in checks:
        if hass.states.get(eid) is None and registry.async_get(eid) is None:
            _LOGGER.warning(
                "[%s] Configured entity '%s' (option '%s') does not exist — "
                "it may have been deleted. Update the integration options.",
                group_entity_id,
                eid,
                key,
            )


def restore_state(group: ClimateGroupHelper, last_state: State) -> None:
    """Restore state from last known state."""
    last_attrs = last_state.attributes
    valid_hvac_modes = {m.value for m in HVACMode}

    # Restore group offset first to ensure it's available for TargetState restoration.
    # Clamped like every other write (see `clean_offset`): this path decides the
    # offset only when no number entity exists — the number platform sets up after
    # climate and its own restore overwrites this one — so the single case where
    # this value survives is the one where nothing else would bound it.
    if (last_offset := last_attrs.get(ATTR_GROUP_OFFSET)) is not None:
        if (restored_offset := clean_offset(last_offset, group.entity_id)) is not None:
            group.run_state = replace(group.run_state, group_offset=restored_offset)

    # Restore Persistent Target State (prefer ATTR_TARGET_STATE dictionary over flat state/attributes)
    if (saved := last_attrs.get(ATTR_TARGET_STATE)) and isinstance(saved, dict):
        group.shared_target_state = group.shared_target_state.update(**saved)
        _LOGGER.debug(
            "[%s] Restored Persistent Target State from attribute: %s",
            group.entity_id,
            group.shared_target_state,
        )
    else:
        # We filter for ClimateState fields to ensure we only store relevant climate attributes
        restored_data: dict[str, Any] = {}
        for field in fields(ClimateState):
            key = field.name
            if key == "hvac_mode":
                if last_state.state in valid_hvac_modes:
                    restored_data[key] = last_state.state
            elif (value := last_attrs.get(key)) is not None:
                restored_data[key] = value

        if restored_data:
            group.shared_target_state = group.shared_target_state.update(**restored_data)
            _LOGGER.debug(
                "[%s] Restored Persistent Target State (fallback): %s",
                group.entity_id,
                group.shared_target_state,
            )

    # Restore modes and features
    if last_state.state in valid_hvac_modes:
        group._attr_hvac_mode = HVACMode(last_state.state)
        group._attr_available = True
        group._attr_assumed_state = True
    if ATTR_HVAC_ACTION in last_attrs:
        group._attr_hvac_action = last_attrs[ATTR_HVAC_ACTION]
    if modes := last_attrs.get(ATTR_HVAC_MODES):
        group._attr_hvac_modes = group.aggregator._sort_hvac_modes(modes)
    if ATTR_FAN_MODES in last_attrs:
        group._attr_fan_modes = last_attrs[ATTR_FAN_MODES]
    if ATTR_PRESET_MODES in last_attrs:
        group._attr_preset_modes = last_attrs[ATTR_PRESET_MODES]
    if ATTR_SWING_MODES in last_attrs:
        group._attr_swing_modes = last_attrs[ATTR_SWING_MODES]
    if ATTR_SWING_HORIZONTAL_MODES in last_attrs:
        group._attr_swing_horizontal_modes = last_attrs[ATTR_SWING_HORIZONTAL_MODES]
    if ATTR_SUPPORTED_FEATURES in last_attrs:
        group._attr_supported_features = (
            last_attrs[ATTR_SUPPORTED_FEATURES] & SUPPORTED_FEATURES
        )

    # Restore temperature and humidity values
    group._attr_target_temperature = last_attrs.get(ATTR_TEMPERATURE)
    group._attr_target_temperature_low = last_attrs.get(ATTR_TARGET_TEMP_LOW)
    group._attr_target_temperature_high = last_attrs.get(ATTR_TARGET_TEMP_HIGH)
    group._attr_target_temperature_step = last_attrs.get(ATTR_TARGET_TEMP_STEP)
    group._attr_target_humidity = last_attrs.get(ATTR_HUMIDITY)
    group._attr_current_temperature = last_attrs.get(ATTR_CURRENT_TEMPERATURE)
    group._attr_current_humidity = last_attrs.get(ATTR_CURRENT_HUMIDITY)
    group._attr_min_temp = last_attrs.get(ATTR_MIN_TEMP, DEFAULT_MIN_TEMP)
    group._attr_max_temp = last_attrs.get(ATTR_MAX_TEMP, DEFAULT_MAX_TEMP)
    group._attr_min_humidity = last_attrs.get(ATTR_MIN_HUMIDITY, DEFAULT_MIN_HUMIDITY)
    group._attr_max_humidity = last_attrs.get(ATTR_MAX_HUMIDITY, DEFAULT_MAX_HUMIDITY)
    if ATTR_TARGET_HUMIDITY_STEP in last_attrs:
        group._attr_target_humidity_step = last_attrs.get(ATTR_TARGET_HUMIDITY_STEP)

    # Restore schedule changes made via service (base entity, bypass entity,
    # fallback payload). All three are governed by the same flag — without it
    # the group falls back to its configured defaults after a restart.
    if group.config.get(CONF_RETAIN_SERVICE_CHANGES_SCHEDULE):
        if restored_schedule := last_attrs.get(ATTR_ACTIVE_SCHEDULE_ENTITY):
            group.schedule_handler.restore_schedule_entity(restored_schedule)
            _LOGGER.debug(
                "[%s] Restored active schedule entity: %s",
                group.entity_id,
                restored_schedule,
            )

        if restored_bypass := last_attrs.get(ATTR_ACTIVE_SCHEDULE_BYPASS_ENTITY):
            group.schedule_bypass_handler.restore_bypass_entity(restored_bypass)
            _LOGGER.debug(
                "[%s] Restored active bypass entity: %s",
                group.entity_id,
                restored_bypass,
            )

        if (
            (restored_fallback := last_attrs.get(ATTR_SCHEDULE_FALLBACK_PAYLOAD))
            is not None
            and isinstance(restored_fallback, dict)
        ):
            # Re-normalize in case the persisted attribute predates the YAML on/off-as-boolean fix.
            restored_fallback = normalize_yaml_bool_modes(restored_fallback)
            if restored_fallback != group.schedule_handler.config_fallback_payload:
                group.schedule_handler.restore_fallback_payload(restored_fallback)
                _LOGGER.debug(
                    "[%s] Restored schedule fallback payload override: %s",
                    group.entity_id,
                    restored_fallback,
                )

    # Restore last active HVAC mode
    if (last_active := last_attrs.get(ATTR_LAST_ACTIVE_HVAC_MODE)) is not None:
        group.run_state = replace(group.run_state, last_active_hvac_mode=last_active)

    # Restore runtime group presets before checking active virtual preset
    if (
        group.config.get(CONF_RETAIN_SERVICE_CHANGES_PRESETS)
        and (restored_runtime_presets := last_attrs.get(ATTR_RUNTIME_GROUP_PRESETS))
        is not None
        and isinstance(restored_runtime_presets, dict)
    ):
        normalized_presets = {
            name: normalize_yaml_bool_modes(p)
            for name, p in restored_runtime_presets.items()
            if isinstance(p, dict)
        }
        group.preset_manager.restore_runtime_presets(normalized_presets)
        _LOGGER.debug(
            "[%s] Restored runtime group presets: %s",
            group.entity_id,
            list(normalized_presets.keys()),
        )

    # Restore active virtual preset — unless it was removed or renamed in the
    # options while it was active. Warn rather than debug: the group silently
    # loses a preset the user did not switch off themselves.
    if (last_virtual := last_attrs.get(ATTR_ACTIVE_VIRTUAL_PRESET)) is not None:
        if group.preset_manager.is_virtual(last_virtual):
            group.run_state = replace(
                group.run_state, active_virtual_preset=last_virtual
            )
        else:
            _LOGGER.warning(
                "[%s] Active group preset '%s' is no longer configured — cleared.",
                group.entity_id,
                last_virtual,
            )
            if group.shared_target_state.preset_mode == last_virtual:
                group.shared_target_state = group.shared_target_state.update(
                    preset_mode=None
                )

    # Restore bypass delta
    if (saved_delta := last_attrs.get(ATTR_BYPASS_DELTA)) and isinstance(
        saved_delta, dict
    ):
        delta_map = {}
        for k, v in saved_delta.items():
            if isinstance(v, (list, tuple)) and len(v) == 2:
                delta_map[k] = (v[0], v[1])
        if delta_map:
            group.run_state = group.run_state.set_bypass_delta(delta_map)
            _LOGGER.debug("[%s] Restored bypass delta: %s", group.entity_id, delta_map)

    # Restore isolated members (with defensive full-isolation invariant check).
    # Only entities still covered by a currently instantiated
    # MemberIsolationHandler are restored — a member isolated by a rule that
    # was since removed/disabled has no handler left to ever release it
    # (no trigger transition can fire _deactivate_isolation for a rule that
    # no longer exists). Restoring it anyway would exclude it from
    # aggregation, sync, service calls and calibration forever. Dropped
    # entities are simply not written to isolated_members — the regular
    # startup sync then reaches them like any other non-isolated member.
    if (saved_isolated := last_attrs.get(ATTR_ISOLATED_MEMBERS)) and isinstance(
        saved_isolated, (list, set, tuple)
    ):
        covered: set[str] = set()
        for handler in group.member_isolation_handlers:
            covered.update(handler._isolation_entity_ids)
        valid_isolated = (
            set(saved_isolated) & set(group.climate_entity_ids) & covered
        )
        orphaned = set(saved_isolated) & set(group.climate_entity_ids) - covered
        if orphaned:
            _LOGGER.warning(
                "[%s] Not restoring isolation for %s — no isolation rule covers them any more (rule removed/disabled since last restart)",
                group.entity_id,
                sorted(orphaned),
            )
        if len(valid_isolated) < len(group.climate_entity_ids):
            group.run_state = replace(
                group.run_state, isolated_members=frozenset(valid_isolated)
            )
            _LOGGER.debug(
                "[%s] Restored isolated members: %s", group.entity_id, valid_isolated
            )
