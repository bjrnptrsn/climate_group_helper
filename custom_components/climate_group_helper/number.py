"""Group Offset number platform for Climate Group Helper."""
from __future__ import annotations

import logging
from dataclasses import replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.number import NumberEntity, NumberMode, RestoreNumber
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, META_KEY_GROUP_OFFSET

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the group offset number for each climate group."""
    entry_data = hass.data.get(DOMAIN, {}).get(config_entry.entry_id, {})
    group = entry_data.get("group")

    if not group:
        _LOGGER.warning("[%s] Climate group entity not found for config entry, skipping number setup", config_entry.title)
        return
    if not group.advanced_mode:
        return

    async_add_entities([OffsetNumber(group)])


class OffsetNumber(RestoreNumber, NumberEntity):
    """Global temperature offset for a climate group."""

    _attr_has_entity_name = True
    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = -5.0
    _attr_native_max_value = 5.0
    _attr_native_step = 0.5
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_should_poll = False

    def __init__(self, group: ClimateGroup) -> None:
        """Initialize the offset number."""
        self._group = group
        self._attr_icon = "mdi:thermometer-plus"
        self._attr_translation_key = "group_offset"
        self._attr_unique_id = f"{group.unique_id}_group_offset"

    @property
    def device_info(self) -> dict[str, Any]:
        """Attach this entity to the same device as the climate group."""
        return self._group.device_info

    async def async_added_to_hass(self) -> None:
        """Restore last value on startup."""
        await super().async_added_to_hass()
        self._group.offset_set_callback = self._set_offset
        if (last := await self.async_get_last_number_data()) is not None:
            if last.native_value is not None:
                self._group.run_state = replace(self._group.run_state, group_offset=float(last.native_value))
                _LOGGER.debug("[%s] Restored group offset: %s", self._group.entity_id, last.native_value)

    async def _set_offset(self, value: float) -> None:
        """Set group offset and update number entity display."""
        _LOGGER.debug("[%s] External offset update: %s", self._group.entity_id, value)
        self._group.run_state = replace(self._group.run_state, group_offset=value)
        self.async_write_ha_state()

    @property
    def native_value(self) -> float:
        """Return the current offset value."""
        return self._group.run_state.group_offset

    async def async_set_native_value(self, value: float) -> None:
        """Persist the new offset and push it to members where applicable.

        If the schedule currently owns the group_offset via a meta-key slot, a manual
        change transfers ownership back to the user: the config_override marker is
        cleared so the next slot transition will NOT reset the offset to 0.0.
        """
        _LOGGER.debug("[%s] Setting group offset to: %s", self._group.entity_id, value)
        new_run_state = replace(self._group.run_state, group_offset=value)
        # Ownership transfer: if a schedule meta-key slot currently controls the offset,
        # release that claim so the slot-end cleanup does not silently reset the user's value.
        if META_KEY_GROUP_OFFSET in new_run_state.config_overrides:
            _LOGGER.debug(
                "[%s] Offset ownership transferred from schedule to user (manual slider change)",
                self._group.entity_id,
            )
            new_run_state = new_run_state.clear_config_overrides({META_KEY_GROUP_OFFSET})
        self._group.run_state = new_run_state
        self._group.async_defer_or_update_ha_state()

        sources = self._group.run_state.blocking_sources
        if "presence" in sources:
            # Only presence AWAY_OFFSET uses group_offset — window/switch enforcement ignores it.
            await self._group.presence_override_manager.enforce_override()
        elif not sources and not self._group.run_state.active_override:
            await self._group.sync_mode_call_handler.call_debounced()
        else:
            _LOGGER.debug(
                "[%s] No calls made. Sources: '%s', Active override: '%s'",
                self._group.entity_id,
                ", ".join(sources) if sources else "None",
                self._group.run_state.active_override
            )
        self.async_write_ha_state()
