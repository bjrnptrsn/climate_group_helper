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
        _LOGGER.debug("[%s] Initialize sync mode: %s with FilterState: %s", self._group.entity_id, self._group.sync_mode, self._filter_state)
        self._active_sync_tasks: set[asyncio.Task] = set()

    def resync(self) -> None:
        """Handle changes based on sync mode."""

        if self._group.sync_mode == SyncMode.STANDARD:
            return

        change_entity_id = self._group.change_state.entity_id or None
        change_dict = self._group.change_state.attributes()

        if not change_dict:
            _LOGGER.debug("[%s] No changes detected. Ignoring changes.", self._group.entity_id)
            return

        _LOGGER.debug("[%s] Change detected: %s (Source: %s)",
            self._group.entity_id,
            change_dict,
            change_entity_id
        )

        # Mirror mode: update group target
        if self._group.sync_mode == SyncMode.MIRROR:
            _LOGGER.debug("[%s] Mirror Mode: Updating TargetState.", self._group.entity_id)
            # Update the group's target state with the deviations
            self._group.target_state = self._group.target_state.update(**change_dict)
            # Update source tracking when adopting a member change
            self._group.last_service_call_entity = change_entity_id

        # Mirror/lock mode: enforce group target
        sync_task = self._group.hass.async_create_background_task(
            self._group.service_call_handler.call_debounced(filter_state=self._filter_state),
            name="climate_group_sync_enforcement"
        )
        self._active_sync_tasks.add(sync_task)
        sync_task.add_done_callback(self._active_sync_tasks.discard)

        _LOGGER.debug("[%s] Starting enforcement loop.", self._group.entity_id)
