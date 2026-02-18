"""Sync mode logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING

from homeassistant.components.climate import HVACMode

from .const import (
    CONF_IGNORE_OFF_MEMBERS,
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
        _LOGGER.debug(
            "[%s] Initialize sync mode: %s with FilterState: %s",
            self._group.entity_id,
            self._group.sync_mode,
            self._filter_state,
        )
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

        # Block during startup to prevent initial state flood from overwriting target_state.
        if (
            self._group.startup_time
            and (time.time() - self._group.startup_time) < STARTUP_BLOCK_DELAY
        ):
            _LOGGER.debug("[%s] Startup phase, sync blocked", self._group.entity_id)
            return

        event = self._group.event
        origin_event = getattr(event.context, "origin_event", None)
        change_entity_id = self._group.change_state.entity_id or None
        change_dict = self._group.change_state.attributes()

        if not change_dict:
            return

        # Suppress echoes from window_control context
        if event.context.id == "window_control":
            _LOGGER.debug("[%s] Ignoring window_control echo", self._group.entity_id)
            return

        # Deep Origin Analysis: Did we cause this change?
        if self._is_own_echo(origin_event):
            accepted = self._filter_echo_changes(origin_event, change_dict, change_entity_id)
            if accepted:
                _LOGGER.debug("[%s] Adopting side effects: %s", self._group.entity_id, accepted)
                self.state_manager.update(entity_id=change_entity_id, **accepted)
            return

        # --- Fresh Event (external change) ---
        _LOGGER.debug("[%s] External change: %s from %s", self._group.entity_id, change_dict, change_entity_id)

        # Filter out setpoint values when HVAC is OFF (meaningless frost protection values)
        is_switching_on = "hvac_mode" in change_dict and change_dict["hvac_mode"] != HVACMode.OFF
        if self.target_state.hvac_mode == HVACMode.OFF and not is_switching_on:
            setpoint_attrs = {"temperature", "target_temp_low", "target_temp_high", "humidity"}
            change_dict = {key: value for key, value in change_dict.items() if key not in setpoint_attrs}
            if not change_dict:
                _LOGGER.debug("[%s] Ignoring setpoint changes while OFF", self._group.entity_id)
                return

        # Mirror mode: adopt filtered changes into target_state
        if self._group.sync_mode == SyncMode.MIRROR:
            if filtered := {key: value for key, value in change_dict.items() if self._filter_state.to_dict().get(key)}:
                self.state_manager.update(entity_id=change_entity_id, **filtered)
                _LOGGER.debug("[%s] TargetState updated: %s", self._group.entity_id, self.target_state)

        # Lock mode: only accept "Last Man Standing" OFF (Partial Sync)
        elif (
            self._group.sync_mode == SyncMode.LOCK
            and self._group.config.get(CONF_IGNORE_OFF_MEMBERS)
            and change_dict.get("hvac_mode") == HVACMode.OFF
        ):
            if self.state_manager.update(entity_id=change_entity_id, hvac_mode=HVACMode.OFF):
                _LOGGER.debug("[%s] Last Man Standing: accepted OFF from %s", self._group.entity_id, change_entity_id)

        # Master/Lock mode: master adopts (MIRROR), non-master reverts (LOCK)
        elif self._group.sync_mode == SyncMode.MASTER_LOCK:
            master_id = self._group._master_entity_id
            if master_id and change_entity_id == master_id:
                if filtered := {key: value for key, value in change_dict.items() if self._filter_state.to_dict().get(key)}:
                    self.state_manager.update(entity_id=change_entity_id, **filtered)
                    _LOGGER.debug("[%s] Master entity change adopted: %s", self._group.entity_id, filtered)
            # Non-master changes are enforced (reverted) via call_debounced below

        # Enforce target state on all members (skip during blocking mode)
        if not self._group.blocking_mode:
            sync_task = self._group.hass.async_create_background_task(
                self.call_handler.call_debounced(), name="climate_group_sync_enforcement"
            )
            self._active_sync_tasks.add(sync_task)
            sync_task.add_done_callback(self._active_sync_tasks.discard)
        else:
            _LOGGER.debug("[%s] Enforcement skipped (blocking mode)", self._group.entity_id)

    # --- Echo Detection Helpers ---

    def _is_own_echo(self, origin_event) -> bool:
        """Check if the state change was caused by one of our own service calls."""
        if not origin_event:
            return False
        if origin_event.event_type != "call_service" or origin_event.data.get("domain") != "climate":
            return False
        trusted_ids = {"service_call", "group", "sync_mode", "schedule"}
        return origin_event.context.id in trusted_ids

    @staticmethod
    def _extract_origin_entity(origin_event) -> str:
        """Extract origin entity from parent_id (format: 'entity_id|timestamp')."""
        parent_id = origin_event.context.parent_id or ""
        if "|" in parent_id:
            try:
                origin, _ = parent_id.split("|", 1)
                return origin
            except ValueError:
                pass
        return ""

    def _filter_echo_changes(self, origin_event, change_dict: dict, change_entity_id: str | None) -> dict:
        """Filter echo changes, returning only accepted side effects.

        - Ordered attrs that match: Clean Echo -> ignored (already in sync)
        - Ordered attrs that differ: Dirty Echo -> ignored ("Order Wins")
        - Unordered attrs (side effects): Accepted only from origin entity ("Sender Wins")
        """
        service_data = origin_event.data.get("service_data", {})
        origin = self._extract_origin_entity(origin_event)
        accepted = {}

        for attr, new_value in change_dict.items():
            if attr not in service_data:
                # Side effect: only accept from origin entity ("Sender Wins")
                if origin and change_entity_id != origin:
                    _LOGGER.debug("[%s] Side effect rejected: %s != origin %s", self._group.entity_id, change_entity_id, origin)
                    continue
                accepted[attr] = new_value
            else:
                # Ordered attr: ignore if value doesn't match ("Order Wins" / Dirty Echo)
                if service_data[attr] != new_value:
                    _LOGGER.debug("[%s] Dirty echo ignored: %s=%s (ordered %s)", self._group.entity_id, attr, new_value, service_data[attr])

        return accepted

