"""Sync mode logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING, Any, TypeAlias

from homeassistant.core import Context, State

from .const import (
    SYNC_INTERNAL_CHANGE_TIMEOUT,
    SYNC_MODE_WATCHED_ATTRIBUTES,
    SYNC_SAFETY_BUFFER_SECONDS,
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

    Implements conflict detection and timeout-based capitulation
    to prevent infinite loops with unresponsive devices.
    """

    def __init__(self, group: ClimateGroup, sync_mode: SyncMode):
        """Initialize the sync mode handler."""
        self._group = group
        self._sync_mode = sync_mode
        self._snapshot_attrs: dict[str, Any] = {}
        self._snapshot_states: list[State] | None = None
        self._active_tasks: set[asyncio.Task] = set()

        # Sync conflict tracking
        self._sync_retry_counter: int = 0                            # Attempts made to enforce state
        self._last_sync_attempt: float | None = None                 # Timestamp for fallback timeout
        self._internal_change_start_time: float | None = None        # Timestamp for internal change timeout
        self._reset_delay_seconds = (
            (self._group._retry_attempts * self._group._retry_delay)  # Total retry duration
            + self._group._sync_mode_delay                           # Initial delay before first attempt
            + SYNC_SAFETY_BUFFER_SECONDS                             # Safety buffer for network/processing delays
        )

        _LOGGER.debug("SyncModeHandler initialized for group '%s' with sync_mode: %s", self._group.entity_id, sync_mode)

    @property
    def is_syncing(self) -> bool:
        """Check if any sync tasks are currently active."""
        return bool(self._active_tasks)

    def snapshot_group_state(self):
        """Capture the current group state intelligently based on context.
        
        Priority Logic:
        1. User Actions (via context match): Always accepted immediately.
           Cancels any running enforcement to respect user intent.
        2. Active Syncing: Protects goal state during enforcement loops.
           Prevents snapshot updates that würden interfere with enforcement.
        3. External Changes: Triggers enforcement (LOCK) or adoption (MIRROR).
        
        The context-based detection ensures user actions always take
        precedence, even during active sync enforcement.
        """

        # STANDARD Mode: The group is passive. No snapshot needed.
        if self._sync_mode == SyncMode.STANDARD:
            return

        # Priority 1: User interaction - this becomes the new truth
        if self._is_internal_change():
            _LOGGER.debug("SyncModeHandler: Internal change detected. Resetting tasks.")
            self._cancel_active_tasks()
            # DON'T call self._do_snapshot() here!
            # Snapshot will be made in handle_sync_mode_changes() when states are stable
            return

        # Priority 2: Active syncing - protect the goal state
        if self.is_syncing:
            _LOGGER.debug("SyncModeHandler: Sync tasks active. Skipping snapshot to protect state.")
            return

        # LOCK Mode: External changes are rejected.
        if self._sync_mode == SyncMode.LOCK:
            # Safety mechanism: Accept reality if device refuses commands for too long
            if self._last_sync_attempt and (time.time() - self._last_sync_attempt) > self._reset_delay_seconds:
                _LOGGER.debug("Group '%s': Sync failed for too long (>%ds). Accepting current state to stop loop.", self._group.entity_id, self._reset_delay_seconds)
                self._do_snapshot()
                return

            # Create initial snapshot if none exists (startup)
            if not self._snapshot_attrs:
                self._do_snapshot()

            return

        # MIRROR Mode: External changes are adopted
        self._do_snapshot()

    def handle_sync_mode_changes(self):
        """Orchestrates sync mode actions by checking deviations and starting enforcement.
        
        This method:
        - Checks if any members deviate from the snapshot
        - Starts an enforcement loop if needed
        - Skips if enforcement is already active
        
        Note: If enforcement is already running when new deviations occur,
        they will be handled in the next state update cycle. User actions
        detected via context matching will cancel active enforcement and
        take immediate priority.
        """
        if (
            self._sync_mode == SyncMode.STANDARD
            or self._snapshot_states is None
            or self._group._states is None
        ):
            return

        # Check if this was an internal change
        if self._is_internal_change():
            pending_calls = self._get_service_calls()
            
            if not pending_calls:
                # Perfect sync
                _LOGGER.debug("SyncModeHandler: Internal change complete, all members in sync. Updating snapshot.")
                self._do_snapshot()
                self._internal_change_start_time = None  # Clear timer
            else:
                # Members haven't caught up yet
                if self._internal_change_start_time is None:
                    # Start timer
                    self._internal_change_start_time = time.time()
                    _LOGGER.debug("SyncModeHandler: Internal change in progress, starting timer.")
                elif (time.time() - self._internal_change_start_time) > SYNC_INTERNAL_CHANGE_TIMEOUT:
                    # Timeout - force snapshot
                    out_of_sync_info = []
                    for service_name, kwargs in pending_calls:
                        key = service_name.replace("set_", "")
                        target = kwargs.get(key)
                        out_of_sync_info.append(f"{key}={target}")
                    
                    _LOGGER.warning(
                        "SyncModeHandler: Internal change timeout after %ds. Members not in sync: %s. Forcing snapshot.",
                        SYNC_INTERNAL_CHANGE_TIMEOUT,
                        ", ".join(out_of_sync_info)
                    )
                    self._do_snapshot()
                    self._internal_change_start_time = None
                else:
                    # Still waiting
                    elapsed = time.time() - self._internal_change_start_time
                    _LOGGER.debug("SyncModeHandler: Internal change in progress, waiting... (%.1fs elapsed)", elapsed)
            return

        # Not internal change anymore - clear timer
        if self._internal_change_start_time is not None:
            self._internal_change_start_time = None

        # If a sync task is already active, let it finish.
        if self.is_syncing:
            return

        # Double-check immediately before creating the task to prevent race conditions.
        # This check is crucial since no `await` occurs between `is_syncing` and task creation.
        if self._active_tasks: # Redundant check but safer
            _LOGGER.debug("SyncModeHandler: Race condition prevented. Another task is already active.")
            return

        # Start enforcement only if corrections are needed.
        if not self._get_service_calls():
            return

        _LOGGER.debug("SyncModeHandler for group '%s': Starting enforcement loop.", self._group.entity_id)
        task = self._group.hass.async_create_background_task(
            self._enforce_group_state(),
            name="climate_group_sync_enforcement"
        )
        self._active_tasks.add(task)
        task.add_done_callback(self._active_tasks.discard)

    async def _enforce_group_state(self):
        """Active loop to enforce group state with verification and retries."""
        
        max_attempts = self._group._sync_retry_attempts + 1
        
        for attempt in range(max_attempts):
            self._sync_retry_counter = attempt + 1
            
            # 1. Check what needs to be done.
            pending_calls = self._get_service_calls()
            
            if not pending_calls:
                _LOGGER.debug("SyncModeHandler: All members in sync. Loop finished.")
                self._sync_retry_counter = 0
                return

            _LOGGER.debug("SyncModeHandler: Enforcement Attempt %d/%d. Calls: %s", attempt + 1, max_attempts, len(pending_calls))

            # 2. Execute service calls with retry logic and unique context.
            tasks = []
            for service_name, kwargs in pending_calls:
                exec_func_name = f"execute_{service_name}"
                exec_func = getattr(self._group._service_call_handler, exec_func_name)
                
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

            # 3. Wait for devices to settle.
            delay = self._group._sync_mode_delay
            if delay > 0:
                _LOGGER.debug("SyncModeHandler: Waiting %ss for devices to settle...", delay)
                await asyncio.sleep(delay)

            # 4. Refresh member states to verify current reality.
            new_states = self._group._get_valid_member_states()
            if not new_states:
                _LOGGER.warning(
                    "SyncModeHandler for group '%s': Failed to refresh member states (all unavailable/unknown) "
                    "during enforcement attempt %d/%d. Aborting current enforcement loop to prevent "
                    "working with incomplete data.",
                    self._group.entity_id,
                    attempt + 1,
                    max_attempts,
                )
                self._sync_retry_counter = 0
                return # Abort enforcement if no valid states can be retrieved

        # 5. Capitulation: If enforcement fails after all attempts, update snapshot to current reality.
        _LOGGER.warning(
            "SyncModeHandler for group '%s': Failed to enforce state after %d attempts. "
            "Capitulating to new reality. Deviating members: %s",
            self._group.entity_id,
            max_attempts,
            [s.entity_id for s in self._group._states if self._get_service_calls()]
        )
        self._do_snapshot()
        self._sync_retry_counter = 0

    def _get_service_calls(self) -> list[ServiceCall]:
        """Prepare service calls based on member state deviations and sync mode."""

        # Create map of last known states from snapshot
        last_states_map = {s.entity_id: s for s in self._snapshot_states}

        for state in self._group._states:
            last_state = last_states_map.get(state.entity_id)

            changed_keys = []
            if last_state is None:
                # If previous state is unknown, assume everything might have changed
                changed_keys = list(SYNC_MODE_WATCHED_ATTRIBUTES.keys())
            else:
                # Check specific attributes for changes
                for key in SYNC_MODE_WATCHED_ATTRIBUTES:
                    if self._get_attr_value(last_state, key) != self._get_attr_value(state, key):
                        changed_keys.append(key)

            if not changed_keys:
                continue

            # Changed state found
            _LOGGER.debug("SyncModeHandler for group '%s': Changed member detected: %s. Changed keys: %s", self._group.entity_id, state.entity_id, changed_keys)

            service_calls = {}

            for key in changed_keys:
                target_value = None

                if self._sync_mode == SyncMode.LOCK:
                    # Revert to snapshot value
                    target_value = self._snapshot_attrs.get(key)
                elif self._sync_mode == SyncMode.MIRROR:
                    # Adopt the new member value
                    target_value = self._get_attr_value(state, key)

                if target_value is None:
                    continue

                # Check if the group already has this value to avoid unnecessary calls
                current_value = self._get_group_value(key)
                if current_value == target_value:
                    continue

                _LOGGER.debug("SyncModeHandler: Preparing call for key '%s'. Group: %s -> Target: %s", key, current_value, target_value)

                service_name = f"set_{key}"
                exec_func_name = f"execute_{service_name}"

                if hasattr(self._group._service_call_handler, exec_func_name):
                    service_calls[service_name] = {key: target_value}

                # Start sync conflict timer on first deviation detection
                # Only set once per conflict cycle; subsequent calls extend the existing timer
                if self._last_sync_attempt is None:
                    self._last_sync_attempt = time.time()

            return list(service_calls.items())

        # Everything calm, no more conflicts -> Reset timer
        self._last_sync_attempt = None

        return []

    def _cancel_active_tasks(self):
        """Cancel all currently active sync tasks."""
        if self._active_tasks:
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

    def _do_snapshot(self):
        """Perform the actual snapshotting of attributes and states."""

        # Reset sync timer: A new snapshot means the conflict is resolved
        # (either user action, mirror adoption, timeout, or initial state)  
        self._last_sync_attempt = None

        self._snapshot_attrs = {
            key: self._get_group_value(key)
            for key in SYNC_MODE_WATCHED_ATTRIBUTES
        }
        # Store copies of states to prevent in-place modification impacting the snapshot
        group_states = self._group._states or []
        self._snapshot_states = [State(s.entity_id, s.state, s.attributes.copy()) for s in group_states]
        _LOGGER.debug("SyncModeHandler: Snapshot updated for '%s'.", self._group.entity_id)

    def _get_group_value(self, key: str) -> Any:
        """Get the current value of a watched attribute from the group entity."""
        if key == "temperature":
            return self._group._attr_target_temperature
        return getattr(self._group, f"_attr_{key}", None)

    def _get_attr_value(self, state: State, key: str) -> Any:
        """Get the value of a watched attribute from a member state."""
        attribute = SYNC_MODE_WATCHED_ATTRIBUTES[key]
        if attribute is None:
            return state.state
        return state.attributes.get(attribute)
