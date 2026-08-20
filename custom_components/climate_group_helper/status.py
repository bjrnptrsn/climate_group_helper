"""Status and analytics aggregation for ClimateGroupHelper extra_state_attributes."""
from __future__ import annotations

from dataclasses import fields
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.util import dt as dt_util
from homeassistant.const import (
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)

from .const import (
    ATTR_ACTIVE_MEMBER_COUNT,
    ATTR_BOOST_TEMPERATURE,
    ATTR_BOOST_UNTIL,
    ATTR_ACTIVE_SCHEDULE_BYPASS_ENTITY,
    ATTR_ACTIVE_SCHEDULE_ENTITY,
    ATTR_ACTIVE_SCHEDULE_SLOT_TITLE,
    ATTR_ASSUMED_STATE,
    ATTR_BLOCKING_SOURCES,
    ATTR_BYPASS_DELTA,
    ATTR_CONFIG_OVERRIDES,
    ATTR_CURRENT_HVAC_MODES,
    ATTR_EFFECTIVE_SYNC_ATTRIBUTES,
    ATTR_EFFECTIVE_SYNC_MODE,
    ATTR_ENABLED_FEATURES,
    ATTR_GROUP_OFFSET,
    ATTR_OFFSET_ENTITY_ID,
    ATTR_ISOLATED_MEMBERS,
    ATTR_LAST_ACTIVE_HVAC_MODE,
    ATTR_LAST_CHANGED,
    ATTR_LAST_ENTITY,
    ATTR_LAST_SOURCE,
    ATTR_MASTER_FALLBACK_ACTIVE,
    ATTR_MEMBER_ENTITIES,
    ATTR_OOB_MEMBERS,
    ATTR_PRESENCE_FALLBACK,
    ATTR_SCHEDULE_FALLBACK_PAYLOAD,
    ATTR_SCHEDULE_FALLBACK_PAYLOAD_ACTIVE,
    ATTR_TARGET_STATE,
    ATTR_TOTAL_MEMBER_COUNT,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_SENSOR,
    CONF_WINDOW_MODE,
    IsolationTrigger,
    PresenceMode,
    SyncMode,
    WindowControlMode,
)
from .state import ClimateState

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper


