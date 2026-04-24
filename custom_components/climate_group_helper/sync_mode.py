"""Sync mode logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING

from homeassistant.core import Event
from homeassistant.components.climate import HVACMode

from .const import (
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_TRIGGER,
    CONF_SYNC_ATTRS,
    CONF_SYNC_MODE,
    META_KEY_SYNC_MODE,
    META_KEY_SYNC_ATTRS,
    STARTUP_BLOCK_DELAY,
    SYNC_TARGET_ATTRS,
    IsolationTrigger,
    SyncMode,
)
from .state import FilterState, is_own_echo

if TYPE_CHECKING:
    from .climate import ClimateGroup

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

    def __init__(self, group: ClimateGroup):
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
        self._active_sync_tasks: set[asyncio.Task] = set()

    @property
    def sync_mode(self) -> SyncMode:
        """Return the effective sync mode (respecting schedule overrides)."""
        if META_KEY_SYNC_MODE in self._group.run_state.config_overrides:
            return SyncMode(self._group.run_state.config_overrides[META_KEY_SYNC_MODE])
        return self._sync_mode

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

    @property
    def filter_state(self) -> FilterState:
        """Return the current filter state (respecting schedule overrides)."""
        if META_KEY_SYNC_ATTRS in self._group.run_state.config_overrides:
            return FilterState.from_keys(self._group.run_state.config_overrides[META_KEY_SYNC_ATTRS])
        return self._filter_state

    def resync(self) -> None:
        """Handle changes based on sync mode."""

        # Block during startup to prevent initial state flood from overwriting target_state.
        if (
            not self._group.run_state.startup_time
            or (time.time() - self._group.run_state.startup_time) < STARTUP_BLOCK_DELAY
        ):
            _LOGGER.debug("[%s] Startup phase, sync blocked", self._group.entity_id)
            return

        event = self._group.event
        origin_event = getattr(event.context, "origin_event", None)
        change_entity_id = self._group.change_state.entity_id or None
        change_dict = self._group.change_state.attributes()
        own_echo = is_own_echo(event)

        if not own_echo:
            # MEMBER_OFF isolation trigger: runs before the DISABLED guard so it works
            # even when sync enforcement is off.
            self._maybe_isolate_off_member(change_entity_id)

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
            accepted = self._filter_echo_changes(origin_event, change_dict, change_entity_id)
            if accepted:
                _LOGGER.debug("[%s] Adopting side effects: %s", self._group.entity_id, accepted)
                self._reverse_offset_temperatures(change_entity_id, accepted)
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

        # 1. Mirror mode: adopt filtered changes into target_state
        if self.sync_mode in (SyncMode.MIRROR, SyncMode.MIRROR_LOCK):
            if filtered := {key: value for key, value in change_dict.items() if self.filter_state.to_dict().get(key)}:
                self._reverse_offset_temperatures(change_entity_id, filtered)
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
                    self._reverse_offset_temperatures(change_entity_id, filtered)
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

    def _reverse_offset_temperatures(self, entity_id: str, data: dict) -> None:
        """Reverse-transform member temperatures to logical group values (in-place).
        
        When adopting a member's temperature in Mirror/Master-Lock mode,
        the member's actual value must be converted back to the group-level
        value by subtracting both the member's individual offset and the global group offset.
        """
        offset_map = self._group._temp_offset_map
        global_offset = self._group.run_state.group_offset
        member_offset = offset_map.get(entity_id, 0.0) if offset_map else 0.0

        total_offset = member_offset + global_offset
        if total_offset == 0.0:
            return

        for key in ("temperature", "target_temp_low", "target_temp_high"):
            if key in data and data[key] is not None:
                data[key] = data[key] - total_offset

    # --- Echo Detection Helpers ---

    @staticmethod
    def _extract_origin_entity(origin_event: Event) -> str:
        """Extract origin entity from parent_id (format: 'entity_id|timestamp')."""
        parent_id = origin_event.context.parent_id or ""
        if "|" in parent_id:
            try:
                origin, _ = parent_id.split("|", 1)
                return origin
            except ValueError:
                pass
        return ""

    def _maybe_isolate_off_member(self, entity_id: str | None) -> None:
        """Activate or release MEMBER_OFF isolation for a single member.

        Only runs when isolation_trigger == MEMBER_OFF and the entity is in the
        configured watch list (or all members if the list is empty).
        """
        if not entity_id:
            return
        trigger = self._group.config.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
        if trigger != IsolationTrigger.MEMBER_OFF:
            return

        watch_list = self._group.config.get(CONF_ISOLATION_ENTITIES, [])
        if entity_id not in watch_list:
            return

        # Read the member's actual current state directly — change_dict only contains
        # deviations from target_state and may omit hvac_mode when it matches the target.
        member_state = self._hass.states.get(entity_id)
        if member_state is None:
            return
        actual_hvac_mode = member_state.state

        isolation_handler = self._group.member_isolation_handler

        if actual_hvac_mode == HVACMode.OFF:
            # Synchronously update run_state so the subsequent LOCK enforcement sees
            # the member as isolated and skips it — avoids a send→echo→re-isolate loop.
            isolation_handler.isolate_member_sync(entity_id)
        else:
            # Member switched to an active mode → release isolation synchronously,
            # then send restore call async.
            if entity_id in self._group.run_state.isolated_members:
                isolation_handler.release_member_sync(entity_id)
                self._hass.async_create_task(isolation_handler.send_restore_call(entity_id))

    def _filter_echo_changes(self, origin_event: Event, change_dict: dict, change_entity_id: str | None) -> dict:
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

