"""The Climate Group helper integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_ENTITIES, CONF_NAME, Platform
from homeassistant.core import HomeAssistant

from .const import (
    CONF_DEBOUNCE_DELAY,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_FEATURE_STRATEGY,
    CONF_HUMIDITY_CURRENT_AVG_OPTION,
    CONF_HUMIDITY_TARGET_AVG_OPTION,
    CONF_HUMIDITY_TARGET_ROUND_OPTION,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HVAC_MODE_STRATEGY,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_SYNC_ATTRIBUTES,
    CONF_SYNC_MODE,
    CONF_TEMP_CURRENT_AVG_OPTION,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG_OPTION,
    CONF_TEMP_TARGET_ROUND_OPTION,
    CONF_TEMP_UPDATE_TARGETS,
    DOMAIN,
)

# Valid configuration keys for migration whitelist
VALID_CONFIG_KEYS = {
    CONF_NAME,
    CONF_ENTITIES,
    CONF_HVAC_MODE_STRATEGY,
    CONF_FEATURE_STRATEGY,
    CONF_TEMP_CURRENT_AVG_OPTION,
    CONF_TEMP_TARGET_AVG_OPTION,
    CONF_TEMP_TARGET_ROUND_OPTION,
    CONF_TEMP_SENSORS,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_HUMIDITY_CURRENT_AVG_OPTION,
    CONF_HUMIDITY_TARGET_AVG_OPTION,
    CONF_HUMIDITY_TARGET_ROUND_OPTION,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_DEBOUNCE_DELAY,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_SYNC_MODE,
    CONF_SYNC_ATTRIBUTES,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_EXPOSE_MEMBER_ENTITIES,
}

# Track which platforms have been set up per entry
SETUP_PLATFORMS = "setup_platforms"

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Climate Group helper from a config entry."""

    # One-time migration for entries that have no options yet, moving all data to options
    if not entry.options:
        hass.config_entries.async_update_entry(entry, data={}, options=entry.data)

    # Initialize domain data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN].setdefault(entry.entry_id, {})
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS] = set()

    # Set up climate platform
    await hass.config_entries.async_forward_entry_setups(entry, [Platform.CLIMATE])
    hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.CLIMATE)

    # Set up sensor platform if exposed
    if entry.options.get(CONF_EXPOSE_SMART_SENSORS):
        await hass.config_entries.async_forward_entry_setups(entry, [Platform.SENSOR])
        hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.SENSOR)

    # Register update listener for options changes, which will trigger a reload
    entry.async_on_unload(entry.add_update_listener(_update_listener))

    return True



async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Migrate old config entries to version 5 using a 'Soft Reset' strategy.
    
    This ensures that no invalid or legacy keys survive the migration, potentially
    resetting some user customizations if keys were renamed, but guaranteeing a 
    valid configuration state.
    """
    if entry.version < 5:
        _LOGGER.info("Migrating config entry from version %s to 5 (Soft Reset)", entry.version)
        
        # Combine data + options (old versions stored some keys in data)
        old_config = {**entry.data, **entry.options}
        
        # Whitelist Filter: Keep only currently valid keys
        new_options = {k: v for k, v in old_config.items() if k in VALID_CONFIG_KEYS}
        
        # Update entry
        hass.config_entries.async_update_entry(entry, data={}, options=new_options, version=5)
        
        _LOGGER.info(
            "Migration complete. %d valid keys preserved, %d keys discarded.", 
            len(new_options), 
            len(old_config) - len(new_options)
        )
    
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
