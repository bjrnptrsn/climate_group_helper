"""Override managers — blocking sources, override state, and timers."""
from __future__ import annotations

import logging
from dataclasses import replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import ATTR_HVAC_MODE, HVACMode
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import callback
from homeassistant.helpers.event import async_call_later

from .const import (
    CONF_PRESENCE_ACTION,
    CONF_PRESENCE_AWAY_OFFSET,
    CONF_PRESENCE_AWAY_PRESET,
    CONF_PRESENCE_AWAY_TEMPERATURE,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_TEMPERATURE,
    PresenceAction,
    WindowControlAction,
)
from .schedule import SHADOW_OWNER_BOOST, ScheduleCaller
from .state import BoostStateManager, TargetState

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .service_call import (
        OverrideCallHandler,
        SwitchCallHandler,
        SwitchEnforceCallHandler,
        WindowControlCallHandler,
        PresenceCallHandler,
    )

_LOGGER = logging.getLogger(__name__)


class OverrideHandler:
    """Coordinator for all override managers.

    Owns async_setup/async_teardown and routes call_triggers to BoostOverrideManager.
    Individual managers are instantiated on ClimateGroupHelper and accessed directly
    by their respective modules (window_control, switch, climate).
    """

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group

    @property
    def override_manager(self) -> BoostOverrideManager:
        return self._group.boost_override_manager

    def async_setup(self) -> None:
        """Register call triggers to abort boost on user/mirror events."""
        self._group.climate_call_handler.register_call_trigger(self._on_service_call)
        self._group.sync_mode_call_handler.register_call_trigger(self._on_sync_call)

    def async_teardown(self) -> None:
        """Cancel any active boost timer."""
        self.override_manager._cancel_timer()

    @callback
    def _on_service_call(self, data: dict[str, Any] | None = None) -> None:
        """Abort boost on any direct user command.

        The payload is forwarded so abort() can tell a user OFF command apart
        from other manual changes (an OFF command must survive the abort).
        """
        self.override_manager.abort(data)

    @callback
    def _on_sync_call(self, data: dict[str, Any] | None = None) -> None:  # noqa: ARG002
        """Abort boost on MIRROR/MASTER adoption, not LOCK enforcement.

        MIRROR/MASTER sets last_source="sync_mode" on target_state before the
        trigger fires. LOCK never updates target_state, so last_source stays
        unchanged — that's how we distinguish the two.
        """
        if self._group.shared_target_state.last_source == "sync_mode":
            self.override_manager.abort()


