"""Sync mode logic for the climate group."""

from __future__ import annotations

import asyncio
from collections import deque
import logging
import time
from typing import TYPE_CHECKING, Any, TypeAlias

from homeassistant.core import Context, State

from .const import (
    CONF_SYNC_ATTRIBUTES,
    SYNC_BLOCK_WINDOW,
    CONTROLLABLE_ATTRIBUTES,
    SyncMode,
    FLOAT_TOLERANCE,
)

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

    Uses "Persistent Target State" - the group's target_state_store is the
    single source of truth for what the desired state should be.
    """

    def __init__(self, group: ClimateGroup):
        """Initialize the sync mode handler."""
        self._group = group
        self._sync_attributes = self._group.config.get(CONF_SYNC_ATTRIBUTES, CONTROLLABLE_ATTRIBUTES)
        self._active_sync_tasks: set[asyncio.Task] = set()
        self._sync_context_history: deque[str] = deque(maxlen=10)

        _LOGGER.debug("SyncModeHandler initialized for '%s' (mode: %s)", self._group.entity_id, self._group.sync_mode)

    @property
    def sync_echo(self) -> bool:
        """Check if the current update is an echo of our own sync command."""
        return (
            self._group.context
            and self._group.context.id in self._sync_context_history
        )

    @property
    def sync_block_remaining(self) -> float:
        """Return the remaining time in the sync block window (seconds)."""
        elapsed = time.time() - self._group.last_service_call_time
        return max(0.0, SYNC_BLOCK_WINDOW - elapsed)

    def resync(self) -> None:
        """Main entry point: detect deviations and enforce/adopt as needed.
        
        Called on every member state update.

        Guards against echoes and applies source-aware sync block.
        
        Handle deviation based on sync mode and sync block state.
        
        In Mirror mode, adopts member changes and propagates to others.
        In Lock mode (or during sync block), reverts members to group target.
        
        The sync block prevents rapid changes from different sources within
        a 5-second window to avoid conflicts during device settling.
        """

        if self._group.sync_mode == SyncMode.STANDARD:
            return

        _LOGGER.debug(
            "[%s] 'resync' called. Context ID: %s",
            self._group.entity_id,
            self._group.context.id if self._group.context else None
        )

        # Lock Mode: Enforce deviations even on echo (Context ID collision protection)
        if self.sync_echo and not self._group.sync_mode == SyncMode.LOCK:
            _LOGGER.debug("[%s] Sync echo detected. Ignoring changes.", self._group.entity_id)
            return

        deviation_entity, deviations_dict = self._find_deviations()

        if not deviations_dict:
            return

        # Sync blocking state
        sync_block_active = self.sync_block_remaining > 0.001

        # Bypass sync blocking if the deviation is from the same entity
        if deviation_entity == self._group.last_service_call_entity:
            _LOGGER.debug(
                "[%s] Same source (%s) - bypassing sync blocking",
                self._group.entity_id,
                deviation_entity
            )
            sync_block_active = False
    
        if sync_block_active:
            _LOGGER.debug(
                "[%s] Sync block active (%.1fs remaining). Ignoring changes.",
                self._group.entity_id, self.sync_block_remaining
            )

        # Update group state if sync blocking is not active and we're in mirror mode
        if not sync_block_active and self._group.sync_mode == SyncMode.MIRROR:
            _LOGGER.debug(
                "[%s] Mirror Mode: Updating Target %s (Source: %s)",
                self._group.entity_id, deviations_dict, deviation_entity
            )
            # Update the group's target state with the deviations
            self._group.update_target_state(deviations_dict)
            # Update source tracking when adopting a member change
            self._group.last_service_call_entity = deviation_entity

        # Schedule enforcement
        sync_context = Context()
        self._sync_context_history.append(sync_context.id)
        
        sync_task = self._group.hass.async_create_background_task(
            self._group.service_call_handler.call_debounced(context=sync_context),
            name="climate_group_sync_enforcement"
        )
        self._active_sync_tasks.add(sync_task)
        sync_task.add_done_callback(self._active_sync_tasks.discard)

        _LOGGER.debug("Starting enforcement loop for '%s' with Context ID: %s", self._group.entity_id, sync_context.id)

    def _find_deviations(self) -> tuple[str | None, dict[str, Any]]:
        """Find first member with deviating attributes.
        
        Returns:
            tuple: (deviation_entity_id, deviations_dict)
        """
        deviations = {}
        deviation_entity = None
        
        for state in self._group.states:
            for key in self._sync_attributes:
                target_value = self._group.target_state_store.get(key)
                member_value = state.state if key == "hvac_mode" else state.attributes.get(key)
                
                # Skip if target not set or values match
                if target_value is None or member_value == target_value:
                    continue
                
                # Float comparison tolerance for temperature and humidity
                if (key == "temperature" or key == "humidity"):
                    if self._group.within_range(target_value, member_value):
                        continue
                
                deviations[key] = member_value
            
            # Found deviations - store the entity ID and break
            if deviations:
                deviation_entity = state.entity_id
                break

        # Log all deviations
        for key, member_value in deviations.items():
            _LOGGER.debug(
                "[%s] Found deviation: %s.%s = %s (Target: %s)",
                self._group.entity_id, deviation_entity, key, member_value, self._group.target_state_store.get(key)
            )
        
        return deviation_entity, deviations