def build_extra_state_attributes(group: ClimateGroupHelper) -> dict[str, Any]:
    """Collect all status, analytics, and source data into a single dict."""
    run_state = group.run_state
    target = group.shared_target_state
    attrs: dict[str, Any] = {}

    # --- Always present ---
    attrs[ATTR_ASSUMED_STATE] = group._attr_assumed_state
    attrs[ATTR_LAST_ACTIVE_HVAC_MODE] = run_state.last_active_hvac_mode
    attrs[ATTR_CURRENT_HVAC_MODES] = group._current_hvac_modes
    attrs[ATTR_GROUP_OFFSET] = run_state.group_offset
    attrs[ATTR_TARGET_STATE] = target.to_dict(
        attributes=[f.name for f in fields(ClimateState)]
    )

    if group.advanced_mode and group.offset_entity_id:
        attrs[ATTR_OFFSET_ENTITY_ID] = group.offset_entity_id

    # --- Source information ---
    if target.last_source:
        attrs[ATTR_LAST_SOURCE] = target.last_source
    if target.last_timestamp:
        attrs[ATTR_LAST_CHANGED] = dt_util.utc_from_timestamp(target.last_timestamp).isoformat()
    if target.last_entity:
        attrs[ATTR_LAST_ENTITY] = target.last_entity

    # --- Member statistics ---
    # Both counts are always emitted: the total is derived from the configured
    # member list, not from live states, and an all-members-unavailable group is
    # exactly the situation where a dashboard needs to show "0 of N active".
    attrs[ATTR_ACTIVE_MEMBER_COUNT] = sum(
        1 for s in (group.states or ())
        if s.state not in (HVACMode.OFF, STATE_UNAVAILABLE, STATE_UNKNOWN)
    )
    attrs[ATTR_TOTAL_MEMBER_COUNT] = len(group.climate_entity_ids)

    # --- Blocking sources ---
    if run_state.blocking_sources:
        attrs[ATTR_BLOCKING_SOURCES] = sorted(run_state.blocking_sources)

    # --- Fallback flags ---
    if run_state.master_fallback_active:
        attrs[ATTR_MASTER_FALLBACK_ACTIVE] = True

    if "presence" in run_state.blocking_sources:
        sensors: list[str] = group.config.get(CONF_PRESENCE_SENSOR, [])
        if any(
            (s := group.hass.states.get(sid)) is not None
            and s.state in (STATE_UNAVAILABLE, STATE_UNKNOWN)
            for sid in sensors
        ):
            attrs[ATTR_PRESENCE_FALLBACK] = True

    # --- Isolated / OOB members ---
    if run_state.isolated_members:
        attrs[ATTR_ISOLATED_MEMBERS] = sorted(run_state.isolated_members)
    if run_state.oob_members:
        attrs[ATTR_OOB_MEMBERS] = sorted(run_state.oob_members)

    # --- Config overrides (schedule meta-keys) ---
    if run_state.config_overrides:
        attrs[ATTR_CONFIG_OVERRIDES] = dict(run_state.config_overrides)

    # --- Expose member entity IDs ---
    if group._expose_member_entities:
        attrs[ATTR_MEMBER_ENTITIES] = group.climate_entity_ids

    # Configured features — always emitted (even as []) so the card knows the
    # attribute exists and can distinguish "not configured" from "not yet received".
    # Simple mode handlers are not initialised, so we guard handler access.
    cfg = group.config
    features: list[str] = []
    if cfg.get(CONF_WINDOW_MODE, WindowControlMode.DISABLED) != WindowControlMode.DISABLED:
        features.append("window")
    if cfg.get(CONF_PRESENCE_MODE, PresenceMode.DISABLED) != PresenceMode.DISABLED:
        features.append("presence")
    if group.advanced_mode and group.schedule_handler.schedule_entity_id:
        features.append("schedule")
    if group.advanced_mode and group.sync_mode_handler.sync_mode != SyncMode.DISABLED:
        features.append("sync")
    # Based on the instantiated handlers, not the raw config rules: rules
    # beyond CONF_ISOLATION_RULES_COUNT are hidden and must not count as an
    # active feature.
    if any(
        handler._trigger != IsolationTrigger.DISABLED  # noqa: SLF001
        for handler in group.member_isolation_handlers
    ):
        features.append("isolation")
    attrs[ATTR_ENABLED_FEATURES] = features

    # --- Advanced mode only ---
    if not group.advanced_mode:
        return attrs

    # Effective sync config (resolves schedule overrides at call-time)
    attrs[ATTR_EFFECTIVE_SYNC_MODE] = group.sync_mode_handler.sync_mode
    attrs[ATTR_EFFECTIVE_SYNC_ATTRIBUTES] = [
        k for k, v in group.sync_mode_handler.filter_state.to_dict().items() if v
    ]

    # Schedule entities
    if group.schedule_handler.schedule_entity_id:
        attrs[ATTR_ACTIVE_SCHEDULE_ENTITY] = group.schedule_handler.schedule_entity_id
        if group.schedule_handler.active_layer == "fallback":
            attrs[ATTR_SCHEDULE_FALLBACK_PAYLOAD_ACTIVE] = True
    if group.schedule_handler.fallback_payload:
        attrs[ATTR_SCHEDULE_FALLBACK_PAYLOAD] = dict(group.schedule_handler.fallback_payload)
    if group.schedule_bypass_handler.bypass_entity_id:
        attrs[ATTR_ACTIVE_SCHEDULE_BYPASS_ENTITY] = group.schedule_bypass_handler.bypass_entity_id
    if run_state.active_slot_title:
        attrs[ATTR_ACTIVE_SCHEDULE_SLOT_TITLE] = run_state.active_slot_title

    # Boost attributes (temporary override)
    if run_state.boost_temperature is not None:
        attrs[ATTR_BOOST_TEMPERATURE] = run_state.boost_temperature
    if run_state.boost_until is not None:
        attrs[ATTR_BOOST_UNTIL] = run_state.boost_until.isoformat()

    # Persisted bypass delta (for restore)
    if run_state.bypass_delta:
        attrs[ATTR_BYPASS_DELTA] = {k: list(v) for k, v in run_state.bypass_delta.items()}

    return attrs
