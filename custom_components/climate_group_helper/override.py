"""Override managers — blocking sources, override state, and timers."""
from __future__ import annotations

import logging
from dataclasses import replace
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import callback
from homeassistant.helpers.event import async_call_later
from homeassistant.util import dt as dt_util

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
    def _on_service_call(self, data: dict[str, Any] | None = None) -> None:  # noqa: ARG002
        """Abort boost on any direct user command."""
        self.override_manager.abort(push=True)

    @callback
    def _on_sync_call(self, data: dict[str, Any] | None = None) -> None:  # noqa: ARG002
        """Abort boost on MIRROR/MASTER adoption, not LOCK enforcement."""
        if self._group.shared_target_state.last_source == "sync_mode":
            self.override_manager.abort(push=True)


class BaseOverrideManager:
    """Base class for all override managers.

    Provides shared infrastructure:
    - call_handler property (override in derived classes)
    - enforce_block(): send OFF to deviating members during a block
    - _start_timer() / _cancel_timer(): shared timer slot with token protection
    """

    OVERRIDE_NAME: str = "base"

    def __init__(self, group: ClimateGroupHelper) -> None:
        self._group = group
        self._hass = group.hass
        self._timer: Any = None

    @property
    def call_handler(self) -> OverrideCallHandler:
        """Return the call handler for this override manager. Override in subclasses."""
        return self._group.override_call_handler

    def _start_timer(self, duration: float, on_expired: Any) -> None:
        """Start an override timer."""
        if duration <= 0:
            return
        self._cancel_timer()

        @callback
        def _handle_timeout(_now: Any) -> None:
            self._timer = None
            self._hass.async_create_task(on_expired())

        self._timer = async_call_later(self._hass, duration, _handle_timeout)
        _LOGGER.debug(
            "[%s] %s timer started: %.0fs",
            self._group.entity_id, self.OVERRIDE_NAME, duration,
        )

    def _cancel_timer(self) -> None:
        """Cancel the active timer."""
        if self._timer:
            self._timer()
            self._timer = None
            _LOGGER.debug("[%s] %s timer cancelled", self._group.entity_id, self.OVERRIDE_NAME)

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
        """Re-assert the remaining active block with the highest priority."""
        sources = self._group.run_state.blocking_sources
        if "switch" in sources:
            await self._group.switch_override_manager.enforce_override()
        elif "window" in sources:
            await self._group.window_override_manager.enforce_override(wake_members=True)
        elif "presence" in sources:
            await self._group.presence_override_manager.enforce_override(wake_members=True)


class BoostOverrideManager(BaseOverrideManager):
    """Manages the boost override directly on the actuators without mutating target_state."""

    OVERRIDE_NAME = "boost"

    async def activate(self, temperature: float, duration: float) -> bool:
        """Start boost override directly on members.

        Rejected if any blocking source is active. TargetState is NOT modified.
        Returns False if rejected, True if started.
        """
        if self._group.run_state.blocking_sources:
            _LOGGER.warning(
                "[%s] Boost rejected: block active (%s)",
                self._group.entity_id, self._group.run_state.blocking_sources,
            )
            return False

        end_time = dt_util.now() + timedelta(seconds=duration)
        self._group.run_state = replace(
            self._group.run_state,
            boost_temperature=temperature,
            boost_until=end_time,
        )

        self._start_timer(duration, self._on_expired)

        payload: dict[str, Any] = {"temperature": temperature}
        if self._group.shared_target_state.hvac_mode == HVACMode.OFF:
            fallback_mode = self._group.run_state.last_active_hvac_mode or HVACMode.HEAT
            payload["hvac_mode"] = fallback_mode

        await self.call_handler.call_immediate(payload)
        self._group.async_defer_or_update_ha_state()

        _LOGGER.debug(
            "[%s] Boost started: temperature=%s, duration=%.0fs",
            self._group.entity_id, temperature, duration,
        )
        return True

    def abort(self, push: bool = True) -> None:
        """Abort active boost.

        Cancels the timer, clears boost fields from run_state, and pushes the
        full target_state back to members (unless suppressed by an incoming block).
        """
        if self._group.run_state.boost_temperature is not None:
            self._cancel_timer()
            self._group.run_state = replace(
                self._group.run_state,
                boost_temperature=None,
                boost_until=None,
            )
            if push and not self._group.run_state.blocking_sources:
                self._hass.async_create_task(self.call_handler.call_immediate())
            self._group.async_defer_or_update_ha_state()
            _LOGGER.debug("[%s] Boost aborted (push=%s)", self._group.entity_id, push)

    async def _on_expired(self) -> None:
        """Boost timer expired — push full target_state back to members."""
        if self._timer is not None:
            # A newer timer is active — this expiry is stale (a new boost
            # replaced this one before its expiry task ran). The timer handle
            # itself is the identity marker, no token needed.
            _LOGGER.debug("[%s] Stale boost _on_expired skipped (new timer active)", self._group.entity_id)
            return
        if self._group.run_state.boost_temperature is None:
            return

        self._group.run_state = replace(
            self._group.run_state,
            boost_temperature=None,
            boost_until=None,
        )
        _LOGGER.debug("[%s] Boost expired, boost_temperature cleared", self._group.entity_id)

        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()
        self._group.async_defer_or_update_ha_state()


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
        self._group.boost_override_manager.abort(push=False)
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
            _LOGGER.warning(
                "[%s] Window action is TEMPERATURE but no window_temperature configured — falling back to OFF",
                self._group.entity_id,
            )
        return {"hvac_mode": HVACMode.OFF}

    async def activate(self) -> None:
        """Add 'window' to blocking_sources and push members.

        Sends OFF or the configured window temperature, depending on window_action.
        Skipped if already OFF and action is OFF (no-op guard based on member states).
        """
        self._group.boost_override_manager.abort(push=False)
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
        self._group.boost_override_manager.abort(push=False)
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
        """Push the away payload to deviating members while 'presence' is active."""
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
