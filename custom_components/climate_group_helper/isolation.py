"""Member isolation handler for climate group."""
from __future__ import annotations

import logging
from dataclasses import replace
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_TRIGGER,
    CONF_ISOLATION_TRIGGER_HVAC_MODES,
    CONF_ISOLATION_ACTION_TYPE,
    CONF_ISOLATION_ACTION_HVAC_MODE,
    CONF_ISOLATION_ACTION_PRESET_MODE,
    MODE_MODES_MAP,
    IsolationTrigger,
    IsolationActionType,
)
from .service_call import BaseServiceCallHandler

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .state import TargetState

_LOGGER = logging.getLogger(__name__)


class MemberIsolationHandler:
    """Monitors an isolation trigger and manages RunState.isolated_members.

    Trigger modes:
      - DISABLED: Feature off — async_setup returns immediately.
      - SENSOR: Activates when a binary_sensor or input_boolean turns ON.
      - HVAC_MODE: Activates when target_state.hvac_mode is in the configured set.
        Hook: climate.py calls on_target_hvac_mode_changed() after every hvac_mode update.
      - MEMBER_OFF: Activates per-member when a member turns OFF manually (not via group
        command). Handled in SyncModeHandler.resync() via _maybe_isolate_off_member().
        State mutation is synchronous so LOCK enforcement immediately sees updated state.

    When the trigger activates (SENSOR / HVAC_MODE):
      1. Optionally waits for activate_delay seconds.
      2. Adds the configured entities to run_state.isolated_members.
      3. Actively turns each isolated entity OFF.

    When the trigger deactivates (SENSOR / HVAC_MODE):
      1. Optionally waits for restore_delay seconds.
      2. Removes the entities from run_state.isolated_members.
      3. Syncs each entity back to the current target_state (unless globally blocked).
    """

    def __init__(self, group: ClimateGroupHelper, rule: dict[str, Any]) -> None:
        """Initialize the member isolation handler from a single rule dict.

        The advanced_mode guard lives in climate.py — the handler list is only
        populated when advanced mode is on, so each rule is always active here.
        """
        self._group = group
        self._hass = group.hass

        self._trigger: IsolationTrigger = IsolationTrigger(
            rule.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
        )
        self._sensor_id: str | None = rule.get(CONF_ISOLATION_SENSOR)
        self._trigger_hvac_modes: list[str] = rule.get(CONF_ISOLATION_TRIGGER_HVAC_MODES, [])
        self._isolation_entity_ids: list[str] = rule.get(CONF_ISOLATION_ENTITIES, [])
        self._activate_delay: float = rule.get(CONF_ISOLATION_ACTIVATE_DELAY, 0)
        self._restore_delay: float = rule.get(CONF_ISOLATION_RESTORE_DELAY, 0)

        self._action_type: IsolationActionType = IsolationActionType(
            rule.get(CONF_ISOLATION_ACTION_TYPE, IsolationActionType.HVAC_MODE)
        )
        self._action_hvac_mode: str = rule.get(CONF_ISOLATION_ACTION_HVAC_MODE, HVACMode.OFF)
        self._action_preset_mode: str | None = rule.get(CONF_ISOLATION_ACTION_PRESET_MODE)

        self._unsub_listener: Callable[[], None] | None = None
        self._pending_timer: Callable[[], None] | None = None
        self._trigger_active: bool = False

        # Per-entity call handlers — created in async_setup, keyed by entity_id
        self._call_handlers: dict[str, IsolationCallHandler] = {}
        self._restore_call_handlers: dict[str, IsolationRestoreCallHandler] = {}


        _LOGGER.debug(
            "[%s] MemberIsolation initialized. trigger=%s, sensor=%s, hvac_modes=%s, entities=%s, activate_delay=%ss, restore_delay=%ss",
            group.entity_id, self._trigger, self._sensor_id, self._trigger_hvac_modes,
            self._isolation_entity_ids, self._activate_delay, self._restore_delay,
        )

    @property
    def target_state(self) -> TargetState:
        """Return the current target state (from central source)."""
        return self._group.shared_target_state

    @property
    def _pre_action_presets(self) -> dict[str, str | None]:
        """Per-device preset from before the first rule isolated the device.

        Shared across all isolation rules (owned by the group): a device has
        exactly one original preset, and every rule after the first only ever
        finds a pre-action value on it. Keeping the snapshot per rule loses it
        as soon as that rule releases first — it discards its entry while the
        device stays claimed, leaving the final release with nothing to
        restore.
        """
        return self._group.isolation_pre_action_presets

    def would_fully_isolate(self, entities_to_isolate: set[str] | list[str] | frozenset[str]) -> bool:
        """Return True if isolating entities_to_isolate would isolate all members in the group."""
        new_set = self._group.run_state.isolated_members | frozenset(entities_to_isolate)
        all_members = frozenset(self._group.climate_entity_ids)
        return all_members.issubset(new_set)

    async def async_setup(self) -> None:
        """Subscribe to the configured trigger."""
        if self._trigger == IsolationTrigger.DISABLED:
            _LOGGER.debug("[%s] Member isolation disabled (trigger=DISABLED)", self._group.entity_id)
            return
        if self._trigger != IsolationTrigger.MEMBER_OFF and not self._isolation_entity_ids:
            _LOGGER.debug("[%s] Member isolation disabled (no entities configured)", self._group.entity_id)
            return

        # Create per-entity call handlers
        for entity_id in self._isolation_entity_ids:
            self._call_handlers[entity_id] = IsolationCallHandler(self._group, entity_id)
            self._restore_call_handlers[entity_id] = IsolationRestoreCallHandler(self._group, entity_id)

        if self._trigger == IsolationTrigger.MEMBER_OFF:
            _LOGGER.debug(
                "[%s] Member isolation configured for MEMBER_OFF trigger, watching: %s",
                self._group.entity_id, self._isolation_entity_ids,
            )
            return

        if self._trigger == IsolationTrigger.SENSOR:
            if not self._sensor_id:
                _LOGGER.debug("[%s] Member isolation disabled (sensor trigger but no sensor configured)", self._group.entity_id)
                return
            self._unsub_listener = async_track_state_change_event(
                self._hass, [self._sensor_id], self._state_change_listener,
            )
            _LOGGER.debug("[%s] Member isolation subscribed to sensor: %s", self._group.entity_id, self._sensor_id)
            # Check initial sensor state (same pattern as the HVAC_MODE check below:
            # _trigger_active must reflect the active rule so still_claimed and the
            # change-guard in _state_change_listener stay consistent).
            if (state := self._hass.states.get(self._sensor_id)) and state.state == STATE_ON:
                self._trigger_active = True
                _LOGGER.debug("[%s] Isolation sensor already ON at startup, activating immediately", self._group.entity_id)
                await self._activate_isolation()
        else:
            # HVAC_MODE: no state listener — climate.py calls on_target_hvac_mode_changed() on every update.
            _LOGGER.debug("[%s] Member isolation configured for hvac_mode trigger: %s", self._group.entity_id, self._trigger_hvac_modes)
            # Check initial hvac_mode at startup (same pattern as sensor state check above)
            if self.target_state.hvac_mode in self._trigger_hvac_modes:
                self._trigger_active = True
                _LOGGER.debug("[%s] Isolation hvac_mode already active at startup, activating immediately", self._group.entity_id)
                await self._activate_isolation()

    def async_teardown(self) -> None:
        """Unsubscribe from sensor and cancel pending timers."""
        self._cancel_timer()
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    @callback
    def on_target_hvac_mode_changed(self, hvac_mode: str | None) -> None:
        """Called by ClimateGroupHelper when target_state.hvac_mode changes (HVAC_MODE trigger only)."""
        if self._trigger != IsolationTrigger.HVAC_MODE or not self._trigger_hvac_modes:
            return

        now_active = hvac_mode in self._trigger_hvac_modes
        if now_active == self._trigger_active:
            return  # no change

        self._trigger_active = now_active
        _LOGGER.debug("[%s] HVAC-mode isolation trigger: hvac_mode=%s → active=%s", self._group.entity_id, hvac_mode, now_active)
        self._schedule_trigger(now_active)

    @callback
    def _state_change_listener(self, event: Event[EventStateChangedData]) -> None:
        """Handle sensor state change (SENSOR trigger only).

        Only actual on/off transitions are tracked — attribute-only updates
        (e.g. periodic Zigbee battery reports) carry the same state and must not
        restart the activation/restore timer, otherwise a sensor reporting
        attributes more often than the configured delay would never activate.
        """
        new_state = event.data.get("new_state")
        if new_state is None:
            return

        if new_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return

        now_active = new_state.state == STATE_ON
        if now_active == self._trigger_active:
            return  # no change — attribute-only update
        _LOGGER.debug("[%s] Isolation sensor %s changed to: %s", self._group.entity_id, self._sensor_id, new_state.state)
        self._trigger_active = now_active
        self._schedule_trigger(now_active)

    @callback
    def _schedule_trigger(self, activate: bool) -> None:
        """Cancel any pending timer and schedule activate or deactivate."""
        self._cancel_timer()
        delay = self._activate_delay if activate else self._restore_delay
        if delay > 0:
            _LOGGER.debug("[%s] Scheduling isolation %s in %.1fs", self._group.entity_id, "activation" if activate else "restore", delay)
            self._pending_timer = async_call_later(self._hass, delay, self._timer_expired)
        else:
            self._hass.async_create_background_task(
                self._activate_isolation() if activate else self._deactivate_isolation(),
                name="climate_group_isolation_trigger",
            )

    @callback
    def _timer_expired(self, _now: Any) -> None:
        """Timer callback — activate or deactivate based on current trigger state."""
        self._pending_timer = None
        self._hass.async_create_background_task(
            self._activate_isolation() if self._trigger_active else self._deactivate_isolation(),
            name="climate_group_isolation_timer_expired",
        )

    def _cancel_timer(self) -> None:
        """Cancel any pending activation/restore timer."""
        if self._pending_timer:
            self._pending_timer()
            self._pending_timer = None
            _LOGGER.debug("[%s] Isolation timer cancelled", self._group.entity_id)

    def _get_call_handler(self, entity_id: str) -> IsolationCallHandler | None:
        """Return the isolation call handler for a member, creating it on demand.

        async_setup() pre-creates handlers for the configured entity list, but a
        MEMBER_OFF rule with an EMPTY list means "watch every member" — that path
        would otherwise find no handler and silently skip the restore call,
        leaving the device physically off after the release.

        Only members of this group are served; anything else returns None.
        """
        if entity_id not in self._group.climate_entity_ids:
            return None
        if entity_id not in self._call_handlers:
            self._call_handlers[entity_id] = IsolationCallHandler(self._group, entity_id)
        return self._call_handlers[entity_id]

    def _foreign_claims(self) -> frozenset[str]:
        """Return entities claimed by another currently-active isolation rule.

        Two rules may cover the same entity; when only one of them releases it, the
        other rule's claim must survive — both in the isolated_members bookkeeping
        and in the restore calls (a full target-state restore would physically undo
        the other rule's protection).
        """
        return frozenset(
            eid
            for other in self._group.member_isolation_handlers
            if other is not self and other._trigger_active
            for eid in other._isolation_entity_ids
        )

    def _build_isolation_payload(self, entity_id: str) -> dict | None:
        """Return the service call payload for the isolation pre-action.

        Returns None if the device is unavailable or already in the target state.
        """
        state = self._group.read_member_state(entity_id)
        if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return None

        if self._action_type == IsolationActionType.PRESET_MODE:
            preset = self._action_preset_mode
            if not preset:
                _LOGGER.warning(
                    "[%s] isolation_action_type=preset_mode but no preset configured for %s — falling back to OFF",
                    self._group.entity_id, entity_id,
                )
                return {"hvac_mode": HVACMode.OFF}
            supported = state.attributes.get("preset_modes", [])
            if preset not in supported:
                _LOGGER.warning(
                    "[%s] Isolation preset %r not supported by %s (supported: %s) — falling back to OFF",
                    self._group.entity_id, preset, entity_id, supported,
                )
                return {"hvac_mode": HVACMode.OFF}
            if state.attributes.get("preset_mode") == preset:
                return None  # already set
            return {"preset_mode": preset}

        # Default: hvac_mode
        if state.state == self._action_hvac_mode:
            return None  # already in target mode
        return {"hvac_mode": self._action_hvac_mode}

    def _read_current_preset(self, entity_id: str) -> str | None:
        """Read the device's current preset_mode (None if unavailable or unset)."""
        state = self._group.read_member_state(entity_id)
        if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return None
        return state.attributes.get("preset_mode")

    def _build_restore_preset_payload(self, entity_id: str) -> dict | None:
        """Return the service call payload restoring the pre-action preset.

        Returns None if no pre-preset was captured, the device is unavailable,
        the preset is not supported by the device, or the device already carries
        the preset (skip logic, consistent with _build_isolation_payload).

        The call is also skipped when the target_state restore will cover the
        preset itself (group preset is set AND supported by the device AND no
        block is active that would suppress the restore).

        Known limit: a captured None (device had NO preset before the pre-action)
        cannot be restored — set_preset_mode requires a concrete value, so the
        device stays on the pre-action preset.
        """
        pre_preset = self._pre_action_presets.get(entity_id)
        if not pre_preset:
            return None
        state = self._group.read_member_state(entity_id)
        if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return None
        supported = state.attributes.get("preset_modes", [])
        if (
            self.target_state.preset_mode is not None
            and self.target_state.preset_mode in supported
            and not self._group.run_state.blocked
        ):
            return None  # target_state restore covers the preset
        if pre_preset not in supported:
            _LOGGER.warning(
                "[%s] Pre-action preset %r not supported by %s (supported: %s) — skipping restore",
                self._group.entity_id, pre_preset, entity_id, supported,
            )
            return None
        if state.attributes.get("preset_mode") == pre_preset:
            return None  # already set
        return {"preset_mode": pre_preset}

    async def _activate_isolation(self) -> None:
        """Add entities to isolated_members and trigger pre-action.

        Re-validates the trigger state on entry and between the sequential
        pre-action calls: the sensor may have flipped while the coroutine was
        queued or between awaits — a stale activation must not re-add entities
        or send OFF commands after the deactivation already won (whichever
        coroutine runs LAST must not override the current trigger state).
        """
        if not self._trigger_active:
            _LOGGER.debug("[%s] Stale isolation activation skipped (trigger no longer active)", self._group.entity_id)
            return

        if self.would_fully_isolate(self._isolation_entity_ids):
            _LOGGER.warning(
                "[%s] Isolation skipped for %s: would isolate all members in group",
                self._group.entity_id, self._isolation_entity_ids,
            )
            return

        # Entities another rule already isolated carry that rule's action
        # preset, not the user's original — there is nothing left to snapshot
        # for them (the shared entry from the first isolation already holds the
        # only correct value). Captured before the own entities join
        # isolated_members.
        already_isolated = self._group.run_state.isolated_members

        new_isolated = already_isolated | frozenset(self._isolation_entity_ids)
        self._group.run_state = replace(
            self._group.run_state,
            isolated_members=new_isolated,
        )
        _LOGGER.debug("[%s] Isolation activated for: %s", self._group.entity_id, self._isolation_entity_ids)

        for entity_id in self._isolation_entity_ids:
            if not self._trigger_active:
                _LOGGER.debug("[%s] Isolation activation aborted mid-flight (trigger flipped)", self._group.entity_id)
                return
            if handler := self._call_handlers.get(entity_id):
                # Capture the pre-action preset BEFORE sending the pre-action —
                # only preset_mode changes need a device-side restore point.
                if (
                    self._action_type == IsolationActionType.PRESET_MODE
                    and entity_id not in already_isolated
                ):
                    self._pre_action_presets[entity_id] = self._read_current_preset(entity_id)
                payload = self._build_isolation_payload(entity_id)
                if payload:
                    await handler.call_immediate(payload)

        self._group.async_defer_or_update_ha_state()

    async def _deactivate_isolation(self) -> None:
        """Remove entities from isolated_members and restore to target_state.

        Excludes entities still claimed by another currently-active rule — two
        rules covering the same entity must not cancel each other out when only
        one of them deactivates.

        Re-validates the trigger state on entry: the sensor may have flipped
        while the coroutine was queued — a stale deactivation must not release
        entities or send restore commands after the activation already won.
        """
        if self._trigger_active:
            _LOGGER.debug("[%s] Stale isolation deactivation skipped (trigger active again)", self._group.entity_id)
            return

        still_claimed = self._foreign_claims()
        new_isolated = self._group.run_state.isolated_members - (
            frozenset(self._isolation_entity_ids) - still_claimed
        )
        self._group.run_state = replace(
            self._group.run_state,
            isolated_members=new_isolated,
        )
        _LOGGER.debug("[%s] Isolation deactivated for: %s", self._group.entity_id, self._isolation_entity_ids)

        # Entities still claimed by another active rule stay isolated — the
        # bookkeeping above keeps them in isolated_members, and the restore
        # calls below must not reach them either: a full target-state restore
        # (e.g. heat 21°) would physically undo the other rule's protection on
        # an OFF device that isolated_members still marks as protected.
        release_entities = [eid for eid in self._isolation_entity_ids if eid not in still_claimed]

        # Restore the pre-action preset FIRST — always, even when globally blocked.
        # Last-Call-Wins: the authoritative target_state values are sent afterwards
        # and cannot be overwritten by the preset call. While blocked, the preset
        # echo reaches the enforcement loop (own_echo=False) which re-applies the
        # active block (OFF/temperature); when the block lifts, the device already
        # carries the pre-preset and the block-restore needs to know nothing about it.
        for entity_id in self._isolation_entity_ids:
            # Still claimed by another rule: the device stays isolated, so the
            # snapshot must survive for whichever rule releases it last. This
            # rule may be the one that captured it — discarding it here would
            # leave the final release with nothing to restore.
            if entity_id in still_claimed:
                continue
            payload = self._build_restore_preset_payload(entity_id)
            if payload:
                if restore_handler := self._restore_call_handlers.get(entity_id):
                    await restore_handler.call_immediate(payload)
            # Final release for this device — the entry is consumed.
            self._pre_action_presets.pop(entity_id, None)

        # Skip restore if globally blocked (e.g. window open) — Window Control
        # will restore all members (including the newly un-isolated one) when the block is lifted.
        if not self._group.run_state.blocked:
            for entity_id in release_entities:
                if call_handler := self._call_handlers.get(entity_id):
                    await call_handler.call_immediate()

        self._group.async_defer_or_update_ha_state()

    # --- Per-member methods for MEMBER_OFF trigger ---

    def check_member_off_isolation(self) -> None:
        """Activate or release MEMBER_OFF isolation for a single member.

        Only runs when isolation_trigger == MEMBER_OFF and the entity is in the
        configured watch list (or all members if the list is empty).
        """
        if not self._group.event:
            return
        
        event_data = self._group.event.data
        entity_id = event_data.get("entity_id")
        old_state = event_data.get("old_state")
        new_state = event_data.get("new_state")

        if entity_id is None or old_state is None or new_state is None:
            return

        if not (old_hvac_mode := old_state.state):
            return
        
        if not (new_hvac_mode := new_state.state):
            return

        if old_hvac_mode == new_hvac_mode:
            return

        # Transient new_state: member going offline — no meaningful state to act on.
        if new_hvac_mode in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return
        # Transient old_state + new OFF: member came back online already OFF (e.g. after a
        # brief disconnect). Treat as a deliberate OFF — isolation should fire.
        # Transient old_state + new active: not a deliberate user change, so it must not
        # start anything — but a member we ALREADY hold isolated is a different matter.
        # MEMBER_OFF means "the member is off, leave it alone"; once it reports an active
        # mode that premise is gone, no matter how it got there. Keeping it isolated would
        # mark a physically running device as off — invisible to sync and aggregation while
        # it heats. The release is therefore exempt from this guard; adoption of the
        # reconnected state into target_state stays blocked in sync_mode.py.
        if (
            old_hvac_mode in (STATE_UNAVAILABLE, STATE_UNKNOWN)
            and new_hvac_mode != HVACMode.OFF
            and entity_id not in self._group.run_state.isolated_members
        ):
            return

        if self._trigger != IsolationTrigger.MEMBER_OFF:
            return

        watch_list = self._isolation_entity_ids
        if watch_list and entity_id not in watch_list:
            return

        if new_hvac_mode == HVACMode.OFF:
            # Synchronously update run_state so the subsequent LOCK enforcement sees
            # the member as isolated and skips it — avoids a send→echo→re-isolate loop.
            self.isolate_member_sync(entity_id)
        elif new_hvac_mode and new_hvac_mode != HVACMode.OFF:
            # Member switched to an active mode → release isolation synchronously,
            # then send restore call async.
            # The restore call only follows an actual release — a member still
            # claimed by another active rule must not be pushed back to target_state.
            if entity_id in self._group.run_state.isolated_members:
                if self.release_member_sync(entity_id):
                    self._hass.async_create_background_task(
                        self.send_restore_call(entity_id),
                        name="climate_group_isolation_restore",
                    )

    def isolate_member_sync(self, entity_id: str) -> None:
        """Synchronously add a member to isolated_members (MEMBER_OFF trigger).

        Called directly from SyncModeHandler.resync() so that the LOCK enforcement
        task that runs immediately after sees the updated run_state and skips the
        member — preventing a send→echo→re-isolate loop.

        Guarded by would_fully_isolate to prevent full group isolation.
        """
        if self.would_fully_isolate({entity_id}):
            _LOGGER.warning(
                "[%s] MEMBER_OFF isolation skipped for %s: would isolate all members in group",
                self._group.entity_id, entity_id,
            )
            return

        new_isolated = self._group.run_state.isolated_members | frozenset([entity_id])
        self._group.run_state = replace(self._group.run_state, isolated_members=new_isolated)
        _LOGGER.debug("[%s] MEMBER_OFF: isolated %s", self._group.entity_id, entity_id)

    def release_member_sync(self, entity_id: str) -> bool:
        """Synchronously remove a member from isolated_members (MEMBER_OFF trigger).

        Called from SyncModeHandler before dispatching send_restore_call() so that
        subsequent LOCK enforcement does not skip the newly active member.

        Entities still claimed by another currently-active rule are NOT released —
        same guard as _deactivate_isolation() and the Last-Man-Standing branch.
        Without it, a member turning itself back on would silently cancel a foreign
        rule's protection (e.g. a SENSOR rule that deliberately holds it isolated).

        Returns True when the member was actually released, so the caller can skip
        the restore call for a member that stays isolated.
        """
        if entity_id not in self._group.run_state.isolated_members:
            return False
        if entity_id in self._foreign_claims():
            _LOGGER.debug(
                "[%s] MEMBER_OFF: release of %s skipped — still claimed by another active rule",
                self._group.entity_id, entity_id,
            )
            return False
        new_isolated = self._group.run_state.isolated_members - frozenset([entity_id])
        self._group.run_state = replace(self._group.run_state, isolated_members=new_isolated)
        _LOGGER.debug("[%s] MEMBER_OFF: sync-released %s", self._group.entity_id, entity_id)
        return True

    async def send_restore_call(self, entity_id: str) -> None:
        """Send a restore call to a single member (MEMBER_OFF trigger).

        Called after release_member_sync() — does NOT touch run_state.
        """
        if self._group.run_state.blocked:
            return
        if handler := self._get_call_handler(entity_id):
            await handler.call_immediate()
        self._group.async_defer_or_update_ha_state()


