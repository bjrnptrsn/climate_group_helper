"""Schedule handler for automatic state changes based on HA Schedule entities."""

from __future__ import annotations

import logging
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, replace
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.const import STATE_ON
from homeassistant.core import callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event
from homeassistant.util import dt as dt_util

from .const import (
    CONF_SCHEDULE_ENTITY,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_SCHEDULE_FALLBACK_PAYLOAD,
    CONF_SCHEDULE_HOLD_DURATION,
    FLOAT_TOLERANCE,
)
from .state import is_available
from .meta_processor import MetaProcessResult
from .service_call import SYNC_TARGET, SyncTarget
from .payload import (
    parse_entity_state,
    parse_fallback_payload,
    split_payload,
    validate_climate_payload,
)


def _attr_values_match(val1: Any, val2: Any) -> bool:
    """Compare attribute values with float tolerance for numeric attributes."""
    if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
        return abs(val1 - val2) <= FLOAT_TOLERANCE
    return val1 == val2


if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .state import ScheduleStateManager, TargetState
    from .service_call import ScheduleCallHandler


_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class SlotContext:
    """One slot run's climate payloads, as read and meta-processed.

    Pure data — no policy. `_read_slots()` builds it; `SlotResolver.record()`
    and the handlers' `on_slot_change()` decide what it means for
    `target_state` and for the members.
    """

    main_payload: dict[str, Any]
    bypass_payload: dict[str, Any]
    bypass_active: bool


class SlotResolver:
    """Bookkeeping for the main/bypass merge and the bypass claims.

    Runs on every slot change, not only while a bypass is active: the bypass is
    a priority *layer* over the main slot, and `record()` merges the two of
    them into what belongs in `target_state`.

    It owns `run_state.schedule_bypass_claims` (persisted, hence the established name):
    one entry per attribute the bypass currently holds, `(pre_value,
    written_value)`.

    - `pre_value` is the anchor — what the attribute falls back to when the
      bypass lets go. It is kept up to date from the main, so an attribute
      returns to the slot that is current then, not to the one that was current
      when the bypass took over.
    - `written_value` is what this class last wrote there itself, which is how a
      manual change is recognised: nothing else writes the bypass layer, so a
      live value differing from it came from somebody else. That only holds as
      long as `written_value` is never updated without an actual write.

    Carries no policy on what to *send* — only the handlers know whether a
    given run may reach the members (§ handler docstrings).
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group

    @property
    def _entries(self) -> dict[str, tuple[Any, Any]]:
        return dict(self._group.run_state.schedule_bypass_claims)

    def _store(self, entries: dict[str, tuple[Any, Any]]) -> None:
        self._group.run_state = self._group.run_state.set_bypass_claims(entries)

    @property
    def _target_state(self) -> TargetState:
        return self._group.shared_target_state

    def record(self, ctx: SlotContext) -> dict[str, Any]:
        """Merge one slot run into what belongs in `target_state`.

        Bypass active: the main is written, the bypass sits on top (claim
        upkeep below). Bypass inactive: releases every claim still held — a
        slot can go inactive without the bypass handler's own event marking
        it (a runtime entity switch), and leftover claims must not linger in
        persisted state forever — and merges the main over the restores.
        """
        if ctx.bypass_active:
            return self._record_active(ctx.main_payload, ctx.bypass_payload)
        return {**self.release(), **ctx.main_payload}

    def _record_active(
        self,
        main_payload: dict[str, Any],
        bypass_payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Bypass is running: the main is written, the bypass sits on top.

        Two pieces of claim upkeep happen here, and the order between them
        matters: the anchor is refreshed from the main *before* keys that left
        the bypass are released, so a released key falls back to the main value
        that is current now, not to the one the bypass first covered.
        """
        entries: dict[str, tuple[Any, Any]] = self._entries
        released: dict[str, Any] = {}

        # Anchor upkeep: the main moving underneath a held attribute is what
        # that attribute has to return to, not whatever it held days ago.
        for attr, (pre_value, written) in entries.items():
            if attr in main_payload:
                entries[attr] = (main_payload[attr], written)

        # Keys that left the bypass payload end there and then.
        for attr in list(entries):
            if attr in bypass_payload:
                continue
            pre_value, written = entries.pop(attr)
            if attr not in main_payload:
                released[attr] = self._release_value(attr, pre_value, written)

        for attr, value in bypass_payload.items():
            pre_value = (
                entries[attr][0]
                if attr in entries
                else main_payload.get(attr, getattr(self._target_state, attr, None))
            )
            entries[attr] = (pre_value, value)

        self._store(entries)
        return {**released, **main_payload, **bypass_payload}

    def release(self) -> dict[str, Any]:
        """Release every claim and return what each attribute falls back to."""
        restored = {
            attr: self._release_value(attr, pre_value, written)
            for attr, (pre_value, written) in self._entries.items()
        }
        self._group.run_state = self._group.run_state.clear_bypass_claims()
        return restored

    def _release_value(self, attr: str, pre_value: Any, written: Any) -> Any:
        """Resolve one attribute the bypass is letting go of.

        The bypass value still standing means nobody touched it, so it goes back
        to its anchor. Anything else was set after our write and is more recent
        than the bypass instruction — it stays. A user who happened to pick the
        bypass value exactly is indistinguishable here and gets reset.
        """
        live = getattr(self._target_state, attr, None)
        return pre_value if _attr_values_match(live, written) else live


