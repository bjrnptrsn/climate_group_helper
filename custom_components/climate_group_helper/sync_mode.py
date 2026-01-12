"""Sync mode logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any, TypeAlias

from .const import (
    CONF_SYNC_ATTRIBUTES,
    CONTROLLABLE_ATTRIBUTES,
    SyncMode,
)
from .state import FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroup

ServiceCall: TypeAlias = dict[str, Any]

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
            self._group.config.get(CONF_SYNC_ATTRIBUTES, CONTROLLABLE_ATTRIBUTES)
        )
        _LOGGER.debug("[%s] SyncModeHandler initialized with mode: %s. FilterState: %s", self._group.entity_id, self._group.sync_mode, self._filter_state)
        self._active_sync_tasks: set[asyncio.Task] = set()

    def resync(self) -> None:
        """Main entry point: detect deviations and enforce/adopt as needed.
        
        Called on every member state update.

        Guards against echoes and applies source-aware sync block.
        
        Handle deviation based on sync mode and sync block state.
        
        In Mirror mode, adopts member changes and propagates to others.
        In Lock mode, reverts members to group target.
        """

        if self._group.sync_mode == SyncMode.STANDARD:
            return

        change_entity_id = self._group.change_state.entity_id or None
        change_dict = self._group.change_state.to_dict() or {}

        if not change_dict:
            _LOGGER.debug("[%s] No changes detected. Ignoring changes.", self._group.entity_id)
            return

        _LOGGER.debug("[%s] Change detected: %s. Source: %s",
            self._group.entity_id,
            self._group.change_state,
            change_entity_id
        )

        # Update group state if sync blocking is not active and we're in mirror mode
        if self._group.sync_mode == SyncMode.MIRROR:
            _LOGGER.debug("[%s] Mirror Mode: Updating Target %s", self._group.entity_id, change_dict)
            # Update the group's target state with the deviations
            self._group.update_target_state(change_dict)
            # Update source tracking when adopting a member change
            self._group.last_service_call_entity = change_entity_id

        # Schedule enforcement
        sync_task = self._group.hass.async_create_background_task(
            self._group.service_call_handler.call_debounced(state=self._filter_state),
            name="climate_group_sync_enforcement"
        )
        self._active_sync_tasks.add(sync_task)
        sync_task.add_done_callback(self._active_sync_tasks.discard)

        _LOGGER.debug("Starting enforcement loop for '%s'", self._group.entity_id)