class IsolationCallHandler(BaseServiceCallHandler):
    """Call handler for Member Isolation operations.

    Always bypasses global blocking (blocked) and member isolation checks —
    the isolation handler itself must be able to send commands regardless of
    the current run_state state.
    """

    CONTEXT_ID = "isolation"

    def __init__(self, group: ClimateGroupHelper, entity_id: str) -> None:
        """Initialize with a fixed target entity."""
        super().__init__(group)
        self._entity_id = entity_id

    def _is_member_blocked(self, entity_id: str) -> bool:  # noqa: ARG002
        """Never block — isolation handler bypasses all blocking."""
        return False

    def _get_capable_entities(self, attr: str, value: Any = None) -> list[str]:
        """Return only the single isolated entity (if capable)."""
        state = self._hass.states.get(self._entity_id)
        if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return []
        # For float attrs just check existence; for mode attrs check supported values
        if attr in MODE_MODES_MAP:
            supported_modes = state.attributes.get(MODE_MODES_MAP[attr], [])
            if value is not None and attr != "hvac_mode":
                if value not in supported_modes:
                    return []
            elif attr != "hvac_mode" and not supported_modes:
                return []
        elif attr not in state.attributes:
            return []
        return [self._entity_id]


class IsolationRestoreCallHandler(IsolationCallHandler):
    """Call handler restoring the pre-action preset when isolation ends.

    Carries the dedicated context_id "isolation_restore" so its echo reaches the
    blocking-enforcement loop (own_echo=False — NOT in _TRUSTED_CONTEXT_IDS) while
    being suppressed from MIRROR adoption (_BLOCKING_ECHO_CONTEXT_IDS). See the
    invariant note in sync_mode.py.
    """

    CONTEXT_ID = "isolation_restore"