class BaseScheduleHandler(ABC):
    """Shared logic for main schedule and bypass layers.

    Drives the slot processing pipeline (on_slot_change) with pure climate
    resolution and bypass claim tracking.

    Derived classes:
    - MainScheduleHandler: subscribes to the main schedule/calendar entity.
    - BypassScheduleHandler: subscribes to the bypass entity.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group
        self._hass = group.hass
        self.slot_resolver = SlotResolver(group)

    @property
    def state_manager(self) -> ScheduleStateManager:
        return self._group.schedule_state_manager

    @property
    def call_handler(self) -> ScheduleCallHandler:
        return self._group.schedule_call_handler

    @property
    def target_state(self) -> TargetState:
        return self._group.shared_target_state

    @property
    def _hold_active(self) -> bool:
        """True while a manual hold defers the main slot's climate payload.

        While set, the main schedule must not write its climate payload into
        `target_state` nor push it: the group's intended state is the manual
        change, and an enforcing sync mode would otherwise pull the slot value
        back onto the members.
        """
        return self._group.run_state.schedule_hold_until is not None

    @property
    def slot_transition_lock(self) -> asyncio.Lock:
        """Return the shared group-level slot transition lock."""
        return self._group.slot_transition_lock

    @property
    @abstractmethod
    def schedule_entity_id(self) -> str | None:
        """Return the active main schedule entity ID."""

    @property
    @abstractmethod
    def bypass_entity_id(self) -> str | None:
        """Return the active bypass entity ID."""

    @property
    def active_layer(self) -> str:
        """Return the currently active schedule layer ('main' | 'bypass' | 'fallback' | 'none')."""
        bypass_eid = self.bypass_entity_id
        if bypass_eid and (bypass_state := self._hass.states.get(bypass_eid)) and bypass_state.state == "on":
            return "bypass"
        schedule_eid = self.schedule_entity_id
        if schedule_eid and (main_state := self._hass.states.get(schedule_eid)):
            if main_state.state == "on":
                return "main"
            if main_state.state == "off" and self._group.schedule_handler.fallback_payload:
                return "fallback"
        return "none"

    @property
    def active_climate_payload(self) -> dict[str, Any]:
        """Return the climate attributes the active layer actually carries.

        `active_layer` names a layer from the entity's state alone. A slot that
        is "on" but carries meta-keys only defines no target, so the physical
        cold-start seed must still run for it. An empty dict means "no climate
        target active".
        """
        layer = self.active_layer
        if layer == "none":
            return {}
        if layer == "fallback":
            raw = dict(self._group.schedule_handler.fallback_payload)
        else:
            entity_id = self.bypass_entity_id if layer == "bypass" else self.schedule_entity_id
            state = self._hass.states.get(entity_id) if entity_id else None
            if state is None:
                return {}
            raw = self.parse_entity_state(state)
        climate, _ = split_payload(raw)
        return climate

    def parse_entity_state(self, state: Any) -> dict[str, Any]:
        """Extract a slot data dict from a schedule or calendar entity."""
        return parse_entity_state(state)

    def _validate_climate_payload(self, entity_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Filter a climate payload, dropping invalid values with a warning."""
        return validate_climate_payload(entity_id, payload, context="Schedule slot")

    async def _read_slots(self) -> SlotContext:
        """Read both entity states, process meta-keys, validate — pure data, no policy."""
        main_state = self._hass.states.get(self.schedule_entity_id) if self.schedule_entity_id else None
        bypass_state = self._hass.states.get(self.bypass_entity_id) if self.bypass_entity_id else None

        if self.schedule_entity_id and main_state:
            if main_state.state == "on":
                main_data = self.parse_entity_state(main_state)
            elif main_state.state == "off" and (fallback_payload := self._group.schedule_handler.fallback_payload):
                main_data = dict(fallback_payload)
            else:
                main_data = {}
        else:
            main_data = {}

        bypass_data = self.parse_entity_state(bypass_state) if (bypass_state and bypass_state.state == "on") else {}
        bypass_on = bypass_state is not None and bypass_state.state == "on"

        _LOGGER.debug(
            "[%s] Slot change: main=%s, bypass=%s (bypass_on=%s)",
            self._group.entity_id, list(main_data.keys()) or "off",
            list(bypass_data.keys()) or "off", bypass_on
        )

        result: MetaProcessResult = await self._group.slot_meta_processor.process(main_data, bypass_data)

        main_payload = self._validate_climate_payload(self._group.entity_id, result.climate_payload)
        bypass_payload = self._validate_climate_payload(self._group.entity_id, result.climate_bypass_payload)

        # An entity that is on but carries nothing is not a bypass someone
        # configured — see MetaProcessResult.bypass_has_content.
        bypass_active = bypass_on and result.bypass_has_content

        return SlotContext(main_payload, bypass_payload, bypass_active)

    def _update_state(self, record: dict[str, Any]) -> None:
        if record:
            self.state_manager.update(**record)

    async def _call_members(self, command: dict[str, Any] | SyncTarget | None) -> None:
        if command is not None and not self._group.run_state.temporary_state_active:
            await self.call_handler.call_immediate(command)


