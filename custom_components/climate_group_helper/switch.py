"""Main Switch platform for Climate Group Helper.

Provides a master on/off switch for each climate group:
- OFF: group is forced to hvac_mode=off, target_state preserved
- ON: group restored to target_state
- Persists state across restarts via RestoreEntity
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the main switch for each climate group."""
    entry_data = hass.data.get(DOMAIN, {}).get(config_entry.entry_id, {})
    group = entry_data.get("group")

    if not group:
        _LOGGER.warning(
            "[%s] Climate group entity not found for config entry, skipping switch setup",
            config_entry.title,
        )
        return

    async_add_entities([ControlSwitch(group)])


class ControlSwitch(SwitchEntity, RestoreEntity):
    """Main on/off switch for a climate group.

    When OFF: group is forced to hvac_mode=off, target_state preserved.
    When ON: group restored to target_state.
    Persists state across restarts via RestoreEntity.
    """

    _attr_should_poll = False

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the main switch."""
        self._group = group
        self._is_on = True  # Default: switch is ON
        self._attr_unique_id = f"{group.unique_id}_control_switch"
        self._attr_translation_key = "main_switch"
        self._attr_icon = "mdi:power"

    @property
    def override_manager(self):
        return self._group.switch_override_manager

    @property
    def device_info(self) -> dict[str, Any]:
        """Return the device info (same device as the ClimateGroup)."""
        return self._group.device_info

    async def async_added_to_hass(self) -> None:
        """Restore state from previous run."""
        await super().async_added_to_hass()
        if (last := await self.async_get_last_state()) is not None:
            self._is_on = last.state == "on"
            if not self._is_on:
                _LOGGER.debug(
                    "[%s] Restoring control switch OFF state",
                    self._group.entity_id,
                )
                await self.override_manager.activate()

    @property
    def is_on(self) -> bool:
        """Return true if the switch is on."""
        return self._is_on

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn switch ON → restore group to target_state."""
        self._is_on = True
        await self.override_manager.restore()
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn switch OFF → force group to hvac_mode=off."""
        self._is_on = False
        await self.override_manager.activate()
        self.async_write_ha_state()
