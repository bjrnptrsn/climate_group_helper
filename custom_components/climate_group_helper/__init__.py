"""The Climate Group Helper integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_ENTITIES, CONF_NAME, Platform
from homeassistant.core import HomeAssistant

from .const import (
    CONF_ADVANCED_MODE,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_CALIBRATION_IGNORE_OFF,
    CONF_CLOSE_DELAY,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPAND_SECTIONS,
    CONF_EXPOSE_CONFIG,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_FEATURE_STRATEGY,
    CONF_GRACE_PERIOD,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HUMIDITY_USE_MASTER,
    CONF_HVAC_MODE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_IGNORE_OFF_MEMBERS_TEMPERATURE,
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_RULES,
    CONF_ISOLATION_RULES_COUNT,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_TRIGGER_HVAC_MODES,
    CONF_ISOLATION_TRIGGER,
    CONF_MASTER_ENTITY,
    CONF_MEMBER_OFFSET_CORRECTION,
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_MIN_TEMP_OFF,
    CONF_PRESENCE_ACTION,
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_AWAY_OFFSET,
    CONF_PRESENCE_AWAY_PRESET,
    CONF_PRESENCE_AWAY_TEMPERATURE,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_RETURN_DELAY,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_FORCE_RETRY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_RANGE_TEMPLATE_ENABLED,
    CONF_RANGE_TEMPLATE_DEADBAND_ACTION,
    CONF_RANGE_TEMPLATE_COOL_ENTITIES,
    CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
    CONF_RETAIN_SERVICE_CHANGES_SCHEDULE,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_SCHEDULE_FALLBACK_PAYLOAD,
    CONF_SCHEDULE_ENTITY,
    CONF_STAGGERED_CALL_DELAY,
    CONF_SYNC_ATTRS,
    CONF_SYNC_MODE,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_TEMP_USE_MASTER,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    CONF_UNION_UNSUPPORTED_HVAC_ACTION,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_WINDOW_MODE,
    CONF_WINDOW_TEMPERATURE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DOMAIN,
    IsolationTrigger,
)

# Valid configuration keys for migration whitelist
VALID_CONFIG_KEYS = {
    CONF_NAME,
    CONF_ENTITIES,
    CONF_ADVANCED_MODE,
    # HVAC options
    CONF_HVAC_MODE_STRATEGY,
    CONF_FEATURE_STRATEGY,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    CONF_UNION_UNSUPPORTED_HVAC_ACTION,
    # Master entity
    CONF_MASTER_ENTITY,
    # Temperature options
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_SENSORS,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_TEMP_USE_MASTER,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_CALIBRATION_IGNORE_OFF,
    # Humidity options
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HUMIDITY_USE_MASTER,
    # Service call options
    CONF_DEBOUNCE_DELAY,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_FORCE_RETRY,
    CONF_STAGGERED_CALL_DELAY,
    CONF_GRACE_PERIOD,
    # Sync mode options
    CONF_SYNC_MODE,
    CONF_SYNC_ATTRS,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_MIN_TEMP_OFF,
    # Schedule options (partial sync)
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    # Temperature aggregation options
    CONF_IGNORE_OFF_MEMBERS_TEMPERATURE,
    # Window control options
    CONF_WINDOW_MODE,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_TEMPERATURE,
    CONF_ROOM_SENSOR,
    CONF_ZONE_SENSOR,
    CONF_ROOM_OPEN_DELAY,
    CONF_ZONE_OPEN_DELAY,
    CONF_CLOSE_DELAY,
    # Presence control options
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_PRESENCE_ACTION,
    CONF_PRESENCE_AWAY_OFFSET,
    CONF_PRESENCE_AWAY_TEMPERATURE,
    CONF_PRESENCE_AWAY_PRESET,
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_RETURN_DELAY,
    # Schedule options
    CONF_SCHEDULE_ENTITY,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_SCHEDULE_FALLBACK_PAYLOAD,
    CONF_RETAIN_SERVICE_CHANGES_SCHEDULE,
    # Other options
    CONF_EXPOSE_SMART_SENSORS,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_CONFIG,
    CONF_EXPAND_SECTIONS,
    CONF_RANGE_TEMPLATE_ENABLED,
    CONF_RANGE_TEMPLATE_DEADBAND_ACTION,
    CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
    CONF_RANGE_TEMPLATE_COOL_ENTITIES,

    # Member Isolation options — flat isolation_* keys are migrated into
    # CONF_ISOLATION_RULES (v11→v12) and intentionally excluded from the whitelist.
    CONF_ISOLATION_RULES_COUNT,
    CONF_ISOLATION_RULES,
    # Per-member temperature offsets
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_MEMBER_OFFSET_CORRECTION,
}

# Track which platforms have been set up per entry
SETUP_PLATFORMS = "setup_platforms"

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Climate Group Helper from a config entry."""

    # One-time migration for entries that have no options yet, moving all data to options
    if not entry.options:
        hass.config_entries.async_update_entry(entry, data={}, options=entry.data)

    # Initialize domain data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN].setdefault(entry.entry_id, {})
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS] = set()

    # Set up climate and sensor first — climate.async_setup_entry stores the group
    # reference in hass.data, which switch.async_setup_entry depends on.
    await hass.config_entries.async_forward_entry_setups(entry, [Platform.CLIMATE, Platform.SENSOR])
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.CLIMATE)
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.SENSOR)

    # Set up switch and number after climate so the group reference is guaranteed to exist.
    await hass.config_entries.async_forward_entry_setups(entry, [Platform.SWITCH, Platform.NUMBER])
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.SWITCH)
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.NUMBER)

    # Register update listener for options changes, which will trigger a reload
    entry.async_on_unload(entry.add_update_listener(_update_listener))

    return True


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migrate old config entries to the current version.

    Two stages: a Soft Reset to v12 for everything older, then v12→v13.

    The Soft Reset combines all historical transformations (v7–v12) into a single pass:
        - Combine data+options (covers pre-v7 entries)
        - v7→v8: split ignore_off_members into _sync / _schedule variants
        - v8→v9: rename SyncMode "standard" → "disabled"
        - v9→v10: rewrite WindowControlMode "off"/"on" → "disabled"/"enabled"
        - v10→v11: wrap presence_sensor str → list; set advanced_mode=True on existing entries
        - v11→v12: convert range_template_entities list → CONF_RANGE_TEMPLATE_ENABLED bool;
                   wrap flat isolation keys into CONF_ISOLATION_RULES list
        - Filter out invalid/renamed configuration keys via VALID_CONFIG_KEYS whitelist
        - Restore defaults for valid keys not present

    v12→v13 renames persist_active_schedule → retain_service_changes_schedule and
    re-applies the VALID_CONFIG_KEYS whitelist. It runs as its own step (not inside
    the Soft Reset) because entries already on v12 never enter that block: the
    rename has to happen before the whitelist would drop the old key, and the
    whitelist has to run at all — otherwise keys retired after v12 (resync_interval,
    override_duration, persist_changes) linger in those entries forever.
    """
    current_options = dict(entry.options)

    if entry.version < 12:
        _LOGGER.info("[%s] Migrating config entry from version %s to 12", entry.title, entry.version)

        # Combine data + options (covers pre-v7 entries that still used entry.data)
        old_config = {**entry.data, **entry.options}

        # v7 → v8: split ignore_off_members; rename SyncMode.STANDARD → DISABLED
        ignore_off = old_config.pop("ignore_off_members", False)
        if CONF_IGNORE_OFF_MEMBERS_SYNC not in old_config:
            old_config[CONF_IGNORE_OFF_MEMBERS_SYNC] = ignore_off
        if CONF_IGNORE_OFF_MEMBERS_SCHEDULE not in old_config:
            old_config[CONF_IGNORE_OFF_MEMBERS_SCHEDULE] = ignore_off
        if old_config.get(CONF_SYNC_MODE) == "standard":
            old_config[CONF_SYNC_MODE] = "disabled"

        # v8 → v9: WindowControlMode "off"/"on" → "disabled"/"enabled"
        if old_config.get(CONF_WINDOW_MODE) == "off":
            old_config[CONF_WINDOW_MODE] = "disabled"
        elif old_config.get(CONF_WINDOW_MODE) == "on":
            old_config[CONF_WINDOW_MODE] = "enabled"

        # v9 → v10: CONF_PRESENCE_SENSOR str → list[str]; add CONF_ADVANCED_MODE
        presence_sensor = old_config.get(CONF_PRESENCE_SENSOR)
        if isinstance(presence_sensor, str):
            old_config[CONF_PRESENCE_SENSOR] = [presence_sensor]
        if CONF_ADVANCED_MODE not in old_config:
            old_config[CONF_ADVANCED_MODE] = True

        # v10 → v11: CONF_RANGE_TEMPLATE_ENTITIES list → CONF_RANGE_TEMPLATE_ENABLED bool
        if "range_template_entities" in old_config:
            old_config[CONF_RANGE_TEMPLATE_ENABLED] = bool(old_config.pop("range_template_entities"))

        # v11 → v12: flat isolation_* keys → CONF_ISOLATION_RULES list.
        # Only convert if not already migrated (idempotent for entries already on v12+ shape).
        if CONF_ISOLATION_RULES not in old_config:
            trigger = old_config.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
            if trigger != IsolationTrigger.DISABLED:
                old_config[CONF_ISOLATION_RULES] = [{
                    CONF_ISOLATION_TRIGGER: trigger,
                    CONF_ISOLATION_ENTITIES: old_config.get(CONF_ISOLATION_ENTITIES, []),
                    CONF_ISOLATION_TRIGGER_HVAC_MODES: old_config.get(CONF_ISOLATION_TRIGGER_HVAC_MODES, []),
                    CONF_ISOLATION_SENSOR: old_config.get(CONF_ISOLATION_SENSOR),
                    CONF_ISOLATION_ACTIVATE_DELAY: old_config.get(CONF_ISOLATION_ACTIVATE_DELAY, 0),
                    CONF_ISOLATION_RESTORE_DELAY: old_config.get(CONF_ISOLATION_RESTORE_DELAY, 0),
                }]
            else:
                old_config[CONF_ISOLATION_RULES] = []
            # Keep the count in sync with the rules just written — otherwise the options
            # flow (which defaults the count to "1" when absent) diverges from the actual
            # rule list until the user opens and saves it once.
            old_config[CONF_ISOLATION_RULES_COUNT] = str(max(len(old_config[CONF_ISOLATION_RULES]), 1))
        # Drop the old flat keys (removed from VALID_CONFIG_KEYS) so they don't linger.
        for key in (CONF_ISOLATION_TRIGGER, CONF_ISOLATION_ENTITIES, CONF_ISOLATION_TRIGGER_HVAC_MODES,
                    CONF_ISOLATION_SENSOR, CONF_ISOLATION_ACTIVATE_DELAY, CONF_ISOLATION_RESTORE_DELAY):
            old_config.pop(key, None)

        # Rename persist_active_schedule → retain_service_changes_schedule before the
        # whitelist filter runs — the old key is no longer whitelisted, so filtering
        # first would drop the user's setting instead of carrying it over.
        if "persist_active_schedule" in old_config:
            old_config[CONF_RETAIN_SERVICE_CHANGES_SCHEDULE] = old_config.pop("persist_active_schedule")

        # Whitelist filter: discard all deprecated/renamed keys
        new_options = {key: value for key, value in old_config.items() if key in VALID_CONFIG_KEYS}

        # Ensure defaults for keys added in earlier versions
        if CONF_EXPAND_SECTIONS not in new_options:
            new_options[CONF_EXPAND_SECTIONS] = False

        hass.config_entries.async_update_entry(entry, data={}, options=new_options, version=12)
        _LOGGER.info("[%s] Migration to v12 complete. %d valid keys preserved.", entry.title, len(new_options))

        # Carry the result into the next stage instead of re-reading entry.options —
        # the stages must chain regardless of when the entry write becomes visible.
        current_options = new_options

    if entry.version < 13:
        _LOGGER.info("[%s] Migrating config entry from version %s to 13", entry.title, entry.version)

        # Rename persist_active_schedule → retain_service_changes_schedule. The flag
        # now covers every schedule change made via service (base entity, bypass
        # entity, fallback payload), not just the active schedule entity.
        # Entries coming through the Soft Reset above were already renamed there
        # (before the whitelist filter); this stage covers entries already on v12.
        new_options = dict(current_options)
        if "persist_active_schedule" in new_options:
            new_options[CONF_RETAIN_SERVICE_CHANGES_SCHEDULE] = new_options.pop("persist_active_schedule")

        # Re-apply the whitelist. Entries already on v12 never enter the Soft Reset
        # block, so keys retired after v12 (resync_interval, override_duration,
        # persist_changes) would linger in their options forever — a stale value
        # that the options flow no longer shows and nothing ever clears.
        dropped = sorted(key for key in new_options if key not in VALID_CONFIG_KEYS)
        if dropped:
            new_options = {key: value for key, value in new_options.items() if key in VALID_CONFIG_KEYS}
            _LOGGER.info("[%s] Dropped retired config keys: %s", entry.title, ", ".join(dropped))

        hass.config_entries.async_update_entry(entry, data={}, options=new_options, version=13)
        _LOGGER.info("[%s] Migration to v13 complete.", entry.title)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""

    # Get setup platforms
    entry_data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
    platforms = list(entry_data.get(SETUP_PLATFORMS, {Platform.CLIMATE}))

    # Unload platforms
    unloaded = await hass.config_entries.async_unload_platforms(entry, platforms)

    # Clean up domain data
    if unloaded and entry.entry_id in hass.data.get(DOMAIN, {}):
        hass.data[DOMAIN].pop(entry.entry_id)

    return unloaded


async def _update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update by reloading the entry."""
    hass.config_entries.async_schedule_reload(entry.entry_id)