class MainScheduleHandler(BaseScheduleHandler):
    """Manages the main schedule entity: listener lifecycle and dynamic entity switching."""

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._schedule_entity = group.config.get(CONF_SCHEDULE_ENTITY) if group.advanced_mode else None
        raw_fallback = group.config.get(CONF_SCHEDULE_FALLBACK_PAYLOAD, "") if group.advanced_mode else ""
        self._config_fallback_payload: dict[str, Any] = parse_fallback_payload(
            raw_fallback, group.entity_id, raise_on_error=False, context="Fallback schedule payload"
        )
        self._fallback_payload_override: dict[str, Any] | None = None
        super().__init__(group)
        self._unsub_listener: Callable[[], None] | None = None
        _LOGGER.debug(
            "[%s] Schedule main handler initialized: main='%s' (fallback_payload=%s)",
            group.log_id, self._schedule_entity,
            list(self.fallback_payload.keys()) or "(none)",
        )

    @property
    def fallback_payload(self) -> dict[str, Any]:
        """Return the effective fallback slot payload for inactive schedule periods."""
        if self._fallback_payload_override is not None:
            return self._fallback_payload_override
        return self._config_fallback_payload

    @property
    def config_fallback_payload(self) -> dict[str, Any]:
        """Return the configured baseline fallback slot payload."""
        return self._config_fallback_payload

    @property
    def schedule_entity_id(self) -> str | None:
        """Return the active main schedule entity ID."""
        return self._schedule_entity

    @property
    def bypass_entity_id(self) -> str | None:
        """Delegate to BypassScheduleHandler — single source of truth."""
        return self._group.schedule_bypass_handler.bypass_entity_id

    async def on_slot_change(self) -> None:
        """Read both layers, merge into target_state, send if no bypass is active.

        The main handler never sees a bypass end — that is only ever observed
        by the bypass handler's own event (§ BypassScheduleHandler). A run here
        during an active bypass records the main in the background and sends
        nothing; the bypass layer owns the members until it lets go.
        """
        async with self.slot_transition_lock:
            ctx = await self._read_slots()
            record = self.slot_resolver.record(ctx)
            # The hold defers only the climate payload: `_read_slots()` has
            # already run the meta-keys and `record()` its claim bookkeeping.
            if self._hold_active:
                _LOGGER.debug(
                    "[%s] Slot climate deferred — manual hold active", self._group.entity_id
                )
                return
            self._update_state(record)
            if not ctx.bypass_active:
                await self._call_members(ctx.main_payload)

    async def async_setup(self) -> None:
        """Subscribe to the schedule entity."""
        self._subscribe()
        _LOGGER.debug(
            "[%s] Schedule handler setup complete (subscribed to: %s)",
            self._group.entity_id, self._schedule_entity
        )

    def async_teardown(self) -> None:
        """Unsubscribe from the schedule entity."""
        self._unsubscribe()

    def _subscribe(self) -> None:
        if not self._schedule_entity:
            return

        @callback
        def handle_state_change(event: Any) -> None:
            if not is_available(event.data.get("new_state")):
                return
            self._hass.async_create_background_task(
                self.on_slot_change(), name="climate_group_schedule_slot_change"
            )

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._schedule_entity], handle_state_change
        )

    def _unsubscribe(self) -> None:
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    def restore_schedule_entity(self, entity_id: str) -> None:
        """Restore active schedule entity from persisted state."""
        self._schedule_entity = entity_id

    def restore_fallback_payload(self, fallback_payload: dict[str, Any]) -> None:
        """Restore fallback payload override from persisted state."""
        self._fallback_payload_override = fallback_payload

    async def update_schedule_entity(self, new_entity_id: str | None, apply: bool = True) -> None:
        """Switch the active schedule entity at runtime (service: set_schedule_entity).

        Passing None reverts to the configured default schedule entity.
        """
        self._unsubscribe()
        is_reset = not new_entity_id
        old_entity_id = self._schedule_entity
        self._schedule_entity = new_entity_id or self._group.config.get(CONF_SCHEDULE_ENTITY)

        if is_reset:
            _LOGGER.debug(
                "[%s] Schedule reset to configured default: %s",
                self._group.entity_id,
                self._schedule_entity or "(none)",
            )
        else:
            _LOGGER.debug(
                "[%s] Switching schedule entity: '%s' → '%s'",
                self._group.entity_id,
                old_entity_id,
                new_entity_id,
            )

        if self._schedule_entity:
            self._subscribe()
        if apply:
            await self.on_slot_change()

    async def update_fallback_payload(self, new_payload: Any = None, apply: bool = True) -> None:
        """Switch or reset the fallback slot payload at runtime (service: set_schedule_fallback_payload).

        Passing None, an empty string, or an empty dict clears the runtime override
        and reverts to the configured default fallback payload.
        """
        if not new_payload or (isinstance(new_payload, str) and not new_payload.strip()):
            self._fallback_payload_override = None
            _LOGGER.debug(
                "[%s] Schedule fallback payload reset to configured default: %s",
                self._group.entity_id,
                list(self._config_fallback_payload.keys()) or "(none)",
            )
        else:
            parsed = parse_fallback_payload(
                new_payload,
                self._group.entity_id,
                raise_on_error=True,
                context="Fallback schedule payload",
            )
            self._fallback_payload_override = parsed if parsed else None
            _LOGGER.debug(
                "[%s] Schedule fallback payload override set: %s",
                self._group.entity_id,
                list(self._fallback_payload_override.keys()) if self._fallback_payload_override else "(none, reset to config)",
            )

        self._group.async_defer_or_update_ha_state()

        if self._schedule_entity and apply:
            await self.on_slot_change()


