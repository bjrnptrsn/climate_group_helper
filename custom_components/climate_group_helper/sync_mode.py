"""Sync mode logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import fields
from typing import TYPE_CHECKING, Any

from homeassistant.core import Event
from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN

from .const import (
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_SYNC_ATTRS,
    CONF_SYNC_MODE,
    META_KEY_SYNC_MODE,
    META_KEY_SYNC_ATTRS,
    STARTUP_BLOCK_DELAY,
    SYNC_TARGET_ATTRS,
    SyncMode,
)
from .state import ClimateState, FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .state import SyncModeStateManager, TargetState
    from .service_call import SyncCallHandler

_TRUSTED_CONTEXT_IDS = frozenset(
    {
        "service_call",
        "group",
        "sync_mode",
        "window_control",
        "presence",
        "schedule",
        "switch",
        "switch_enforce",
        "override",
        "isolation",
    }
)

_LOGGER = logging.getLogger(__name__)


class SyncModeHandler:
    """Synchronizes group state with members using Lock or Mirror mode.

    Sync Modes:
    - DISABLED: No enforcement, passive aggregation only
    - LOCK: Reverts member deviations to group target
    - MIRROR: Adopts member changes and propagates to all members
    - MASTER_LOCK: Only the master entity can change the group target

    Uses "Persistent Target State" — the group's target_state is the
    single source of truth for what the desired state should be.
    """

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the sync mode handler."""
        self._group = group
        self._hass = group.hass
        self._sync_mode = SyncMode(
            self._group.config.get(CONF_SYNC_MODE, SyncMode.DISABLED)
        ) if self._group.advanced_mode else SyncMode.DISABLED
        self._filter_state = FilterState.from_keys(
            self._group.config.get(CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS)
        )
        _LOGGER.debug(
            "[%s] Initialize sync mode: %s with FilterState: %s",
            self._group.entity_id,
            self._sync_mode,
            self._filter_state,
        )
        self._active_sync_tasks: set[asyncio.Task[Any]] = set()

    @property
    def sync_mode(self) -> SyncMode:
        """Return the effective sync mode (respecting schedule overrides)."""
        if META_KEY_SYNC_MODE in self._group.run_state.config_overrides:
            return SyncMode(self._group.run_state.config_overrides[META_KEY_SYNC_MODE])
        return self._sync_mode

    @property
    def state_manager(self) -> SyncModeStateManager:
        """Return the state manager for sync mode operations."""
        return self._group.sync_mode_state_manager

    @property
    def call_handler(self) -> SyncCallHandler:
        """Return the call handler for sync mode operations."""
        return self._group.sync_mode_call_handler

    @property
    def target_state(self) -> TargetState:
        """Return the current target state (from central source)."""
        return self.state_manager.target_state

    @property
    def filter_state(self) -> FilterState:
        """Return the current filter state (respecting schedule overrides)."""
        if META_KEY_SYNC_ATTRS in self._group.run_state.config_overrides:
            return FilterState.from_keys(self._group.run_state.config_overrides[META_KEY_SYNC_ATTRS])
        return self._filter_state

    def async_teardown(self) -> None:
        """Cancel all pending enforcement tasks."""
        for task in self._active_sync_tasks:
            task.cancel()
        self._active_sync_tasks.clear()

    def resync(self) -> None:
        """Handle changes based on sync mode."""

        # Block during startup to prevent initial state flood from overwriting target_state.
        if (
            not self._group.run_state.startup_time
            or (time.time() - self._group.run_state.startup_time) < STARTUP_BLOCK_DELAY
        ):
            _LOGGER.debug("[%s] Startup phase, sync blocked", self._group.entity_id)
            return

        if self._group.event is None or self._group.change_state is None or self._group.change_state.entity_id is None:
            return

        event = self._group.event
        origin_event = getattr(event.context, "origin_event", None)
        change_entity_id = self._group.change_state.entity_id
        change_dict = self._group.change_state.attributes()
        own_echo = self._is_own_echo(event)

        if self._is_transient_state_event(event):
            return

        if not own_echo:
            # MEMBER_OFF isolation trigger: runs before the DISABLED guard so it works
            # even when sync enforcement is off.
            self._group.member_isolation_handler.check_member_off_isolation()

            if not self._has_relevant_changes(event):
                return

            # Block enforcement: each active blocking source enforces its own state.
            # Runs before the DISABLED guard so blocking is always enforced regardless
            # of sync_mode. Each enforce_override() is a no-op if its source is inactive.
            if self._group.run_state.blocking_sources:
                for enforce in (
                    self._group.switch_override_manager.enforce_override,
                    self._group.window_override_manager.enforce_override,
                    self._group.presence_override_manager.enforce_override,
                ):
                    task = self._hass.async_create_background_task(
                        enforce(), name="climate_group_block_enforcement"
                    )
                    self._active_sync_tasks.add(task)
                    task.add_done_callback(self._active_sync_tasks.discard)

        if not change_dict:
            return

        # Suppress direct echoes: events fired with our own context IDs
        # Ignore echoes from blocking operations. These side effects
        # (e.g. window_control restore, isolation restore, presence override) are not external changes.
        if event.context.id in ("window_control", "isolation", "presence"):
            _LOGGER.debug("[%s] Ignoring '%s' echo", self._group.entity_id, event.context.id)
            return

        # Deep Origin Analysis: Did we cause this change?
        if own_echo:
            if origin_event is None:
                return
            accepted = self._filter_echo_changes(origin_event, change_dict, change_entity_id)
            if accepted:
                _LOGGER.debug("[%s] Adopting side effects: %s", self._group.entity_id, accepted)
                accepted = self._reverse_offset_temperatures(change_entity_id, accepted)
                self.state_manager.update(entity_id=change_entity_id, **accepted)
            return

        # --- Fresh Event (external change) ---
        _LOGGER.debug("[%s] External change: %s from %s", self._group.entity_id, change_dict, change_entity_id)

        if self.sync_mode == SyncMode.DISABLED:
            return

        # Filter out setpoint values when HVAC is OFF (meaningless frost protection values)
        is_switching_on = "hvac_mode" in change_dict and change_dict["hvac_mode"] != HVACMode.OFF
        if self.target_state.hvac_mode == HVACMode.OFF and not is_switching_on:
            setpoint_attrs = {"temperature", "target_temp_low", "target_temp_high", "humidity"}
            change_dict = {key: value for key, value in change_dict.items() if key not in setpoint_attrs}
            if not change_dict:
                _LOGGER.debug("[%s] Ignoring setpoint changes while OFF", self._group.entity_id)
                return

        # 1. Mirror mode: adopt filtered changes into target_state.
        # Guard: skip adoption on reconnect (old_state was unavailable/unknown) — the device
        # is reporting its restored hardware state, not a deliberate user change.
        # LOCK enforcement below still runs to correct the member if needed.
        old_state = event.data.get("old_state")
        is_reconnect = old_state is not None and old_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN)
        if self.sync_mode in (SyncMode.MIRROR, SyncMode.MIRROR_LOCK) and not is_reconnect:
            if filtered := {key: value for key, value in change_dict.items() if self.filter_state.to_dict().get(key)}:
                filtered = self._reverse_offset_temperatures(change_entity_id, filtered)
                self.state_manager.update(entity_id=change_entity_id, **filtered)
                _LOGGER.debug("[%s] TargetState updated: %s", self._group.entity_id, self.target_state)

        # 2. Lock mode: only accept "Last Man Standing" OFF (Partial Sync)
        if self.sync_mode in (SyncMode.LOCK, SyncMode.MIRROR_LOCK):
            if (
                self._group.config.get(CONF_IGNORE_OFF_MEMBERS_SYNC)
                and change_dict.get("hvac_mode") == HVACMode.OFF
                and self.target_state.hvac_mode != HVACMode.OFF
            ):
                if self.state_manager.update(entity_id=change_entity_id, hvac_mode=HVACMode.OFF):
                    _LOGGER.debug("[%s] Last Man Standing: accepted OFF from %s", self._group.entity_id, change_entity_id)

        # 3. Master/Lock mode: master adopts (MIRROR), non-master reverts (LOCK)
        if self.sync_mode == SyncMode.MASTER_LOCK:
            if self._group.run_state.master_fallback_active:
                _LOGGER.debug("[%s] MASTER_LOCK enforcement skipped (master fallback active)", self._group.entity_id)
                return
            master_id = self._group._master_entity_id
            if master_id and change_entity_id == master_id:
                if filtered := {key: value for key, value in change_dict.items() if self.filter_state.to_dict().get(key)}:
                    filtered = self._reverse_offset_temperatures(change_entity_id, filtered)
                    self.state_manager.update(entity_id=change_entity_id, **filtered)
                    _LOGGER.debug("[%s] Master entity change adopted: %s", self._group.entity_id, filtered)
            # Non-master changes are enforced (reverted) via call_debounced below

        # Enforce target state on all members (skip during global blocking mode)
        if not self._group.run_state.blocked:
            sync_task = self._hass.async_create_background_task(
                self.call_handler.call_debounced(), name="climate_group_sync_enforcement"
            )
            self._active_sync_tasks.add(sync_task)
            sync_task.add_done_callback(self._active_sync_tasks.discard)
        else:
            _LOGGER.debug("[%s] Enforcement skipped (blocking mode)", self._group.entity_id)

    # --- Offset Helpers ---

    def _reverse_offset_temperatures(self, entity_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Reverse-transform member temperatures to logical group values.

        When adopting a member's temperature in Mirror/Master-Lock mode,
        the member's actual value must be converted back to the group-level
        value by subtracting both the member's individual offset and the global group offset.
        Returns a new dict; the input is never mutated.
        """
        offset_map = self._group._temp_offset_map
        global_offset = self._group.run_state.group_offset
        member_offset = offset_map.get(entity_id, 0.0) if offset_map else 0.0

        total_offset = member_offset + global_offset
        if total_offset == 0.0:
            return data

        result = dict(data)
        for key in {"temperature", "target_temp_low", "target_temp_high"}:
            if key in result and result[key] is not None:
                result[key] = result[key] - total_offset
        return result

    # --- Echo Detection Helpers ---

    @staticmethod
    def _extract_origin_entity(origin_event: Event) -> str:
        """Extract origin entity from parent_id (format: 'entity_id|timestamp')."""
        parent_id = origin_event.context.parent_id or ""
        if "|" in parent_id:
            origin, _ = parent_id.split("|", 1)
            return origin
        return ""

    def _has_relevant_changes(self, event: Event) -> bool:
        """Return True if the event changed at least one ClimateState field.

        Filters out display-only updates (e.g. current_temperature, hvac_action)
        that cannot affect sync decisions or enforcement.
        Uses event.data directly — the event is already template-rendered by
        _state_change_listener, so read_member_event would double-wrap it.
        """
        new_state = event.data.get("new_state")
        old_state = event.data.get("old_state")
        if not new_state or not old_state:
            return True
        if new_state.state != old_state.state:
            return True
        return any(
            new_state.attributes.get(f.name) != old_state.attributes.get(f.name)
            for f in fields(ClimateState)
            if f.name != "hvac_mode"
        )

    def _is_transient_state_event(self, event: Event) -> bool:
        """Return True if the event carries a transient (unavailable/unknown) new_state.

        Such events carry no meaningful climate state — the member is offline or
        initialising. There is nothing to adopt or enforce against.
        """
        new_state = event.data.get("new_state")
        if new_state and new_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            _LOGGER.debug(
                "[%s] Ignoring transient new_state (%s) from %s",
                self._group.entity_id, new_state.state, event.data.get("entity_id"),
            )
            return True
        return False

    def _is_own_echo(self, event: Event) -> bool:
        """Return True if the event was caused by one of our own service calls.

        Two detection paths:
        1. Direct context ID: test mocks and some HA paths write state with the
           call's context directly (no origin_event chain). Check event.context.id
           against blocking-source IDs that are never external changes.
        2. Deep origin analysis: production HA wraps the state_changed event in an
           origin_event chain. Check origin_event.context.id against all trusted IDs.
        """
        if event.context.id in _TRUSTED_CONTEXT_IDS:
            return True

        origin_event = getattr(event.context, "origin_event", None)
        if (
            origin_event
            and origin_event.event_type == "call_service"
            and origin_event.data.get("domain") == "climate"
        ):
            return origin_event.context.id in _TRUSTED_CONTEXT_IDS

        return False

    def _filter_echo_changes(self, origin_event: Event, change_dict: dict[str, Any], change_entity_id: str | None) -> dict[str, Any]:
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
