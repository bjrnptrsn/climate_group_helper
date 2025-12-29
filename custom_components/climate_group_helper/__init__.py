"""The Climate Group helper integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import (
    CONF_EXPOSE_SMART_SENSORS,
    CONF_HUMIDITY_CURRENT_AVG_OPTION,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG_OPTION,
    CONF_HUMIDITY_TARGET_ROUND_OPTION,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HVAC_MODE_STRATEGY,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_TEMP_CURRENT_AVG_OPTION,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG_OPTION,
    CONF_TEMP_TARGET_ROUND_OPTION,
    CONF_TEMP_UPDATE_TARGETS,
    DOMAIN,
    HVAC_MODE_STRATEGY_OFF_PRIORITY,
    AverageOption,
    RoundOption,
)

# Legacy Configuration keys for migration
_LEGACY_CONF_CURRENT_AVG_OPTION = "current_avg_option"
_LEGACY_CONF_TARGET_AVG_OPTION = "target_avg_option"
_LEGACY_CONF_ROUND_OPTION = "round_option"
_LEGACY_CONF_TEMP_TARGETS = "temp_targets"
_LEGACY_CONF_HUMIDITY_TARGETS = "humidity_targets"

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
    """Migrate old entry."""
    # Check if we need to migrate the config entry
    _LOGGER.info("Attempting to migrate config entry from version %s", entry.version)

    if entry.version == 1:
        _LOGGER.info("Migrating config entry to version 2")

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
            options_v2[_LEGACY_CONF_TARGET_AVG_OPTION] = old_avg_option

        # Update the entry with empty data and all config in options
        hass.config_entries.async_update_entry(
            entry, data={}, options=options_v2, version=2
        )
        _LOGGER.info("Successfully migrated config entry to version 2")

    if entry.version == 2:
        _LOGGER.info("Migrating config entry to version 3")
        options_v3 = dict(entry.options)

        # Rename repeat_count to retry_attempts
        if "repeat_count" in options_v3:
            repeat_count = options_v3.pop("repeat_count")
            # repeat_count was total executions (1 = no retry).
            # retry_attempts is retries after failure (min 0 in config flow).
            # So we subtract 1, but ensure at least 0.
            options_v3[CONF_RETRY_ATTEMPTS] = max(0, repeat_count - 1)
            _LOGGER.info(
                "Migrated 'repeat_count' (%s) to '%s' (%s)",
                repeat_count,
                CONF_RETRY_ATTEMPTS,
                options_v3[CONF_RETRY_ATTEMPTS],
            )

        # Rename repeat_delay to retry_delay
        if "repeat_delay" in options_v3:
            options_v3[CONF_RETRY_DELAY] = options_v3.pop("repeat_delay")
            _LOGGER.info("Migrated 'repeat_delay' to '%s'", CONF_RETRY_DELAY)

        hass.config_entries.async_update_entry(entry, options=options_v3, version=3)
        _LOGGER.info("Successfully migrated config entry to version 3")

    if entry.version == 3:
        _LOGGER.info("Migrating config entry to version 4")
        options_v4 = dict(entry.options)

        # 1. Split global averaging and rounding options
        current_avg = options_v4.pop(_LEGACY_CONF_CURRENT_AVG_OPTION, AverageOption.MEAN)
        options_v4[CONF_TEMP_CURRENT_AVG_OPTION] = current_avg
        options_v4[CONF_HUMIDITY_CURRENT_AVG_OPTION] = current_avg

        target_avg = options_v4.pop(_LEGACY_CONF_TARGET_AVG_OPTION, AverageOption.MEAN)
        options_v4[CONF_TEMP_TARGET_AVG_OPTION] = target_avg
        options_v4[CONF_HUMIDITY_TARGET_AVG_OPTION] = target_avg

        round_opt = options_v4.pop(_LEGACY_CONF_ROUND_OPTION, RoundOption.NONE)
        options_v4[CONF_TEMP_TARGET_ROUND_OPTION] = round_opt
        options_v4[CONF_HUMIDITY_TARGET_ROUND_OPTION] = round_opt

        # 2. Rename target entities keys for clarity
        if _LEGACY_CONF_TEMP_TARGETS in options_v4:
            options_v4[CONF_TEMP_UPDATE_TARGETS] = options_v4.pop(_LEGACY_CONF_TEMP_TARGETS)
        if _LEGACY_CONF_HUMIDITY_TARGETS in options_v4:
            options_v4[CONF_HUMIDITY_UPDATE_TARGETS] = options_v4.pop(_LEGACY_CONF_HUMIDITY_TARGETS)

        # 3. Temperature Sensor: Single String -> List
        # Note: config_flow already uses EntitySelector with multiple=True, 
        # but old entries might have a single string if they were created before multi-sensor support.
        temp_sensors = options_v4.get(CONF_TEMP_SENSORS)
        if isinstance(temp_sensors, str):
            options_v4[CONF_TEMP_SENSORS] = [temp_sensors] if temp_sensors else []

        # 4. Sensor Attribute Rename
        if "expose_attribute_sensors" in options_v4:
            options_v4[CONF_EXPOSE_SMART_SENSORS] = options_v4.pop("expose_attribute_sensors")

        # 5. Remove deprecated keys
        options_v4.pop("use_temp_sensor", None)
        options_v4.pop("sync_retry", None)
        options_v4.pop("sync_delay", None)

        hass.config_entries.async_update_entry(entry, options=options_v4, version=4)
        _LOGGER.info("Successfully migrated config entry to version 4")

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