class BypassScheduleHandler(BaseScheduleHandler):
    """Manages the bypass entity lifecycle (e.g. a vacation calendar).

    The bypass layer sits above the main schedule but below blocking sources.
    It has no timer — on_slot_change() is called directly on every state change.
    MainScheduleHandler.async_setup() must run first so the main entity is already
    subscribed when the startup check fires here.
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._bypass_entity = group.config.get(CONF_SCHEDULE_BYPASS_ENTITY) if group.advanced_mode else None
        super().__init__(group)
        self._unsub_listener: Callable[[], None] | None = None
        _LOGGER.debug(
            "[%s] Schedule bypass handler initialized: bypass='%s'",
            group.log_id, self._bypass_entity
        )

    @property
    def schedule_entity_id(self) -> str | None:
        """Delegate to MainScheduleHandler — single source of truth."""
        return self._group.schedule_handler.schedule_entity_id

    @property
    def bypass_entity_id(self) -> str | None:
        """Return the active bypass entity ID."""
        return self._bypass_entity

    async def on_slot_change(self, was_active: bool = False) -> None:
        """Read both layers and decide what a bypass-triggered run means.

        `was_active` is never remembered — it is what the caller just observed
        (the bypass entity's own `old_state`, or `update_bypass_entity` reading
        the state before it switches). That is the only honest way to tell a
        bypass end apart from "no bypass ran": the claims alone cannot carry a
        meta-key-only bypass, which never fills them.

        Held claims are the fallback signal for an end this layer never saw —
        an entity returning via `unavailable` (that edge is dropped), or a
        runtime entity switch. They were still holding attributes on the
        members, and only a full re-sync takes those back off.
        """
        async with self.slot_transition_lock:
            ctx = await self._read_slots()
            had_claims = bool(self._group.run_state.schedule_bypass_claims)
            # Not every run of this listener is a bypass run: it also fires for
            # attribute-only updates on an inactive entity. Those three are.
            is_bypass_run = ctx.bypass_active or was_active or had_claims
            if is_bypass_run:
                self._group.schedule_hold_manager.clear()
            if ctx.bypass_active:
                record = self.slot_resolver.record(ctx)
                self._update_state(record)
                await self._call_members(record)
            elif was_active:
                await self._release_bypass(ctx)
            else:
                # Carries the main slot, so the hold gates it here too.
                record = self.slot_resolver.record(ctx)
                if self._hold_active:
                    return
                self._update_state(record)
                await self._call_members(SYNC_TARGET if had_claims else ctx.main_payload)

    async def _release_bypass(self, ctx: SlotContext) -> None:
        """Bypass end: release claims, record the main, full re-sync.

        Lives here deliberately, not on the base: only this layer ever
        observes an end, and the "only the bypass calls this" contract is
        meant to hold structurally, not by comment. Uses the shared base
        primitives `_update_state`/`_call_members`. `SYNC_TARGET` picks up
        both the restores and whatever the main accrued in one pass, rather
        than assuming either is still this run's payload.
        """
        self._update_state({**self.slot_resolver.release(), **ctx.main_payload})
        await self._call_members(SYNC_TARGET)

    def restore_bypass_entity(self, entity_id: str) -> None:
        """Restore active bypass entity from persisted state.

        Called before async_setup() subscribes, so the restored entity is the
        one that gets subscribed to.
        """
        self._bypass_entity = entity_id

    async def async_setup(self) -> None:
        """Subscribe to the bypass entity and apply current state if already active."""
        self._subscribe()

        # HA restart while a bypass event is already running: apply the current slot now.
        if self._bypass_entity:
            if state := self._hass.states.get(self._bypass_entity):
                if state.state == "on":
                    _LOGGER.debug("[%s] Bypass entity already active at startup — applying slot", self._group.entity_id)
                    await self.on_slot_change()

        _LOGGER.debug("[%s] Bypass handler setup complete (subscribed to: %s)", self._group.entity_id, self._bypass_entity)

    def async_teardown(self) -> None:
        """Unsubscribe from the bypass entity."""
        self._unsubscribe()

    def _subscribe(self) -> None:
        if not self._bypass_entity:
            return

        @callback
        def handle_state_change(event: Any) -> None:
            if not is_available(event.data.get("new_state")):
                return
            old_state = event.data.get("old_state")
            was_active = old_state is not None and old_state.state == STATE_ON
            self._hass.async_create_background_task(
                self.on_slot_change(was_active=was_active),
                name="climate_group_schedule_bypass_slot_change",
            )

        self._unsub_listener = async_track_state_change_event(
            self._hass, [self._bypass_entity], handle_state_change
        )

    def _unsubscribe(self) -> None:
        if self._unsub_listener:
            self._unsub_listener()
            self._unsub_listener = None

    async def update_bypass_entity(self, new_entity_id: str | None, apply: bool = True) -> None:
        """Switch the active bypass entity at runtime (service: set_schedule_bypass_entity).

        Passing None reverts to the configured default. If no default is configured,
        the bypass layer is cleared entirely.

        `apply=False` only suppresses the generic re-apply — it does not skip a
        bypass-end transition. Switching away from an entity that was `on` is
        observed here (the old entity's own state, read before we switch) and
        is a bypass end regardless of `apply`; otherwise a claim-free (e.g.
        meta-key-only) bypass ending via this path would never release, and a
        value the main accrued underneath it would be stranded.
        """
        was_active = bool(
            self._bypass_entity and (state := self._hass.states.get(self._bypass_entity)) and state.state == STATE_ON
        )

        self._unsubscribe()
        is_reset = not new_entity_id
        old_entity_id = self._bypass_entity
        self._bypass_entity = new_entity_id or self._group.config.get(CONF_SCHEDULE_BYPASS_ENTITY)

        if is_reset:
            _LOGGER.debug(
                "[%s] Bypass reset to configured default: %s",
                self._group.entity_id,
                self._bypass_entity or "(none)",
            )
        else:
            _LOGGER.debug(
                "[%s] Switching bypass entity: '%s' → '%s'",
                self._group.entity_id,
                old_entity_id,
                new_entity_id,
            )

        if self._bypass_entity:
            self._subscribe()
        if apply or was_active:
            await self.on_slot_change(was_active=was_active)


class ScheduleHoldManager:
    """Owns the manual schedule hold.

    A manual change (user command, MIRROR/MASTER adoption, or ADOPT_ONLY
    adoption) starts a timer for the configured duration; while it runs, the
    main schedule's climate payload is deferred (`BaseScheduleHandler._hold_active`).
    On expiry the then-current slot is applied.

    Triggered from `BaseStateManager.update()` — the one place `target_state`
    changes, with the resolved source — so blocked commands and retries never
    start a hold. The absolute deadline lives in `run_state.schedule_hold_until`
    and is exposed/persisted as a state attribute by `status.py`.
    """

    # `adopt_only` is a sync mode of its own source (AdoptStateManager.SOURCE),
    # so its adoption is listed explicitly rather than falling under `sync_mode`.
    TRIGGER_SOURCES = frozenset({"ui", "group", "sync_mode", "adopt_only"})

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group
        self._hass = group.hass
        self._timer: Any = None
        self._duration = self._resolve_duration()
        _LOGGER.debug(
            "[%s] Schedule hold initialized: duration=%.0fs",
            group.log_id, self._duration,
        )

    def _resolve_duration(self) -> float:
        """Return the configured hold duration in seconds (0 = disabled)."""
        if not self._group.advanced_mode:
            return 0.0
        try:
            minutes = float(self._group.config.get(CONF_SCHEDULE_HOLD_DURATION, 0))
        except (TypeError, ValueError):
            return 0.0
        return max(0.0, minutes) * 60.0

    def on_target_state_write(self, source: str | None) -> None:
        """Start or renew the hold when a manual source wrote `target_state`."""
        if self._duration <= 0.0 or source not in self.TRIGGER_SOURCES:
            return
        deadline = dt_util.utcnow() + timedelta(seconds=self._duration)
        self._group.run_state = replace(self._group.run_state, schedule_hold_until=deadline)
        self._start_timer(self._duration, self._on_expired)
        _LOGGER.debug(
            "[%s] Schedule hold started/renewed until %s",
            self._group.entity_id, dt_util.as_local(deadline),
        )

    def restore(self, raw: Any) -> None:
        """Re-arm a persisted deadline; a past deadline is dropped.

        Dropping (rather than expiring here) is deliberate: the caller runs
        before the startup slot apply, which then applies the current slot.
        """
        deadline = dt_util.parse_datetime(raw) if isinstance(raw, str) else raw
        if deadline is None or self._duration <= 0.0:
            return
        remaining = (deadline - dt_util.utcnow()).total_seconds()
        if remaining <= 0:
            return
        self._group.run_state = replace(self._group.run_state, schedule_hold_until=deadline)
        self._start_timer(remaining, self._on_expired)
        _LOGGER.debug(
            "[%s] Schedule hold restored until %s",
            self._group.entity_id, dt_util.as_local(deadline),
        )

    def clear(self) -> None:
        """Drop an active hold — a bypass run supersedes it."""
        self._cancel_timer()
        if self._group.run_state.schedule_hold_until is None:
            return
        self._group.run_state = replace(self._group.run_state, schedule_hold_until=None)
        self._group.async_defer_or_update_ha_state()
        _LOGGER.debug(
            "[%s] Schedule hold cleared — bypass supersedes it", self._group.entity_id
        )

    def _start_timer(self, duration: float, on_expired: Any) -> None:
        self._cancel_timer()

        @callback
        def _handle_timeout(_now: Any) -> None:
            self._timer = None
            self._hass.async_create_background_task(
                on_expired(), name="climate_group_schedule_hold_expired"
            )

        self._timer = async_call_later(self._hass, duration, _handle_timeout)

    def _cancel_timer(self) -> None:
        if self._timer:
            self._timer()
            self._timer = None

    async def _on_expired(self) -> None:
        # A newer hold replaced this expiry before its task ran — the timer
        # handle is the identity marker, same pattern as the boost.
        if self._timer is not None:
            return
        if self._group.run_state.schedule_hold_until is None:
            return
        self._group.run_state = replace(self._group.run_state, schedule_hold_until=None)
        self._group.async_defer_or_update_ha_state()
        await self._group.schedule_handler.on_slot_change()

    def async_teardown(self) -> None:
        self._cancel_timer()
