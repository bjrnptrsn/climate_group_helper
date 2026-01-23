"""Sync mode logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING

from homeassistant.components.climate import HVACMode

from .const import (
    CONF_SYNC_ATTRS,
    CONF_IGNORE_OFF_MEMBERS,
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

    @property
    def state_manager(self):
        """Return the state manager for sync mode operations."""
        return self._group.sync_mode_state_manager
    
    @property
    def call_handler(self):
        """Return the call handler for sync mode operations."""
        return self._group.sync_mode_call_handler
    
    @property
    def target_state(self):
        """Return the current target state (from central source)."""
        return self.state_manager.target_state

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

        # --- Origin Event Strategy ---
        # Analyze why the change happened by inspecting causal history.

        event = self._group.event
        # new_state = event.data.get("new_state")  <-- Not used directly, we use change_dict

        # Safe access to origin event
        origin_event = None
        if event.context and hasattr(event.context, "origin_event"):
             origin_event = event.context.origin_event

        change_entity_id = self._group.change_state.entity_id or None
        change_dict = self._group.change_state.attributes()

        if not change_dict:
            _LOGGER.debug("[%s] No changes detected", self._group.entity_id)
            return

        _LOGGER.debug(
            "[%s] Change detected: %s. Entity ID: %s, Context Parent ID: %s, Origin Parent ID: %s",
            self._group.entity_id, change_dict, change_entity_id, event.context.parent_id, origin_event.context.parent_id
        )

        # Suppress echoes from window_control
        if self._group.event and self._group.event.context.id == "window_control":
            _LOGGER.debug("[%s] Ignoring '%s' echo: %s", self._group.entity_id, self._group.event.context.id, change_dict)
            return

        # --- Deep Origin Analysis ---
        # Did we cause this change via a service call?
        if origin_event and origin_event.event_type == "call_service" and origin_event.data.get("domain") == "climate":
            # Verify that WE originated this call.
            # External automations or user actions causing service calls should NOT be treated as our echoes.
            # We filter by the context IDs we assign in service_call.py.
            trusted_context_ids = {"service_call", "group", "sync_mode", "schedule"}
            
            if origin_event.context.id in trusted_context_ids:
                service_data = origin_event.data.get("service_data", {})
    
                accepted_changes = {}
                
                # Parent ID format: "Timestamp|MasterEntityID"
                parent_id = origin_event.context.parent_id or ""
                master_entity_id = ""
                if "|" in parent_id:
                    try:
                        _, master_entity_id = parent_id.split("|", 1)
                    except ValueError:
                        pass

                for attr, new_value in change_dict.items():
                    # 1. Was this attribute part of the order?
                    if attr not in service_data:
                        # e.g. We ordered Preset "Eco", but device changed Temp.
                        # This is a SIDE EFFECT. We basically trust the device's reaction.
                        
                        # --- ORIGIN SENDER PROTECTION ("Sender Wins") ---
                        # We only accept side effects (implied state changes) from the entity that
                        # triggered the original command sequence (the "Master").
                        # Side effects from other entities (passive receivers) are likely old state echoes
                        # or race conditions and should not overwrite the Master's intent.
                        
                        # If we have a known master, strictly enforce that only the master can dictate side effects.
                        if master_entity_id and change_entity_id != master_entity_id:
                            _LOGGER.debug(
                                "[%s] Side Effect Ignored: Reporting Entity '%s' != Master Entity '%s' (Attr: %s=%s)", 
                                self._group.entity_id, change_entity_id, master_entity_id, attr, new_value
                            )
                            continue
                        
                        _LOGGER.debug(
                            "[%s] Side Effect Accepted: '%s'=%s (Reporter: %s, Master: %s)", 
                            self._group.entity_id, attr, new_value, change_entity_id, master_entity_id or "Unknown"
                        )
                        accepted_changes[attr] = new_value

                    else:
                        # 2. It was ordered. Does it match?
                        ordered_val = service_data[attr]
                        # Basic equality check (can be improved with tolerance for floats if needed)
                        if ordered_val != new_value:
                            # e.g. We ordered 19.5, but got 22.0.
                            # Since this is a reaction to OUR command (context match), 
                            # a mismatch implies an intermediate state or glitch.
                            # We trust our Order over the Device's immediate incorrect reaction.
                            _LOGGER.debug(
                                "[%s] Dirty Echo Ignored: '%s' (val=%s) != Ordered (val=%s). Waiting for settling.", 
                                self._group.entity_id, attr, new_value, ordered_val
                            )
                            continue

                        # If values match (Clean Echo), we do nothing (already in sync).
    
                if accepted_changes:
                    # Side Effects are implicitly trusted. Adopt them consistently.
                    _LOGGER.debug("[%s] Processing Side Effect -> Updating TargetState (implicit) with %s", self._group.entity_id, accepted_changes)
                    self.state_manager.update(entity_id=change_entity_id, **accepted_changes)

    
                return

        # Fallback for "Fresh" Events (No useful origin context)
        # Proceed with standard sync logic below...

        _LOGGER.debug("[%s] Change detected: %s (Source: %s)", self._group.entity_id, change_dict, change_entity_id)

        # Filter out setpoint values when HVACMode is off (meaningless values like frost protection)
        # Allow them if we are currently switching out of off mode.
        is_switching_on = "hvac_mode" in change_dict and change_dict["hvac_mode"] != HVACMode.OFF
        
        if self.target_state.hvac_mode == HVACMode.OFF and not is_switching_on:
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
                self.state_manager.update(entity_id=change_entity_id, **filtered_dict)
                _LOGGER.debug("[%s] Updated TargetState: %s", self._group.entity_id, self.target_state)
            else:
                _LOGGER.debug("[%s] Changes filtered out. TargetState not updated", self._group.entity_id)

        # Lock mode: Normally ignores member changes.
        # EXCEPTION: "Last Man Standing" logic (Partial Sync enabled + OFF command).
        # Should we allow an "OFF" command to update the Group target even in Lock mode?
        elif (
            self._group.sync_mode == SyncMode.LOCK
            and self._group.config.get(CONF_IGNORE_OFF_MEMBERS)
            and change_dict.get("hvac_mode") == HVACMode.OFF
        ):
            # Attempt to update target state (will strictly return False if other members are ON)
            # If this returns True, it means we ARE the last man standing, and the group goes OFF.
            if self.state_manager.update(entity_id=change_entity_id, hvac_mode=HVACMode.OFF):
                 _LOGGER.debug("[%s] LOCK Mode: Accepted 'Last Man Standing' OFF command from %s", self._group.entity_id, change_entity_id)

        # Mirror/lock mode: enforce group target via self.call_handler
        sync_task = self._group.hass.async_create_background_task(
            self.call_handler.call_debounced(),
            name="climate_group_sync_enforcement"
        )
        self._active_sync_tasks.add(sync_task)
        sync_task.add_done_callback(self._active_sync_tasks.discard)

        _LOGGER.debug("[%s] Starting enforcement loop", self._group.entity_id)
