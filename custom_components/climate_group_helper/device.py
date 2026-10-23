"""The device every entity of a group attaches to."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME
from homeassistant.helpers.device_registry import DeviceInfo

from .const import DOMAIN


def group_name(config_entry: ConfigEntry) -> str:
    """Return the group's name — the device's and the group entity's alike.

    Renaming the config entry changes only its title, never the group.
    """
    return config_entry.options.get(CONF_NAME, config_entry.title)


def group_device_info(unique_id: str | None, name: str | None) -> DeviceInfo:
    """Return the device of a group, identified by its config entry's unique ID."""
    return DeviceInfo(
        identifiers={(DOMAIN, unique_id)},
        name=name,
        manufacturer="Climate Group Helper",
    )
