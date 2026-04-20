"""The Climate Group Helper integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_ENTITIES, CONF_NAME, Platform
from homeassistant.core import HomeAssistant

from .const import (
    CONF_ADVANCED_MODE,
    CONF_CLOSE_DELAY,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPAND_SECTIONS,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_CONFIG,
    CONF_FEATURE_STRATEGY,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HUMIDITY_USE_MASTER,
    CONF_HVAC_MODE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    CONF_MASTER_ENTITY,
    CONF_MIN_TEMP_OFF,
    CONF_OVERRIDE_DURATION,
    CONF_PERSIST_ACTIVE_SCHEDULE,
    CONF_PERSIST_CHANGES,
    CONF_PRESENCE_ACTION,
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_AWAY_OFFSET,
    CONF_PRESENCE_AWAY_PRESET,
    CONF_PRESENCE_AWAY_TEMPERATURE,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_RETURN_DELAY,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_RESYNC_INTERVAL,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_SCHEDULE_ENTITY,
    CONF_SYNC_ATTRS,
    CONF_SYNC_MODE,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_TEMP_USE_MASTER,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_TEMPERATURE,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_WINDOW_MODE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_MEMBER_OFFSET_CORRECTION,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    DOMAIN,
)

# Valid configuration keys for migration whitelist
VALID_CONFIG_KEYS = {
    CONF_NAME,
    CONF_ENTITIES,
    CONF_ADVANCED_MODE,
    # HVAC options
    CONF_HVAC_MODE_STRATEGY,
    CONF_FEATURE_STRATEGY,
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
    # Sync mode options
    CONF_SYNC_MODE,
    CONF_SYNC_ATTRS,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_MIN_TEMP_OFF,
    # Schedule options (partial sync)
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
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
    CONF_RESYNC_INTERVAL,
    CONF_OVERRIDE_DURATION,
    CONF_PERSIST_CHANGES,
    CONF_PERSIST_ACTIVE_SCHEDULE,
    # Other options
    CONF_EXPOSE_SMART_SENSORS,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_CONFIG,
    CONF_EXPAND_SECTIONS,
    # Member Isolation options
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_RESTORE_DELAY,
    # Union out-of-bounds (OOB) options
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
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



async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Migrate old config entries to the current version.

    v<10 → v10: Soft Reset — combine data+options, apply all historical
                transformations, whitelist-filter, ensure defaults.
    """
    if entry.version < 10:
        _LOGGER.info("[%s] Migrating config entry from version %s to 10 (Soft Reset)", entry.title, entry.version)

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

        # Whitelist filter: discard all deprecated/renamed keys
        new_options = {key: value for key, value in old_config.items() if key in VALID_CONFIG_KEYS}

        # Ensure defaults for keys added in earlier versions
        if CONF_EXPAND_SECTIONS not in new_options:
            new_options[CONF_EXPAND_SECTIONS] = False

        hass.config_entries.async_update_entry(entry, data={}, options=new_options, version=10)

        _LOGGER.info("[%s] Migration to v10 complete. %d valid keys preserved.", entry.title, len(new_options))

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
