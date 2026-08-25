"""Group Offset number platform for Climate Group Helper."""
from __future__ import annotations

import logging
import math
from dataclasses import replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.number import NumberEntity, NumberMode, RestoreNumber
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, META_KEY_GROUP_OFFSET

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)

# Bounds of the group offset. Module-level so every writer shares one source of
# truth — the slider entity below exposes them as its native min/max, and
# `clean_offset()` enforces them for the paths that never touch the entity.
GROUP_OFFSET_MIN = -5.0
GROUP_OFFSET_MAX = 5.0


def clean_offset(value: Any, entity_id: str) -> float | None:
    """Validate and clamp a group offset, or return None if it is unusable.

    Lives here because this module owns `run_state.group_offset`, and every
    writer has to apply the same rule: the slider, both restore paths
    (climate attributes and the entity's own persisted value) and the schedule
    meta-key fallback that writes `run_state` directly when no offset entity
    exists. An unclamped value is not cosmetic — it flows into every temperature
    call through `_process_group_offset` (a target of 21.0 with an offset of
    99.0 is sent as 120.0), and `status.py` persists it verbatim, so it survives
    every restart once stored.

    Out-of-range values are clamped rather than rejected, matching what the
    slider does with the same input — one value, one rule.
    """
    try:
        val = float(value)
        if math.isnan(val) or math.isinf(val):
            raise ValueError
    except (ValueError, TypeError):
        _LOGGER.warning("[%s] Invalid group_offset value: %s — ignored.", entity_id, value)
        return None

    clamped = max(GROUP_OFFSET_MIN, min(GROUP_OFFSET_MAX, val))
    if clamped != val:
        _LOGGER.warning(
            "[%s] Clamped group_offset from %s to %s (allowed range: %s–%s)",
            entity_id, val, clamped, GROUP_OFFSET_MIN, GROUP_OFFSET_MAX,
        )
    return clamped


async def async_push_group_offset(group: ClimateGroupHelper) -> None:
    """Push the current group offset to the members.

    Lives here because this module owns `run_state.group_offset`.
    Shared by both writers — the slider below and the schedule meta-key
    (meta_processor.py) — so a slot that only sets `group_offset` reaches the
    devices just like a manual slider move. The offset value itself is applied
    inside the call pipeline; this only triggers the send, picking the handler
    that matches the current blocking state.
    """
    sources = group.run_state.blocking_sources
    if "presence" in sources:
        # Only presence AWAY_OFFSET uses group_offset — window/switch enforcement ignores it.
        await group.presence_override_manager.enforce_override()
    elif not group.run_state.temporary_state_active:
        await group.sync_mode_call_handler.call_debounced()
    else:
        _LOGGER.debug(
            "[%s] Group offset not pushed. Sources: '%s', Temporary state active: %s",
            group.entity_id,
            ", ".join(sources) if sources else "None",
            group.run_state.temporary_state_active,
        )


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
    _attr_native_min_value = GROUP_OFFSET_MIN
    _attr_native_max_value = GROUP_OFFSET_MAX
    _attr_native_step = 0.5
    _attr_should_poll = False

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the offset number."""
        self._group = group
        # Follow the system unit like the climate entity does — a hard-coded °C
        # mislabels the slider in Fahrenheit setups and makes the magnitude wrong
        # (a step of 0.5 would read as °C but be applied as °F).
        self._attr_native_unit_of_measurement = group.hass.config.units.temperature_unit
        self._attr_icon = "mdi:thermometer-plus"
        self._attr_translation_key = "group_offset"
        self._attr_unique_id = f"{group.unique_id}_group_offset"

    @property
    def device_info(self) -> dict[str, Any]:  # type: ignore[override]
        """Attach this entity to the same device as the climate group."""
        return self._group.device_info

    async def async_added_to_hass(self) -> None:
        """Restore state and register ID in group."""
        await super().async_added_to_hass()
        
        # Register this entity ID in the group so status.py doesn't have to guess
        self._group.offset_entity_id = self.entity_id
        _LOGGER.debug("[%s] Registered offset entity: '%s'", self._group.entity_id, self.entity_id)

        self._group.offset_set_callback = self._set_offset
        if (last := await self.async_get_last_number_data()) is not None:
            if last.native_value is not None:
                # Clamped like any other write: a persisted value can predate the
                # bounds or have been stored while this entity was disabled.
                if (restored := clean_offset(last.native_value, self._group.entity_id)) is not None:
                    self._group.run_state = replace(self._group.run_state, group_offset=restored)
                    _LOGGER.debug("[%s] Restored group offset: %s", self._group.entity_id, restored)

    async def async_will_remove_from_hass(self) -> None:
        """Deregister the offset callback and entity ID."""
        await super().async_will_remove_from_hass()
        self._group.offset_set_callback = None
        self._group.offset_entity_id = None

    def _clean_offset(self, value: float) -> float | None:
        """Validate and clamp an offset value — see `clean_offset()`."""
        return clean_offset(value, self._group.entity_id)

    async def _set_offset(self, value: float) -> None:
        """Set group offset and update both entities for UI consistency."""
        if (clean_val := self._clean_offset(value)) is None:
            return
        _LOGGER.debug("[%s] External offset update: %s", self._group.entity_id, clean_val)
        self._group.run_state = replace(self._group.run_state, group_offset=clean_val)
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
        if (clean_val := self._clean_offset(value)) is None:
            return
        _LOGGER.debug("[%s] Setting group offset to: %s", self._group.entity_id, clean_val)
        new_run_state = replace(self._group.run_state, group_offset=clean_val)

        # Ownership transfer: if a schedule meta-key slot currently controls the offset,
        # release that claim so the slot-end cleanup does not silently reset the user's value.
        if META_KEY_GROUP_OFFSET in new_run_state.config_overrides:
            _LOGGER.debug(
                "[%s] Offset ownership transferred from schedule to user (manual change)",
                self._group.entity_id,
            )
            new_run_state = new_run_state.clear_config_overrides({META_KEY_GROUP_OFFSET})

        self._group.run_state = new_run_state
        self._group.async_defer_or_update_ha_state()

        await async_push_group_offset(self._group)
        self.async_write_ha_state()


