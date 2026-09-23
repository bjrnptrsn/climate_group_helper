"""Member isolation handler for climate group."""
from __future__ import annotations

import logging
from dataclasses import replace
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_ON
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import (
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_SLOT,
    CONF_ISOLATION_TRIGGER,
    CONF_ISOLATION_TRIGGER_HVAC_MODES,
    CONF_ISOLATION_ACTION_TYPE,
    CONF_ISOLATION_ACTION_HVAC_MODE,
    CONF_ISOLATION_ACTION_PRESET_MODE,
    META_KEY_ISOLATION_BYPASS,
    META_VALUE_ALL,
    MODE_MODES_MAP,
    TEMP_TARGET_ATTRS,
    IsolationTrigger,
    IsolationActionType,
)
from .service_call import BaseServiceCallHandler
from .state import available_state, is_available

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
        command). Handled in SyncModeHandler.resync() via check_member_off_isolation().
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

    def __init__(
        self, group: ClimateGroupHelper, rule: dict[str, Any], position: int = 1
    ) -> None:
        """Initialize the member isolation handler from a single rule dict.

        The advanced_mode guard lives in climate.py — the handler list is only
        populated when advanced mode is on, so each rule is always active here.

        position is the rule's 1-based place in the configured list, used only as
        the fallback slot number below.
        """
        self._group = group
        self._hass = group.hass

        # UI slot this rule occupies (1-4) — how isolation_bypass addresses it.
        # Absent only for a rule that predates the field, where the list position
        # is what the slot number meant; the same fallback the other read sites
        # use, so a rule cannot end up addressable under two different numbers.
        self._slot: int = rule.get(CONF_ISOLATION_SLOT, position)

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

        # Entities this rule currently holds isolated. Neither _trigger_active nor
        # the configured list can answer that: MEMBER_OFF claims per event and its
        # list is only a filter (possibly empty, "watch every member"), while a
        # continuous trigger can be refused by the full-isolation guard after the
        # trigger was already recorded — its configured entities are then held by
        # nobody.
        self._claims: set[str] = set()

        # Per-entity call handlers — created in async_setup, keyed by entity_id
        self._call_handlers: dict[str, IsolationCallHandler] = {}
        self._restore_call_handlers: dict[str, IsolationRestoreCallHandler] = {}


        _LOGGER.debug(
            "[%s] MemberIsolation initialized. trigger=%s, sensor=%s, hvac_modes=%s, entities=%s, activate_delay=%ss, restore_delay=%ss",
            group.log_id, self._trigger, self._sensor_id, self._trigger_hvac_modes,
            self._isolation_entity_ids, self._activate_delay, self._restore_delay,
        )

    @property
    def target_state(self) -> TargetState:
        """Return the current target state (from central source)."""
        return self._group.shared_target_state

    @property
    def slot(self) -> int:
        """Return the UI slot number (1-4) this rule occupies."""
        return self._slot

    @property
    def bypassed(self) -> bool:
        """Return True while a slot suspends this rule.

        isolation_bypass carries either the "all" sentinel or a list of slot
        numbers; both shapes are normalised in the meta-processor, so only these
        two need handling here.
        """
        value = self._group.run_state.config_overrides.get(META_KEY_ISOLATION_BYPASS)
        if value is None:
            return False
        return value == META_VALUE_ALL or self._slot in value

    @property
    def _effective_active(self) -> bool:
        """Return whether this rule currently claims its entities.

        _trigger_active stays untouched by the bypass: it carries the sensor
        reading, and the sensor keeps running throughout. This property is what
        the isolation logic asks — "does this rule hold anything right now" —
        and it is the only thing the bypass changes.
        """
        return self._trigger_active and not self.bypassed

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
        """Unsubscribe from sensor and cancel pending timers.

        The per-entity call handlers need no shutdown: both the debouncer and
        the retry task are created by call_debounced(), and isolation only ever
        uses call_immediate(), so there is nothing left running to cancel.
        """
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

        if not is_available(new_state):
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

        Every rule is asked what it actually holds, never what it is configured
        for or what its trigger reads: a rule refused by the full-isolation guard
        keeps an active trigger while holding nothing, and a MEMBER_OFF rule's
        list is only a filter. Claims also survive a slot bypass for MEMBER_OFF,
        because `release_bypassed()` is a no-op there — the rule keeps holding
        its devices through the slot.
        """
        claims: set[str] = set()
        for other in self._group.member_isolation_handlers:
            if other is self:
                continue
            claims |= other._claims
        return frozenset(claims)

    def _build_isolation_payload(self, entity_id: str) -> dict | None:
        """Return the service call payload for the isolation pre-action.

        Returns None if the device is unavailable or already in the target state.
        """
        if (state := available_state(self._group.aggregator.read_member_state(entity_id))) is None:
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
        if (state := available_state(self._group.aggregator.read_member_state(entity_id))) is None:
            return None
        return state.attributes.get("preset_mode")

    def _build_restore_preset_payload(self, entity_id: str) -> dict | None:
        """Return the service call payload restoring the pre-action preset.

        Returns None if no pre-preset was captured, the device is unavailable,
        the preset is not supported by the device, or the device already carries
        the preset (skip logic, consistent with _build_isolation_payload).

        The unavailable case is the odd one out: there the restore is merely
        postponed, so the caller keeps the snapshot instead of consuming it.

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
        if (state := available_state(self._group.aggregator.read_member_state(entity_id))) is None:
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
        if not self._effective_active:
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
        self._claims.update(self._isolation_entity_ids)
        _LOGGER.debug("[%s] Isolation activated for: %s", self._group.entity_id, self._isolation_entity_ids)

        for entity_id in self._isolation_entity_ids:
            if not self._effective_active:
                _LOGGER.debug("[%s] Isolation activation aborted mid-flight (trigger flipped)", self._group.entity_id)
                return
            if handler := self._call_handlers.get(entity_id):
                # Capture the pre-action preset BEFORE sending the pre-action —
                # only preset_mode changes need a device-side restore point.
                #
                # setdefault, not assignment: an entry may survive a release when
                # the device was offline and its restore was merely postponed. That
                # device is out of isolated_members by now, so it passes the check
                # above — and a plain write would replace the user's original with
                # the isolation preset the device is still wearing, which is the one
                # value the entry exists to undo. An entry that is still present is
                # always the older, more original one.
                if (
                    self._action_type == IsolationActionType.PRESET_MODE
                    and entity_id not in already_isolated
                ):
                    self._pre_action_presets.setdefault(
                        entity_id, self._read_current_preset(entity_id)
                    )
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
        if self._effective_active:
            _LOGGER.debug("[%s] Stale isolation deactivation skipped (trigger active again)", self._group.entity_id)
            return

        # Dropped before the foreign-claim query: this rule is releasing, so it
        # must not count itself among the claimants.
        self._claims.clear()

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
        release_entities = [entity_id for entity_id in self._isolation_entity_ids if entity_id not in still_claimed]

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
            else:
                if not is_available(self._group.aggregator.read_member_state(entity_id)):
                    # Offline device: the restore did not happen, it was
                    # postponed. Keeping the snapshot is the only chance to
                    # still get the device off the isolation preset once it
                    # reconnects — every other reason for an empty payload
                    # means the preset is already taken care of and the entry
                    # is genuinely spent.
                    continue
            # Final release for this device — the entry is consumed.
            self._pre_action_presets.pop(entity_id, None)

        # Skip restore if globally blocked (e.g. window open) — Window Control
        # will restore all members (including the newly un-isolated one) when the block is lifted.
        if not self._group.run_state.blocked:
            for entity_id in release_entities:
                if call_handler := self._call_handlers.get(entity_id):
                    await call_handler.call_immediate()

        self._group.async_defer_or_update_ha_state()

    def covers_actively(self, entity_id: str) -> bool:
        """Return True if this rule watches the entity and its trigger reads active.

        For callers that run before `async_setup()` has filled `_trigger_active`:
        the trigger state is read fresh from the sensor / target state, the same
        way `reevaluate()` does and the same way this rule's own setup will read
        it moments later.

        MEMBER_OFF returns False — its trigger is an event, so there is nothing to
        read at startup. That is also why the watch-list check may compare against
        the configured list directly: the empty list meaning "watch every member"
        only occurs on that trigger, which never gets past it.
        """
        if entity_id not in self._isolation_entity_ids:
            return False
        if self._trigger == IsolationTrigger.SENSOR:
            if not self._sensor_id:
                return False
            state = self._hass.states.get(self._sensor_id)
            return state is not None and state.state == STATE_ON
        if self._trigger == IsolationTrigger.HVAC_MODE:
            return self.target_state.hvac_mode in self._trigger_hvac_modes
        return False

    async def release_bypassed(self) -> None:
        """Release the entities this rule holds, for the duration of the slot.

        Routed through `_deactivate_isolation()` to inherit its still_claimed
        guard — an entity a foreign active rule also covers stays isolated. Its
        staleness check cannot fire here: `bypassed` already makes
        `_effective_active` False.

        MEMBER_OFF is exempt: it records a manual switch-off, which no slot undoes.
        """
        if self._trigger == IsolationTrigger.MEMBER_OFF:
            return
        if not self._trigger_active:
            return
        _LOGGER.debug(
            "[%s] isolation_bypass: releasing isolation for %s",
            self._group.entity_id, self._isolation_entity_ids,
        )
        self._cancel_timer()
        await self._deactivate_isolation()

    def drop_claims(self) -> None:
        """Release this rule's entities for a group-wide OFF.

        No restore calls, unlike `_deactivate_isolation()` — the members are
        being switched off in the same breath. `_trigger_active` stays as it is;
        `reevaluate()` re-reads the sensor when the group comes back on.

        Every trigger has to prove itself again after the switch: a state-based
        one is re-read right away, MEMBER_OFF needs a new off event. That is why
        its claims go too — they record a past event, and nothing will replay it.
        """
        claimed = frozenset(self._claims) & self._group.run_state.isolated_members

        # Before the early return, not after: an earlier rule covering the same
        # entity has already removed it from isolated_members, so there is
        # nothing left to intersect and the claim would survive the switch.
        self._claims.clear()

        if not claimed:
            return
        self._cancel_timer()
        self._group.run_state = replace(
            self._group.run_state,
            isolated_members=self._group.run_state.isolated_members - claimed,
        )
        _LOGGER.debug(
            "[%s] Group switched off — releasing isolation claims on %s",
            self._group.entity_id, sorted(claimed),
        )

    async def reevaluate(self) -> None:
        """Re-apply the rule if its trigger is still active (slot end, switch on).

        The trigger state is read fresh rather than taken from _trigger_active:
        the listener does keep that field current during a bypass (only the
        resulting action is suppressed), but relying on it would tie this method
        to that detail — a later change gating the listener itself would leave
        the field stale here, and the failure is silent (a device that quietly
        stays un-isolated).

        MEMBER_OFF has nothing to re-apply: its trigger is an event, not a state,
        so the next one arrives on its own.
        """
        if self._trigger == IsolationTrigger.DISABLED:
            return

        if self._trigger == IsolationTrigger.SENSOR:
            if not self._sensor_id:
                return
            if (state := available_state(self._hass.states.get(self._sensor_id))) is None:
                return
            self._trigger_active = state.state == STATE_ON
        elif self._trigger == IsolationTrigger.HVAC_MODE:
            self._trigger_active = self.target_state.hvac_mode in self._trigger_hvac_modes
        else:
            return

        if self._trigger_active:
            _LOGGER.debug(
                "[%s] isolation_bypass ended: trigger still active → re-isolating %s",
                self._group.entity_id, self._isolation_entity_ids,
            )
            await self._activate_isolation()

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
        if not is_available(new_hvac_mode):
            return
        # Reconnect with an active mode is no deliberate change and must not
        # start an isolation — but a member we already hold is released anyway:
        # once it runs, "the member is off" no longer holds, and keeping the
        # claim would hide a heating device from sync and aggregation.
        # A reconnect reporting OFF does isolate: it cannot be told apart from a
        # user switch-off, and MEMBER_OFF exists to keep the group from turning
        # such a device back on.
        if (
            not is_available(old_hvac_mode)
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
            # A covered member's "off" is band mechanics, not user intent, and
            # isolating it there is permanent (the changeover is an own-echo this
            # method never sees). Isolation branch only — the release must stay
            # reachable once a member becomes covered.
            if self._group.member_template_manager.is_covered_state(new_state):
                return
            # MEMBER_OFF needs its own bypass gate: its trigger is an event, not a
            # state, so it never reads _trigger_active and _effective_active does
            # not reach it. The gate sits on the isolation branch only — a member
            # that was isolated before the bypass and switches itself back on
            # during the slot is still released below, or a running device would
            # stay invisible to sync and aggregation.
            if self.bypassed:
                _LOGGER.debug(
                    "[%s] MEMBER_OFF isolation of %s suppressed — isolation_bypass active",
                    self._group.entity_id, entity_id,
                )
                return
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
        self._claims.add(entity_id)
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
        # Dropped before the foreign-claim check: the member reported an active
        # mode, so this rule's own premise ("it is off, leave it alone") is gone
        # either way. Keeping the claim would make this rule hold a running
        # device and block the *other* rule's release later on.
        self._claims.discard(entity_id)
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


def drop_all_claims(group: ClimateGroupHelper) -> None:
    """Release every rule's claims (group-wide OFF)."""
    for handler in group.member_isolation_handlers:
        handler.drop_claims()


async def reevaluate_all(group: ClimateGroupHelper) -> None:
    """Let every rule decide again whether it still applies."""
    for handler in group.member_isolation_handlers:
        await handler.reevaluate()


class IsolationMetaTarget:
    """Adapter exposing `isolation_bypass` as a meta-key target.

    The rules are a list of handlers, not one — hence this wrapper.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group

    async def apply_meta(self, key: str, value: Any) -> None:  # noqa: ARG002
        """Release the devices the suspended rules hold."""
        _LOGGER.debug(
            "[%s] Meta-Key apply: isolation_bypass=%s", self._group.entity_id, value
        )
        # A slot number without a rule behind it is a typo, and every sibling
        # guard reports one. The value guard cannot catch it: it only knows the
        # 1-4 range, not which of those slots actually carry a rule.
        if value != META_VALUE_ALL:
            known = {handler.slot for handler in self._group.member_isolation_handlers}
            if unknown := sorted(set(value) - known):
                _LOGGER.warning(
                    "[%s] Meta-Key 'isolation_bypass': no isolation rule in slot(s) %s — "
                    "those numbers have no effect",
                    self._group.entity_id,
                    ", ".join(str(slot) for slot in unknown),
                )
        # Both directions: a slot switching from [1] to [2] drops rule 1 out of
        # the bypass while the key stays claimed, and _cleanup() — which would
        # re-isolate it — only runs for a key nobody claims any more.
        for handler in self._group.member_isolation_handlers:
            if handler.bypassed:
                await handler.release_bypassed()
            else:
                await handler.reevaluate()

    async def clear_meta(self, key: str) -> None:
        """Re-apply every rule whose trigger is still active."""
        _LOGGER.debug(
            "[%s] Meta-Key cleanup: isolation_bypass absent → re-evaluating isolation rules",
            self._group.entity_id,
        )
        # Withdraw the key before re-evaluating: the handlers ask `bypassed` (and
        # through it config_overrides) on every step.
        self._group.run_state = self._group.run_state.clear_config_overrides({key})
        for handler in self._group.member_isolation_handlers:
            await handler.reevaluate()


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

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Use the explicit value if given, otherwise read from target_state.

        The offset branch is keyed on the attribute, not on `value` being absent:
        a restore reaches this hook with the raw target already filled in as
        `value` (the caller expands `target_state` before selecting entities), so
        an offset branch guarded on `value is None` would never run on the path
        that needs it. `_get_target_value_with_offset()` shifts temperature
        attributes only, which is what keeps the pre-action payloads
        (`hvac_mode`, `preset_mode`) out of it.
        """
        if attr in TEMP_TARGET_ATTRS and self._apply_group_offset():
            return self._get_target_value_with_offset(attr, value)
        if value is not None:
            return value
        return getattr(self.target_state, attr, None)

    def _apply_group_offset(self) -> bool:
        """Shift the restore by the group offset, except during temporary state.

        A released member has to land on the same setpoint as the rest of the
        group. The pre-action payloads carry no temperature attribute, so only
        the restore is affected.
        """
        return not self._group.run_state.temporary_state_active

    def _get_capable_entities(self, attr: str, value: Any = None) -> list[str]:
        """Return only the single isolated entity (if capable)."""
        if (state := available_state(self._hass.states.get(self._entity_id))) is None:
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
