"""Sync mode logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any, TypeAlias

from homeassistant.core import Context, State

from .const import (
    SYNC_MODE_WATCHED_ATTRIBUTES,
    SyncMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

ServiceCall: TypeAlias = tuple[str, dict[str, Any]]

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
        self._snapshot_attrs: dict[str, Any] = {}
        self._snapshot_states: list[State] | None = None
        self._active_tasks: set[asyncio.Task] = set()

        _LOGGER.debug("SyncModeHandler initialized for group '%s' with sync_mode: %s", self._group.entity_id, sync_mode)

    @property
    def is_syncing(self) -> bool:
        """Check if any sync tasks are currently active."""
        return bool(self._active_tasks)

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
        
        if self._is_internal_change():
            _LOGGER.debug("Internal change detected. Clearing snapshot.")
            self._cancel_active_tasks()
            self._clear_snapshot()
            return
        
        if self.is_syncing:
            return
        
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

        _LOGGER.debug("SyncModeHandler for group '%s': Starting enforcement loop.", self._group.entity_id)
        task = self._group.hass.async_create_background_task(
            self._enforce_group_state(),
            name="climate_group_sync_enforcement"
        )
        self._active_tasks.add(task)
        task.add_done_callback(self._active_tasks.discard)

    async def _enforce_group_state(self):
        """Enforce the group state onto deviating members with retries.

        This background task runs a loop to correct member states that do not
        match the snapshot.

        Logic:
        1. Loop for `sync_retry_attempts`:
           a. Check for deviations. If none, the sync is successful.
           b. Execute correction service calls for all deviating members.
              - This uses the "Context Trick": Each call gets a new `Context()`
                to distinguish these system-actions from user-actions, which
                is the core mechanism for sync stability.
           c. Wait for `sync_mode_delay` to allow devices to update.
        2. Capitulation: If deviations persist after all attempts, clear the
           snapshot to prevent infinite loops and accept the new state.
        """
        
        max_attempts = self._group._sync_retry_attempts + 1
        
        for attempt in range(max_attempts):
            pending_calls = self._get_service_calls()
            
            if not pending_calls:
                _LOGGER.debug("SyncModeHandler: All members in sync. Enforcement complete.")
                return

            _LOGGER.debug("SyncModeHandler: Enforcement Attempt %d/%d. Calls pending: %s", attempt + 1, max_attempts, len(pending_calls))

            # Create a task for each correction and run them all together.
            tasks = []
            for service_name, kwargs in pending_calls:
                exec_func = getattr(self._group._service_call_handler, f"execute_{service_name}")
                
                tasks.append(
                    self._group._service_call_handler.execute_with_retry(
                        exec_func,
                        service_name,
                        context=Context(),
                        **kwargs
                    )
                )
            if tasks:
                await asyncio.gather(*tasks)

            # Wait for devices to process
            if (delay := self._group._sync_mode_delay) > 0:
                _LOGGER.debug("SyncModeHandler: Waiting %ss for devices to settle...", delay)
                await asyncio.sleep(delay)

            # Verify states
            if not self._group._get_valid_member_states():
                _LOGGER.debug("Failed to refresh member states. Aborting enforcement.")
                return

        # Capitulation after max attempts
        _LOGGER.debug("Failed to enforce state after %d attempts. Accepting new reality.", max_attempts)
        self._clear_snapshot()

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
                # If previous state is unknown, assume everything might have changed
                changed_keys = list(SYNC_MODE_WATCHED_ATTRIBUTES.keys())
            else:
                changed_keys = [
                    key for key in SYNC_MODE_WATCHED_ATTRIBUTES
                    if self._get_attr_value(last_state, key) != self._get_attr_value(state, key)
                ]

            # If no changes, continue to the next entity
            if not changed_keys:
                continue

            # Changed state found
            _LOGGER.debug("SyncModeHandler for group '%s': Changed member detected: %s. Changed keys: %s", self._group.entity_id, state.entity_id, changed_keys)

            # Build correction service calls
            service_calls = {}

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

                _LOGGER.debug("SyncModeHandler: Preparing call for key '%s'. Group: %s -> Target: %s", key, current_value, target_value)
                service_name = f"set_{key}"
                if hasattr(self._group._service_call_handler, f"execute_{service_name}"):
                    service_calls[service_name] = {key: target_value}

            if service_calls:
                return list(service_calls.items())

        return []

    def _cancel_active_tasks(self):
        """Cancel all currently active sync tasks."""
        if not self._active_tasks:
            return
        _LOGGER.debug("SyncModeHandler for group '%s': Cancelling %d active tasks due to internal change/reset.", self._group.entity_id, len(self._active_tasks))
        for task in self._active_tasks:
            task.cancel()
        self._active_tasks.clear()

    def _is_internal_change(self) -> bool:
        """Check if the current update context indicates an internal change."""
        return (
            self._group._last_group_context
            and self._group._context
            and self._group._context.id == self._group._last_group_context.id
        )

    def _make_snapshot(self):
        """Create snapshot of current group state."""
        self._snapshot_attrs = {
            key: self._get_group_value(key)
            for key in SYNC_MODE_WATCHED_ATTRIBUTES
        }
        group_states = self._group._states or []
        self._snapshot_states = [State(s.entity_id, s.state, s.attributes.copy()) for s in group_states]
        _LOGGER.debug("SyncModeHandler: Snapshot created for '%s'.", self._group.entity_id)

    def _clear_snapshot(self):
        """Clear snapshot (no active conflict)."""
        if self._snapshot_states is not None or self._snapshot_attrs:
            _LOGGER.debug("Snapshot cleared.")
        self._snapshot_attrs = {}
        self._snapshot_states = None

    def _get_group_value(self, key: str) -> Any:
        """Get current value of watched attribute from group."""
        if key == "temperature":
            return self._group._attr_target_temperature
        return getattr(self._group, f"_attr_{key}", None)

    def _get_attr_value(self, state: State, key: str) -> Any:
        """Get value of watched attribute from member state."""
        attribute = SYNC_MODE_WATCHED_ATTRIBUTES[key]
        if attribute is None:
            return state.state
        return state.attributes.get(attribute)