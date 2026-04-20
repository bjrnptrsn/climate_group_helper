"""Override managers — blocking sources, override state, and timers."""
from __future__ import annotations

import logging
from dataclasses import fields, replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
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
from .schedule import ScheduleCaller
from .state import ClimateState

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class OverrideHandler:
    """Coordinator for all override managers.

    Owns async_setup/async_teardown and routes call_triggers to BoostOverrideManager.
    Individual managers are instantiated on ClimateGroup and accessed directly
    by their respective modules (window_control, switch, climate).
    """

    def __init__(self, group: ClimateGroup) -> None:
        self._group = group

    @property
    def override_manager(self):
        return self._group.boost_override_manager

    def async_setup(self) -> None:
        """Register call triggers to abort boost on user/mirror events."""
        self._group.climate_call_handler.register_call_trigger(self._on_service_call)
        self._group.sync_mode_call_handler.register_call_trigger(self._on_sync_call)

    def async_teardown(self) -> None:
        """Cancel any active boost timer."""
        self.override_manager._cancel_timer()

    @callback
    def _on_service_call(self) -> None:
        """Abort boost on any direct user command."""
        self.override_manager.abort()

    @callback
    def _on_sync_call(self) -> None:
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

    def __init__(self, group: ClimateGroup) -> None:
        self._group = group
        self._hass = group.hass
        self._timer: Any = None

    @property
    def call_handler(self):
        """Return the call handler for this override manager. Override in subclasses."""
        return self._group.override_call_handler

    def _start_timer(self, duration_seconds: float, on_expired) -> None:
        """Start an override timer. Sets active_override to OVERRIDE_NAME."""
        if duration_seconds <= 0:
            return
        self._cancel_timer()

        self._group.run_state = self._group.run_state.set_override(self.OVERRIDE_NAME, duration_seconds)
        _LOGGER.debug("[%s] Setting override: '%s' for %s seconds", self._group.entity_id, self.OVERRIDE_NAME, duration_seconds)

        @callback
        def _handle_timeout(_now: Any) -> None:
            self._timer = None
            self._hass.async_create_task(on_expired())

        self._timer = async_call_later(self._hass, duration_seconds, _handle_timeout)
        _LOGGER.debug(
            "[%s] %s timer started: %.0fs (ends %s)",
            self._group.entity_id, self.OVERRIDE_NAME,
            duration_seconds, self._group.run_state.active_override_end.strftime("%H:%M:%S"),
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

    def _save_snapshot(self) -> None:
        """Save current target_state as pre-override snapshot (only if none exists yet).

        Only saved on the first activation so consecutive overrides preserve the
        original pre-override state.
        """
        if self._group.run_state.active_override is None:
            self._group.run_state = replace(
                self._group.run_state,
                pre_override_snapshot=self._group.shared_target_state,
            )

    def _restore_snapshot(self) -> None:
        """Clear active_override, active_override_end, and pre_override_snapshot."""
        self._group.run_state = self._group.run_state.clear_override().clear_snapshot()

    @property
    def _snapshot(self):
        """Return the saved pre-override snapshot, or None."""
        return self._group.run_state.pre_override_snapshot

    def _cancel_timer(self) -> None:
        """Cancel the active timer and clear override name/end via clear_override().

        pre_override_snapshot is preserved — consecutive boosts keep the original
        snapshot. Full teardown (including snapshot) is done by the caller via
        clear_snapshot().
        """
        if self._timer:
            self._timer()
            self._timer = None
            self._group.run_state = self._group.run_state.clear_override()
            _LOGGER.debug("[%s] %s timer cancelled", self._group.entity_id, self.OVERRIDE_NAME)


class BoostOverrideManager(BaseOverrideManager):
    """Manages the boost override with timer and snapshot."""

    OVERRIDE_NAME = "boost"

    async def activate(self, temperature: float, duration_seconds: float) -> None:
        """Start boost override: snapshot, temperature, timer.

        Rejected if any blocking source is active. Snapshot is saved only on
        the first boost so consecutive boosts preserve the original state.
        """
        if self._group.run_state.blocking_sources:
            _LOGGER.debug(
                "[%s] Boost rejected: block active (%s)",
                self._group.entity_id, self._group.run_state.blocking_sources,
            )
            return

        self._save_snapshot()
        self._group.climate_state_manager.update(temperature=temperature)
        self._start_timer(duration_seconds, self._on_expired)
        await self.call_handler.call_immediate()

        _LOGGER.debug(
            "[%s] Boost started: temperature=%s, duration=%.0fs",
            self._group.entity_id, temperature, duration_seconds,
        )

    def abort(self) -> None:
        """Abort active boost without restore (manual override during boost)."""
        if self._group.run_state.active_override == "boost":
            self._cancel_timer()
            self._restore_snapshot()
            _LOGGER.debug("[%s] Boost aborted", self._group.entity_id)

    async def _on_expired(self) -> None:
        """Boost timer expired — restore snapshot and apply schedule if active."""
        snapshot = self._snapshot
        self._restore_snapshot()
        _LOGGER.debug("[%s] Boost expired, active_override cleared", self._group.entity_id)

        schedule = self._group.schedule_handler
        if schedule.schedule_entity_id:
            await schedule.schedule_listener(caller=ScheduleCaller.RESYNC)
        elif snapshot:
            restore_kwargs = {
                f.name: getattr(snapshot, f.name)
                for f in fields(ClimateState)
                if getattr(snapshot, f.name, None) is not None
            }
            schedule.state_manager.update(**restore_kwargs)
            await self.call_handler.call_immediate()
            schedule._start_timer("resync")


class SwitchOverrideManager(BaseOverrideManager):
    """Manages the switch blocking source."""

    OVERRIDE_NAME = "switch"

    @property
    def call_handler(self):
        return self._group.switch_call_handler

    @property
    def enforce_call_handler(self):
        return self._group.switch_enforce_call_handler

    async def activate(self) -> None:
        """Add 'switch' to blocking_sources, abort boost, push members OFF."""
        self._group.boost_override_manager.abort()
        self._block()
        if self._group.hvac_mode != HVACMode.OFF:
            await self.call_handler.call_immediate({"hvac_mode": HVACMode.OFF})

    async def restore(self) -> None:
        """Remove 'switch' from blocking_sources; restore members if no other block."""
        self._unblock()
        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()

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

    def __init__(self, group: ClimateGroup) -> None:
        super().__init__(group)
        self._window_action = group.config.get(CONF_WINDOW_ACTION, WindowControlAction.OFF)
        self._window_temperature: float | None = group.config.get(CONF_WINDOW_TEMPERATURE)

    @property
    def call_handler(self):
        return self._group.window_control_call_handler

    def _active_data(self) -> dict:
        """Return the data dict for the active window override (OFF or temperature)."""
        if self._window_action == WindowControlAction.TEMPERATURE and self._window_temperature is not None:
            return {"temperature": self._window_temperature}
        return {"hvac_mode": HVACMode.OFF}

    async def activate(self) -> None:
        """Add 'window' to blocking_sources and push members.

        Sends OFF or the configured window temperature, depending on window_action.
        Skipped if already OFF and action is OFF (no-op guard).
        """
        self._block()
        payload = self._active_data()
        if payload.get("hvac_mode") == HVACMode.OFF and self._group.hvac_mode == HVACMode.OFF:
            return
        await self.call_handler.call_immediate(payload)

    async def restore(self) -> None:
        """Remove 'window' from blocking_sources; restore members if no other block."""
        self._unblock()
        if not self._group.run_state.blocking_sources:
            await self.call_handler.async_cancel_all()
            await self.call_handler.call_immediate()

    async def enforce_override(self) -> None:
        """Push the active window override state to deviating members.

        Only runs when 'window' is in blocking_sources — SwitchOverrideManager
        handles its own enforcement (always OFF via SwitchCallHandler).
        Uses WindowControlCallHandler (bypasses blocking_sources, respects isolated_members).
        """
        if "window" not in self._group.run_state.blocking_sources:
            return
        _LOGGER.debug("[%s] Enforcing '%s' block on deviating members", self._group.entity_id, self.OVERRIDE_NAME)
        await self.call_handler.call_debounced(self._active_data())


class PresenceOverrideManager(BaseOverrideManager):
    """Owns the 'presence' blocking source.

    Identical blocking profile to WindowOverrideManager: bypasses run_state.blocked
    but respects isolated_members. Lower priority than 'window' and 'switch' —
    enforce_override() is a no-op while either of those is active.
    """

    OVERRIDE_NAME = "presence"

    def __init__(self, group: ClimateGroup) -> None:
        super().__init__(group)
        self._action = group.config.get(CONF_PRESENCE_ACTION, PresenceAction.OFF)
        self._away_offset = group.config.get(CONF_PRESENCE_AWAY_OFFSET, -2.0)
        self._away_temperature = group.config.get(CONF_PRESENCE_AWAY_TEMPERATURE)
        self._away_preset = group.config.get(CONF_PRESENCE_AWAY_PRESET)

    @property
    def call_handler(self):
        return self._group.presence_call_handler

    def _active_data(self) -> dict:
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
            return {"hvac_mode": HVACMode.OFF}
        if self._action == PresenceAction.AWAY_TEMPERATURE and self._away_temperature is not None:
            return {"temperature": self._away_temperature}
        if self._action == PresenceAction.AWAY_PRESET and self._away_preset:
            return {"preset_mode": self._away_preset}
        return {"hvac_mode": HVACMode.OFF}

    async def activate(self) -> None:
        self._block()
        # Window/switch already cover the members — don't send a conflicting command.
        if {"switch", "window"} & self._group.run_state.blocking_sources:
            return
        await self.call_handler.call_immediate(self._active_data())

    async def restore(self) -> None:
        self._unblock()
        if not self._group.run_state.blocking_sources:
            # Cancel any pending debounced enforce call before sending the restore.
            await self.call_handler.async_cancel_all()
            await self.call_handler.call_immediate()

    async def enforce_override(self) -> None:
        if "presence" not in self._group.run_state.blocking_sources:
            return
        # Window and switch take precedence — their handlers already cover the members.
        if {"switch", "window"} & self._group.run_state.blocking_sources:
            return
        _LOGGER.debug("[%s] Enforcing '%s' block on deviating members", self._group.entity_id, self.OVERRIDE_NAME)
        await self.call_handler.call_debounced(self._active_data())