class BaseOverrideManager:
    """Base class for all override managers.

    Provides shared infrastructure:
    - call_handler property (override in derived classes)
    - enforce_block(): send OFF to deviating members during a block
    - _start_timer() / _cancel_timer(): shared timer slot keyed by OVERRIDE_NAME

    blocking_sources and active_override are owned here via RunState methods.
    """

    OVERRIDE_NAME: str = "base"  # RunState active_override value when timer is active

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group
        self._hass = group.hass
        self._timer: Any = None

    @property
    def call_handler(self) -> OverrideCallHandler:
        """Return the call handler for this override manager. Override in subclasses."""
        return self._group.override_call_handler

    def _start_timer(self, duration: float, on_expired: Any) -> None:
        """Start an override timer. Sets active_override to OVERRIDE_NAME.

        Cancels any existing timer first (via _cancel_timer, which calls clear_override).
        on_expired is scheduled as an async task when the timer fires; it must check
        active_override == OVERRIDE_NAME itself to guard against stale invocations.
        No-op if duration <= 0.
        """
        if duration <= 0:
            return
        self._cancel_timer(clear_state=False)

        self._group.run_state = self._group.run_state.set_override(self.OVERRIDE_NAME, duration)
        _LOGGER.debug("[%s] Setting override: '%s' for %s seconds", self._group.entity_id, self.OVERRIDE_NAME, duration)

        @callback
        def _handle_timeout(_now: Any) -> None:
            self._timer = None
            self._hass.async_create_task(on_expired())

        self._timer = async_call_later(self._hass, duration, _handle_timeout)
        _LOGGER.debug(
            "[%s] %s timer started: %.0fs (ends %s)",
            self._group.entity_id, self.OVERRIDE_NAME,
            duration, self._group.run_state.active_override_end.strftime("%H:%M:%S")
            if self._group.run_state.active_override_end else "unknown",
        )

    def _block(self) -> None:
        """Add OVERRIDE_NAME to blocking_sources."""
        self._group.run_state = replace(
            self._group.run_state,
            blocking_sources=self._group.run_state.blocking_sources | {self.OVERRIDE_NAME},
        )

    def _unblock(self) -> None:
        """Remove OVERRIDE_NAME from blocking_sources."""
        self._group.run_state = replace(
            self._group.run_state,
            blocking_sources=self._group.run_state.blocking_sources - {self.OVERRIDE_NAME},
        )

    def _any_member_not_off(self) -> bool:
        """Return True if any reachable, non-isolated member has an HVAC mode other than OFF."""
        return any(
            (st := self._group.read_member_state(eid))
            and st.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
            and st.state != HVACMode.OFF
            for eid in self._group.climate_entity_ids
            if eid not in self._group.run_state.isolated_members
        )

    def _save_snapshot(self) -> None:
        """Save current target_state as the shadow via the central lifecycle.

        Only gated on snapshot existence so consecutive overrides preserve the
        original reference state — deliberately NOT gated on active_override: a
        boost started while a schedule_override timer runs must still capture the
        current target_state — it is a valid pre-boost reference, and skipping it
        would leave the shadow to be created later from a target_state that
        already carries the boost temperature. The shadow is recorded with
        owner=SHADOW_OWNER_BOOST; when a bypass layer already owns it, this is a
        no-op.
        """
        self._group.schedule_handler.save_shadow(SHADOW_OWNER_BOOST)

    def _restore_snapshot(self) -> None:
        """Clear active_override, active_override_end, and the boost-owned shadow.

        Scoped via the central lifecycle (clear_shadow): only clears when the
        shadow belongs to the boost — a bypass-owned shadow is never touched.
        """
        self._group.run_state = self._group.run_state.clear_override()
        self._group.schedule_handler.clear_shadow(SHADOW_OWNER_BOOST)

    @property
    def _snapshot(self) -> TargetState | None:
        """Return the saved target_state snapshot, or None."""
        return self._group.run_state.target_state_snapshot

    def _cancel_timer(self, clear_state: bool = True) -> None:
        """Cancel the active timer and optionally clear override name/end via clear_override().

        If clear_state is True, active_override and active_override_end are cleared.
        target_state_snapshot is preserved — consecutive boosts keep the original
        snapshot. Full teardown (including snapshot) is done by the caller via
        clear_snapshot().

        clear_state runs even if the timer already fired (self._timer is None) —
        e.g. abort() racing a just-expired timer whose _on_expired task hasn't run
        yet. Gating clear_override() on self._timer would leave active_override
        stuck until that stale task happens to clear it.
        """
        if self._timer:
            self._timer()
            self._timer = None
            _LOGGER.debug("[%s] %s timer cancelled", self._group.entity_id, self.OVERRIDE_NAME)
        if clear_state:
            self._group.run_state = self._group.run_state.clear_override()

    def _inject_wake_mode(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Add the target hvac_mode to a payload that lacks one.

        Used only on the cascade path (_resolve_remaining_blocks): the released
        higher-priority block may have left members OFF, and a bare setpoint or
        preset payload won't wake them. No-op when the payload already carries
        an hvac_mode or the target itself is OFF.
        """
        if "hvac_mode" not in payload:
            target_hvac = self._group.shared_target_state.hvac_mode
            if target_hvac != HVACMode.OFF:
                return {**payload, "hvac_mode": target_hvac}
        return payload

    async def _resolve_remaining_blocks(self) -> None:
        """Re-assert the remaining active block with the highest priority.

        wake_members: the released block may have left members OFF (e.g.
        switch/window action OFF) — a bare setpoint/preset payload won't wake
        them, so the re-assert injects the target hvac_mode on top.
        """
        sources = self._group.run_state.blocking_sources
        if "switch" in sources:
            await self._group.switch_override_manager.enforce_override()
        elif "window" in sources:
            await self._group.window_override_manager.enforce_override(wake_members=True)
        elif "presence" in sources:
            await self._group.presence_override_manager.enforce_override(wake_members=True)


class BoostOverrideManager(BaseOverrideManager):
    """Manages the boost override with timer and snapshot."""

    OVERRIDE_NAME = "boost"

    @property
    def state_manager(self) -> BoostStateManager:
        """Return the boost state manager."""
        return self._group.boost_state_manager

    async def activate(self, temperature: float, duration: float) -> bool:
        """Start boost override: snapshot, temperature, timer.

        Rejected if any blocking source is active. Snapshot is saved only on
        the first boost so consecutive boosts preserve the original state.
        Returns False if rejected, True if the boost was started.
        """
        if self._group.run_state.blocking_sources:
            _LOGGER.warning(
                "[%s] Boost rejected: block active (%s)",
                self._group.entity_id, self._group.run_state.blocking_sources,
            )
            return False

        self._save_snapshot()
        self._group.run_state = replace(self._group.run_state, boost_temperature=temperature)
        self.state_manager.update(temperature=temperature)

        # Boost implies active operation: never leave members OFF with only a
        # set_temperature pending — force the last active HVAC mode (fallback: heat).
        if self._group.shared_target_state.hvac_mode == HVACMode.OFF:
            fallback_mode = self._group.run_state.last_active_hvac_mode or HVACMode.HEAT
            self.state_manager.update(hvac_mode=fallback_mode)

        self._start_timer(duration, self._on_expired)
        await self.call_handler.call_immediate()

        _LOGGER.debug(
            "[%s] Boost started: temperature=%s, duration=%.0fs",
            self._group.entity_id, temperature, duration,
        )
        return True

    def _cancel_timer(self, clear_state: bool = True) -> None:
        """Cancel the active timer and clear boost temperature."""
        super()._cancel_timer(clear_state=clear_state)
        if clear_state:
            self._group.run_state = replace(self._group.run_state, boost_temperature=None)

    def _restore_snapshot_to_target(self) -> None:
        """Restore snapshot values back to target state and clear snapshot from run_state.

        Only valid when the shadow is owned by the boost (abort() routes here
        exclusively after checking shadow_owner) — a bypass-owned shadow must
        never be written into target_state or cleared from here.

        The restore is attributed with source="schedule" instead of the boost
        SOURCE: a restore means the user is NOT in control anymore, and the
        sticky-override guard (schedule.py) keys on last_source to decide
        whether slot transitions may be applied. Leaving last_source="boost"
        behind would kill the basis schedule for good (no slot transition is
        accepted until a user command or reload resets the source).
        """
        snapshot = self._snapshot
        if snapshot:
            self._group.run_state = self._group.run_state.clear_override()
            self._group.schedule_handler.clear_shadow(SHADOW_OWNER_BOOST)
            restore_kwargs = self._group.schedule_handler._snapshot_to_kwargs(snapshot)
            self.state_manager.update(source="schedule", **restore_kwargs)

    def abort(self, data: dict[str, Any] | None = None) -> None:
        """Abort active boost.

        Restores the pre-boost snapshot ONLY if the boost temperature was never
        overridden by a manual change — checked via temperature ==
        boost_temperature. This subsumes a last_source check: as long as the
        setpoint still carries the boost value, unrelated attribute changes
        (e.g. fan_mode) or a basis slot re-assert may have moved last_source
        away without touching the temperature. The comparison is exact-safe:
        both sides carry the same verbatim-written value (no float drift).

        Deliberate consequence: manually setting EXACTLY the boost temperature
        during a boost also restores the snapshot — the visible jump back
        doubles as UI confirmation that the boost was aborted.

        OFF commands are the exception: a user turning the group OFF during a
        boost wants OFF, not the pre-boost state back. target_state already
        carries hvac_mode=off (written by the climate state manager before the
        trigger fired) — the snapshot must not overwrite it, otherwise the
        stale-call guard would discard the very OFF call the user issued and
        the abort sync would push the restored mode to all members.

        Shadow ownership: the shadow is only consumed when the boost created it
        (shadow_owner == SHADOW_OWNER_BOOST). With a bypass layer active the
        shadow belongs to the bypass — it is left untouched and the bypass layer
        re-asserts itself via the slot-change path (same as boost expiry), so the
        boost temperature leaves target_state and the members.
        """
        if self._group.run_state.active_override == "boost":
            boost_temperature = self._group.run_state.boost_temperature
            self._cancel_timer()

            if self._group.run_state.shadow_owner != SHADOW_OWNER_BOOST:
                _LOGGER.debug(
                    "[%s] Boost aborted — shadow kept (owned by %s)",
                    self._group.entity_id, self._group.run_state.shadow_owner,
                )
                # Re-assert the bypass layer: with the boost gone, the bypass is
                # the only remaining override — its payload must overwrite the
                # boost temperature on target_state and the members. NOTE: this
                # also overwrites a manual change that triggered the abort —
                # deliberate, the documented hierarchy is Bypass > User Commands.
                self._hass.async_create_task(
                    self._group.schedule_handler.on_slot_change(ScheduleCaller.RESYNC)
                )
                return

            if data and data.get(ATTR_HVAC_MODE) == HVACMode.OFF:
                _LOGGER.debug(
                    "[%s] Boost aborted by user OFF command — mode preserved, boost setpoint discarded",
                    self._group.entity_id,
                )
                # User command OFF: keep the OFF mode (already written to
                # target_state by the climate state manager before this trigger
                # fired) and discard the shadow, but roll the boost setpoint back
                # to the pre-boost value — otherwise turning the group back on
                # later would jump to the boost temperature.
                snapshot = self._snapshot
                self._restore_snapshot()
                if snapshot:
                    restore_kwargs = self._group.schedule_handler._snapshot_to_kwargs(snapshot)
                    restore_kwargs.pop(ATTR_HVAC_MODE, None)
                    # Attributed to the user command, not the boost: the user is
                    # in control (the sticky guard must keep blocking slot
                    # transitions) and the boost setpoint must not linger.
                    self.state_manager.update(source="group", **restore_kwargs)
            elif self._group.shared_target_state.temperature == boost_temperature:
                self._restore_snapshot_to_target()
                # Members must follow the restored target_state. abort() is
                # synchronous (called from the override call triggers), so the
                # member sync runs asynchronously.
                self._hass.async_create_task(self._sync_after_abort())
            else:
                self._restore_snapshot()
            _LOGGER.debug("[%s] Boost aborted", self._group.entity_id)

    async def _sync_after_abort(self) -> None:
        """Sync members to the (restored) target_state after a boost abort."""
        await self.call_handler.call_immediate()

    async def _on_expired(self) -> None:
        """Boost timer expired — restore shadow or delegate to schedule listener."""
        if self._group.run_state.active_override != "boost":
            _LOGGER.debug("[%s] Stale _on_expired skipped (new boost started before task ran)", self._group.entity_id)
            return

        # Clear boost from run_state
        self._group.run_state = self._group.run_state.clear_override()
        self._group.run_state = replace(self._group.run_state, boost_temperature=None)
        _LOGGER.debug("[%s] Boost expired, active_override and boost_temperature cleared", self._group.entity_id)

        schedule = self._group.schedule_handler
        schedule_active = False
        if schedule.schedule_entity_id:
            st = self._hass.states.get(schedule.schedule_entity_id)
            if st and st.state == "on" and schedule.parse_entity_state(st):
                schedule_active = True

        bypass_active = False
        if schedule.bypass_entity_id:
            st = self._hass.states.get(schedule.bypass_entity_id)
            if st and st.state == "on":
                bypass_active = True

        if schedule_active:
            await schedule.schedule_listener(caller=ScheduleCaller.RESYNC)
        elif bypass_active:
            # Bypass-only (no basis entity): schedule_listener would early-return
            # on its `if not self._schedule_entity` guard and never re-assert the
            # bypass — drive the slot processing directly instead.
            await schedule.on_slot_change(ScheduleCaller.RESYNC)
        else:
            async with schedule.slot_transition_lock:
                # No override layer is active anymore (no basis schedule, no
                # bypass) — this is always the LAST consumer, regardless of who
                # created the shadow: a bypass that ended while the boost ran
                # left a bypass-owned shadow behind, and nobody else will ever
                # consume it. Restoring unscoped here is therefore correct.
                await schedule.restore_shadow()


class SwitchOverrideManager(BaseOverrideManager):
    """Manages the switch blocking source (main switch).

    The main switch is the master: activating it ALWAYS sends OFF to all members
    (no state guard — a stale or unreported member state must never suppress the
    OFF command). The UI switch and the schedule meta-key `turn_off` are equal,
    interchangeable triggers for the same block — either one can activate or
    release it, whichever acts last wins.
    """

    OVERRIDE_NAME = "switch"

    @property
    def call_handler(self) -> SwitchCallHandler:  # type: ignore[override]
        return self._group.switch_call_handler

    @property
    def enforce_call_handler(self) -> SwitchEnforceCallHandler:
        return self._group.switch_enforce_call_handler

    def _notify_switch_entity(self) -> None:
        """Write the new block state to the ControlSwitch entity.

        The switch's is_on is derived from blocking_sources — without this push,
        external activations (schedule meta-key turn_off, restart restore) would
        leave the switch's HA state stale until its next unrelated state write.
        """
        if self._group.switch_state_callback:
            self._group.switch_state_callback()

    async def activate(self) -> None:
        """Add 'switch' to blocking_sources, abort boost, push members OFF.

        OFF is sent unconditionally — regardless of what members currently
        report — so the master switch is guaranteed to reach every device.
        """
        self._group.boost_override_manager.abort()
        self._block()
        self._notify_switch_entity()
        await self.call_handler.call_immediate({"hvac_mode": HVACMode.OFF})

    async def restore(self) -> None:
        """Remove 'switch' from blocking_sources; restore members if no other block."""
        self._unblock()
        self._notify_switch_entity()
        # Cancel our own pending debounced enforce call — it carries a stale payload
        # that must not land after the restore or the cascade re-assert.
        await self.enforce_call_handler.async_cancel_all()
        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()
        else:
            await self._resolve_remaining_blocks()

    async def enforce_override(self) -> None:
        """Push OFF to deviating members when switch block is active.

        Uses SwitchEnforceCallHandler (bypasses blocking_sources, respects isolated_members).
        """
        if "switch" not in self._group.run_state.blocking_sources:
            return
        _LOGGER.debug("[%s] Enforcing '%s' block on deviating members", self._group.entity_id, self.OVERRIDE_NAME)
        await self.enforce_call_handler.call_debounced({"hvac_mode": HVACMode.OFF})


class WindowOverrideManager(BaseOverrideManager):
    """Manages the window blocking source."""

    OVERRIDE_NAME = "window"

    def __init__(self, group: ClimateGroupHelper) -> None:
        super().__init__(group)
        self._window_action = group.config.get(CONF_WINDOW_ACTION, WindowControlAction.OFF)
        self._window_temperature: float | None = group.config.get(CONF_WINDOW_TEMPERATURE)

    @property
    def call_handler(self) -> WindowControlCallHandler:  # type: ignore[override]
        return self._group.window_control_call_handler

    def _active_data(self) -> dict[str, Any]:
        """Return the data dict for the active window override (OFF or temperature)."""
        if self._window_action == WindowControlAction.TEMPERATURE:
            if self._window_temperature is not None:
                return {"temperature": self._window_temperature}
            _LOGGER.warning("[%s] Window action is TEMPERATURE but no window_temperature configured — falling back to OFF",
                self._group.entity_id,
            )
        return {"hvac_mode": HVACMode.OFF}

    async def activate(self) -> None:
        """Add 'window' to blocking_sources and push members.

        Sends OFF or the configured window temperature, depending on window_action.
        Skipped if already OFF and action is OFF (no-op guard based on member states).

        Switch precedence: while the master switch is OFF, the window payload
        (especially a window TEMPERATURE) must not reach the members — the
        switch enforcement would immediately push OFF again (on/off flapping).
        The window push happens when the switch falls (switch restore re-asserts
        the window via _resolve_remaining_blocks).
        """
        self._block()
        if "switch" in self._group.run_state.blocking_sources:
            _LOGGER.debug("[%s] Window activation skipped — switch block takes precedence", self._group.entity_id)
            return
        payload = self._active_data()
        if payload.get("hvac_mode") == HVACMode.OFF and not self._any_member_not_off():
            return
        await self.call_handler.call_immediate(payload)

    async def restore(self) -> None:
        """Remove 'window' from blocking_sources; restore members if no other block."""
        self._unblock()
        # Cancel our own pending debounced enforce call — it carries a stale payload
        # that must not land after the restore or the cascade re-assert.
        await self.call_handler.async_cancel_all()
        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()
        else:
            await self._resolve_remaining_blocks()

    async def enforce_override(self, wake_members: bool = False) -> None:
        """Push the active window override state to deviating members.

        Only runs when 'window' is in blocking_sources — SwitchOverrideManager
        handles its own enforcement (always OFF via SwitchCallHandler).
        Uses WindowControlCallHandler (bypasses blocking_sources, respects isolated_members).

        wake_members (cascade path only): with window action TEMPERATURE the
        payload carries no hvac_mode — members left OFF by a released switch
        block would ignore the bare setpoint, so the target hvac_mode is
        injected. Regular deviation enforcement keeps the payload untouched.
        """
        if "window" not in self._group.run_state.blocking_sources:
            return
        # Switch takes precedence — SwitchOverrideManager already sends OFF to all members.
        if "switch" in self._group.run_state.blocking_sources:
            return
        _LOGGER.debug("[%s] Enforcing '%s' block on deviating members", self._group.entity_id, self.OVERRIDE_NAME)

        payload = self._active_data()
        if wake_members:
            payload = self._inject_wake_mode(payload)

        await self.call_handler.call_debounced(payload)


class PresenceOverrideManager(BaseOverrideManager):
    """Owns the 'presence' blocking source.

    Identical blocking profile to WindowOverrideManager: bypasses run_state.blocked
    but respects isolated_members. Lower priority than 'window' and 'switch' —
    enforce_override() is a no-op while either of those is active.
    """

    OVERRIDE_NAME = "presence"

    def __init__(self, group: ClimateGroupHelper) -> None:
        super().__init__(group)
        self._action = group.config.get(CONF_PRESENCE_ACTION, PresenceAction.OFF)
        self._away_offset = group.config.get(CONF_PRESENCE_AWAY_OFFSET, 0.0)
        self._away_temperature = group.config.get(CONF_PRESENCE_AWAY_TEMPERATURE)
        self._away_preset = group.config.get(CONF_PRESENCE_AWAY_PRESET)

    @property
    def call_handler(self) -> PresenceCallHandler:  # type: ignore[override]
        return self._group.presence_call_handler

    def _active_data(self) -> dict[str, Any]:
        """Compute the away payload against the current target_state at call time.

        AWAY_OFFSET is intentionally computed here (not at activate time) so that
        schedule changes during absence are reflected the next time enforce_override
        pushes the payload to a deviating member.
        """
        if self._action == PresenceAction.AWAY_OFFSET:
            base = self._group.shared_target_state.temperature
            group_offset = self._group.run_state.group_offset
            if base is not None:
                return {"temperature": round(base + group_offset + self._away_offset, 1)}
            _LOGGER.warning(
                "[%s] Presence AWAY_OFFSET: target temperature is None — falling back to OFF",
                self._group.entity_id,
            )
            return {"hvac_mode": HVACMode.OFF}
        if self._action == PresenceAction.AWAY_TEMPERATURE and self._away_temperature is not None:
            return {"temperature": self._away_temperature}
        if self._action == PresenceAction.AWAY_PRESET and self._away_preset:
            return {"preset_mode": self._away_preset}
        _LOGGER.warning(
            "[%s] Presence action '%s' could not produce a valid payload — falling back to OFF",
            self._group.entity_id,
            self._action,
        )
        return {"hvac_mode": HVACMode.OFF}

    async def activate(self) -> None:
        self._group.boost_override_manager.abort()
        self._block()
        # Window/switch already cover the members — don't send a conflicting command.
        if {"switch", "window"} & self._group.run_state.blocking_sources:
            return
        await self.call_handler.call_immediate(self._active_data())

    async def restore(self) -> None:
        self._unblock()
        # Cancel our own pending debounced enforce call — it carries a stale payload
        # that must not land after the restore or the cascade re-assert.
        await self.call_handler.async_cancel_all()
        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()
        else:
            await self._resolve_remaining_blocks()

    async def enforce_override(self, wake_members: bool = False) -> None:
        """Push the away payload to deviating members while 'presence' is active.

        wake_members is set only by _resolve_remaining_blocks(): the released
        higher-priority block may have left members OFF, and a bare setpoint or
        preset payload won't wake them — re-assert the target hvac_mode on top.
        Regular deviation enforcement keeps the payload untouched so a member
        turned OFF by hand during absence stays OFF.
        """
        if "presence" not in self._group.run_state.blocking_sources:
            return
        # Window and switch take precedence — their handlers already cover the members.
        if {"switch", "window"} & self._group.run_state.blocking_sources:
            return
        _LOGGER.debug("[%s] Enforcing '%s' block on deviating members", self._group.entity_id, self.OVERRIDE_NAME)

        payload = self._active_data()
        if wake_members:
            payload = self._inject_wake_mode(payload)

        await self.call_handler.call_debounced(payload)
