"""The Climate Group helper integration."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_ENTITIES, CONF_NAME, Platform
from homeassistant.core import HomeAssistant

PLATFORMS: list[Platform] = [Platform.CLIMATE]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Climate Group helper from a config entry."""

    # Split config entry into data and options during initial configuration
    if not entry.options:
        options = {
            key: value
            for key, value in entry.data.items()
            if key not in (CONF_ENTITIES, CONF_NAME)
        }

        data = {
            CONF_NAME: entry.data[CONF_NAME],
            CONF_ENTITIES: entry.data[CONF_ENTITIES]
        }

        hass.config_entries.async_update_entry(
            entry, data=data, options=options
        )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register update listener for options changes
    entry.async_on_unload(entry.add_update_listener(_update_listener))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update by reloading entry."""
    hass.config_entries.async_schedule_reload(entry.entry_id)
