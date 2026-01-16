"""Sync mode logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING

from homeassistant.components.climate import HVACMode

from .const import (
    CONF_SYNC_ATTRS,
    STARTUP_BLOCK_DELAY,
    SYNC_TARGET_ATTRS,
    SyncMode,
)
from .state import FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class SyncModeHandler:
    """Synchronizes group state with members using Lock or Mirror mode.

    Sync Modes:
    - STANDARD: No enforcement, passive aggregation only
    - LOCK: Reverts member deviations to group target
    - MIRROR: Adopts member changes and propagates to all members

    Uses "Persistent Target State" - the group's target_state is the
    single source of truth for what the desired state should be.
    """

    def __init__(self, group: ClimateGroup):
        """Initialize the sync mode handler."""
        self._group = group
        self._filter_state = FilterState.from_keys(
            self._group.config.get(CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS)
        )
        _LOGGER.debug("[%s] Initialize sync mode: %s with FilterState: %s", self._group.entity_id, self._group.sync_mode, self._filter_state)
        self._active_sync_tasks: set[asyncio.Task] = set()

    def resync(self) -> None:
        """Handle changes based on sync mode."""

        if self._group.sync_mode == SyncMode.STANDARD:
            return
        
        # Block sync during startup phase
        if self._group.startup_time and (time.time() - self._group.startup_time) < STARTUP_BLOCK_DELAY:
            _LOGGER.debug("[%s] Startup phase, sync blocked", self._group.entity_id)
            return

        # Block sync during blocking mode
        if self._group.blocking_mode:
            _LOGGER.debug("[%s] Blocking mode active, sync blocked", self._group.entity_id)
            return

        change_entity_id = self._group.change_state.entity_id or None
        change_dict = self._group.change_state.attributes()

        if not change_dict:
            _LOGGER.debug("[%s] No changes detected", self._group.entity_id)
            return

        # Suppress echoes from window_control and schedule service calls
        if self._group.event and self._group.event.context.id in ("window_control", "schedule"):
            _LOGGER.debug("[%s] Ignoring '%s' echo: %s", self._group.entity_id, self._group.event.context.id, change_dict)
            return

        _LOGGER.debug("[%s] Change detected: %s (Source: %s)", self._group.entity_id, change_dict, change_entity_id)

        # Filter out setpoint values when HVACMode is off (meaningless values like frost protection)
        if self._group.target_state.hvac_mode == HVACMode.OFF:
            setpoint_attrs = {"temperature", "target_temp_low", "target_temp_high", "humidity"}
            change_dict = {key: value for key, value in change_dict.items() if key not in setpoint_attrs}
            if not change_dict:
                _LOGGER.debug("[%s] HVACMode is off, ignoring setpoint changes", self._group.entity_id)
                return

        # Mirror mode: update target_state with filtered changes
        if self._group.sync_mode == SyncMode.MIRROR:
            if filtered_dict := {
                key: value for key, value in change_dict.items() 
                if self._filter_state.to_dict().get(key)
            }:
                self._group.update_target_state("sync_mode", **filtered_dict)
                _LOGGER.debug("[%s] Updated TargetState: %s", self._group.entity_id, self._group.target_state)
            else:
                _LOGGER.debug("[%s] Changes filtered out. TargetState not updated", self._group.entity_id)

        # Mirror/lock mode: enforce group target
        sync_task = self._group.hass.async_create_background_task(
            self._group.service_call_handler.call_debounced(filter_state=self._filter_state),
            name="climate_group_sync_enforcement"
        )
        self._active_sync_tasks.add(sync_task)
        sync_task.add_done_callback(self._active_sync_tasks.discard)

        _LOGGER.debug("[%s] Starting enforcement loop", self._group.entity_id)
