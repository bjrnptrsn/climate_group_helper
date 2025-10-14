"""The Climate Group helper integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import (
    CONF_EXPOSE_ATTRIBUTE_SENSORS,
    CONF_HVAC_MODE_STRATEGY,
    CONF_TARGET_AVG_OPTION,
    DOMAIN,
    HVAC_MODE_STRATEGY_OFF_PRIORITY,
)

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
    if entry.options.get(CONF_EXPOSE_ATTRIBUTE_SENSORS):
        await hass.config_entries.async_forward_entry_setups(entry, [Platform.SENSOR])
        hass.data[DOMAIN][entry.entry_id][SETUP_PLATFORMS].add(Platform.SENSOR)

    # Register update listener for options changes, which will trigger a reload
    entry.async_on_unload(entry.add_update_listener(_update_listener))

    return True


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Migrate old entry."""
    _LOGGER.debug("Attempting to migrate config entry from version %s", entry.version)

    if entry.version == 1:
        _LOGGER.debug("Migrating config entry to version 2")

        # For version 1, some configuration was stored in data and some in options.
        data_v1 = dict(entry.data)
        options_v1 = dict(entry.options)

        # For version 2, all configuration is stored in options, so we combine data and options into options.
        options_v2 = {**data_v1, **options_v1}

        # Migrate hvac_mode_off_priority to hvac_mode_strategy (since Release 0.5.0)
        if options_v2.pop("hvac_mode_off_priority", False):
            options_v2[CONF_HVAC_MODE_STRATEGY] = HVAC_MODE_STRATEGY_OFF_PRIORITY

        # Migrate average_option to target_avg_option (since Release 0.7.0)
        if (old_avg_option := options_v2.pop("average_option", None)) is not None:
            options_v2[CONF_TARGET_AVG_OPTION] = old_avg_option

        # Update the entry with empty data and all config in options
        hass.config_entries.async_update_entry(entry, data={}, options=options_v2, version=2)
        _LOGGER.info("Successfully migrated config entry to version 2")

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
