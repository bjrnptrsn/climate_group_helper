"""Sync mode logic for the climate group."""

from __future__ import annotations

import asyncio
from collections import deque
import logging
from typing import TYPE_CHECKING, Any, TypeAlias

from homeassistant.core import Context, State

from .const import (
    CONF_SYNC_ATTRIBUTES,
    SYNCABLE_ATTRIBUTES,
    SyncMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

ServiceCall: TypeAlias = dict[str, Any]

_LOGGER = logging.getLogger(__name__)


class SyncModeHandler:
    """Manages synchronization behavior between group and members.

    Handles three sync modes:
    - STANDARD: Passive aggregation only
    - LOCK: Enforces group state, reverts manual changes
    - MIRROR: Propagates manual changes to all members

    Implements "Snapshot-on-Demand" strategy:
    - Snapshots are only created when an external change is detected
    - Internal changes (group actions) clear any existing snapshot
    - This eliminates the need for complex timeout logic
    """

    def __init__(self, group: ClimateGroup, sync_mode: SyncMode):
        """Initialize the sync mode handler."""
        self._group = group
        self._sync_mode = sync_mode
        # Load enabled attributes (default to ALL for backward compatibility)
        self._enabled_sync_attributes = self._group._config.get(CONF_SYNC_ATTRIBUTES, SYNCABLE_ATTRIBUTES)

        self._snapshot_attrs: dict[str, Any] = {}
        self._snapshot_states: list[State] | None = None
        self._active_sync_tasks: set[asyncio.Task] = set()
        # History buffer for sync context IDs (shift register) to handle race conditions
        self._sync_context_history: deque[str] = deque(maxlen=10)

        _LOGGER.debug("SyncModeHandler initialized for group '%s' with sync_mode: %s", self._group.entity_id, sync_mode)

    @property
    def is_syncing(self) -> bool:
        """Check if any sync tasks are currently active."""
        return bool(self._active_sync_tasks)

    def snapshot_group_state(self):
        """Manage the state snapshot based on the origin of a state change.

        This is the entry point for the sync logic. It decides whether to create,
        clear, or preserve a snapshot, which is the basis for sync enforcement.

        Logic:
        1. Standard mode: No sync behavior
        2. Internal change: Cancel enforcement, clear snapshot
        3. Active syncing: Preserve snapshot (the "Truth")
        4. External change: Create/update snapshot
        """

        if self._sync_mode == SyncMode.STANDARD:
            return

        _LOGGER.debug(
            "'snapshot_group_state' called. Current Context ID: %s | History: %s | Last Group Context ID: %s | is_syncing: %s",
            self._group._context.id if self._group._context else None,
            list(self._sync_context_history),
            self._group._last_group_context.id if self._group._last_group_context else None,
            self.is_syncing,
        )

        if self._is_internal_change():
            _LOGGER.debug("Internal change detected. Clearing snapshot.")
            self._cancel_sync_tasks()
            self._clear_snapshot()
            return

        if self._is_sync_echo():
            _LOGGER.debug("Sync echo detected. Ignoring change.")
            return

        if self.is_syncing:
            _LOGGER.debug("Already syncing. Preserving snapshot.")
            return

        _LOGGER.debug("External change detected. Creating snapshot...")
        self._make_snapshot()

    def handle_sync_mode_changes(self):
        """Check for deviations and start enforcement if necessary.

        This method is called after a state update to check if member states
        have deviated from the snapshot.

        Logic:
        1. Pre-check: Abort if sync mode is 'standard' or no snapshot exists.
        2. Active Sync Check: Abort if an enforcement task is already running.
        3. Detect Deviations: Determine necessary service calls to correct members.
        4. No Deviations: If all members are in sync, clear the snapshot and exit.
        5. Start Enforcement: If deviations are found, create a background task to apply corrections.
        """

        if (
            self._sync_mode == SyncMode.STANDARD
            or self._snapshot_states is None
            or self._group._states is None
        ):
            return

        if self.is_syncing:
            return

        pending_calls = self._get_service_calls()

        if not pending_calls:
            self._clear_snapshot()
            return

        sync_context = Context()
        self._sync_context_history.append(sync_context.id)  # Add to history buffer

        sync_task = self._group.hass.async_create_background_task(
            self._enforce_group_state(sync_context), name="climate_group_sync_enforcement"
        )
        self._active_sync_tasks.add(sync_task)
        sync_task.add_done_callback(self._active_sync_tasks.discard)

        _LOGGER.debug("Starting enforcement loop for '%s' with Context ID: %s", self._group.entity_id, sync_context.id)

    async def _enforce_group_state(self, sync_context: Context):
        """Enforce the group state onto deviating members.

        This background task corrects member states that do not match the snapshot.

        Crucially, it passes a NEW System Context to 'call_debounced'. This:
        1. Ensures the correction is treated as a Sync Action (Internal)
        2. Allows the Debouncer to coalesce rapid corrections without overwriting
           the User Action context.
        """
        pending_calls = self._get_service_calls()

        if not pending_calls:
            _LOGGER.debug("Enforcement for '%s' complete. All members in sync.", self._group.entity_id)
            return

        service_call_tasks = []
        for kwargs in pending_calls:
            key = next(iter(kwargs))
            service_name = f"set_{key}"
            exec_func = getattr(self._group._service_call_handler, f"execute_{service_name}")

            _LOGGER.debug("Enforcement for '%s': Set %s to %s", self._group.entity_id, key, kwargs[key])

            # Dispatch via call_debounced using a FRESH System Context.
            # This triggers the standard retry/debounce logic of the group.
            service_call_tasks.append(
                self._group._service_call_handler.call_debounced(
                    service_name,
                    exec_func,
                    context=sync_context,  # <--- CRITICAL: System Context
                    **kwargs,
                )
            )

        if service_call_tasks:
            await asyncio.gather(*service_call_tasks)

        # We do NOT clear the snapshot here. The snapshot remains valid until
        # all members report the correct state (handled in handle_sync_mode_changes)
        # or an Internal Change clears it.

    def _get_service_calls(self) -> list[ServiceCall]:
        """Determine necessary service calls by comparing current states to the snapshot.

        This method iterates through member states, detects deviations from the
        snapshot, and generates a list of service calls to correct them based
        on the active sync mode.

        - In 'LOCK' mode, it generates calls to revert the member's state to the snapshot.
        - In 'MIRROR' mode, it generates calls to apply the member's changed state
          to the rest of the group.
        """

        # Create map of last known states from snapshot
        last_states_map = {s.entity_id: s for s in self._snapshot_states}

        for state in self._group._states:
            last_state = last_states_map.get(state.entity_id)

            # Determine changed attributes
            if last_state is None:
                # If previous state is unknown, assume everything enabled might have changed
                changed_keys = self._enabled_sync_attributes
            else:
                changed_keys = [
                    key for key in self._enabled_sync_attributes
                    if self._get_attr_value(last_state, key) != self._get_attr_value(state, key)
                ]

            # If no changes, continue to the next entity
            if not changed_keys:
                continue

            # Log detailed member change information for diagnostics
            for key in changed_keys:
                old_val = self._get_attr_value(last_state, key) if last_state else "<unknown>"
                new_val = self._get_attr_value(state, key)
                _LOGGER.debug(
                    "Member '%s' deviation detected: %s changed from '%s' to '%s'",
                    state.entity_id, key, old_val, new_val,
                )

            service_calls = []

            for key in changed_keys:
                if self._sync_mode == SyncMode.LOCK:
                    target_value = self._snapshot_attrs.get(key)
                elif self._sync_mode == SyncMode.MIRROR:
                    target_value = self._get_attr_value(state, key)
                else:
                    continue

                if target_value is None:
                    continue

                current_value = self._get_group_value(key)
                if current_value == target_value:
                    continue

                if hasattr(self._group._service_call_handler, f"execute_set_{key}"):
                    service_calls.append({key: target_value})

            if service_calls:
                return service_calls

        return []

    def _is_internal_change(self) -> bool:
        """Check if the current update context indicates an internal change."""
        return (
            self._group._last_group_context
            and self._group._context
            and self._group._context.id == self._group._last_group_context.id
        )

    def _is_sync_echo(self) -> bool:
        """Check if the current update is an echo of our own sync command."""
        return (
            self._group._context
            and self._group._context.id in self._sync_context_history
        )

    def _make_snapshot(self):
        """Create snapshot of current group state."""
        self._snapshot_attrs = {key: self._get_group_value(key) for key in SYNCABLE_ATTRIBUTES}
        group_states = self._group._states or []
        self._snapshot_states = [State(s.entity_id, s.state, s.attributes.copy()) for s in group_states]
        _LOGGER.debug("Snapshot created for '%s'.", self._group.entity_id)

    def _clear_snapshot(self):
        """Clear snapshot (no active conflict)."""
        if self._snapshot_states is not None or self._snapshot_attrs:
            _LOGGER.debug("Snapshot cleared for '%s'.", self._group.entity_id)
        self._snapshot_attrs = {}
        self._snapshot_states = None

    def _cancel_sync_tasks(self):
        """Cancel all currently active sync tasks."""
        if not self._active_sync_tasks:
            return
        _LOGGER.debug("Canceling sync tasks for '%s'", self._group.entity_id)
        for task in self._active_sync_tasks:
            task.cancel()
        self._active_sync_tasks.clear()

    def _get_group_value(self, key: str) -> Any:
        """Get current value of watched attribute from group."""
        if key == "temperature":
            return self._group._attr_target_temperature
        if key == "hvac_mode":
            # Use target HVAC mode for sync, not the strategy-calculated mode
            # Fallback to calculated mode if no explicit target was set
            return self._group._target_hvac_mode or self._group._attr_hvac_mode
        if key == "humidity":
            return self._group._attr_target_humidity
        if key == "target_temp_high":
            return self._group._attr_target_temperature_high
        if key == "target_temp_low":
            return self._group._attr_target_temperature_low

        return getattr(self._group, f"_attr_{key}", None)

    def _get_attr_value(self, state: State, key: str) -> Any:
        """Get value of watched attribute from member state."""
        if key == "hvac_mode":
            return state.state
        return state.attributes.get(key)
