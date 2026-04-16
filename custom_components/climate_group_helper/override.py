"""Override managers — blocking sources, override state, and timers."""
from __future__ import annotations

import logging
from dataclasses import fields, replace
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import HVACMode
from homeassistant.core import callback
from homeassistant.helpers.event import async_call_later

from .const import CONF_WINDOW_ACTION, CONF_WINDOW_TEMPERATURE, WindowControlAction
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

    def async_setup(self) -> None:
        """Register call triggers to abort boost on user/mirror events."""
        self._group.climate_call_handler.register_call_trigger(self._on_service_call)
        self._group.sync_mode_call_handler.register_call_trigger(self._on_sync_call)

    def async_teardown(self) -> None:
        """Cancel any active boost timer."""
        self._group.boost_override_manager._cancel_timer()

    @callback
    def _on_service_call(self) -> None:
        """Abort boost on any direct user command."""
        self._group.boost_override_manager.abort()

    @callback
    def _on_sync_call(self) -> None:
        """Abort boost on MIRROR/MASTER adoption, not LOCK enforcement.

        MIRROR/MASTER sets last_source="sync_mode" on target_state before the
        trigger fires. LOCK never updates target_state, so last_source stays
        unchanged — that's how we distinguish the two.
        """
        if self._group.shared_target_state.last_source == "sync_mode":
            self._group.boost_override_manager.abort()


class BaseOverrideManager:
    """Base class for all override managers.

    Provides shared infrastructure:
    - call_handler property (override in derived classes)
    - enforce_block(): send OFF to deviating members during a block
    - _start_timer() / _cancel_timer(): shared timer slot keyed by OVERRIDE_NAME

    blocking_sources and active_override are owned here via RunState methods.
    """

    OVERRIDE_NAME: str = ""  # RunState active_override value when timer is active

    def __init__(self, group: ClimateGroup) -> None:
        self._group = group
        self._hass = group.hass
        self._timer: Any = None

    @property
    def call_handler(self):
        """Return the call handler for this override manager. Override in subclasses."""
        raise NotImplementedError

    def _start_timer(self, duration_seconds: float, on_expired) -> None:
        """Start an override timer. Sets active_override to OVERRIDE_NAME."""
        if duration_seconds <= 0:
            return
        self._cancel_timer()

        self._group.run_state = self._group.run_state.set_override(self.OVERRIDE_NAME, duration_seconds)

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

    @property
    def call_handler(self):
        return self._group.override_call_handler

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

        if self._group.run_state.active_override is None:
            self._group.run_state = replace(
                self._group.run_state,
                pre_override_snapshot=self._group.shared_target_state,
            )

        self._group.climate_state_manager.update(temperature=temperature)
        await self.call_handler.call_immediate()
        self._start_timer(duration_seconds, self._on_expired)

        _LOGGER.debug(
            "[%s] Boost started: temperature=%s, duration=%.0fs",
            self._group.entity_id, temperature, duration_seconds,
        )

    def abort(self) -> None:
        """Abort active boost without restore (manual override during boost)."""
        if self._group.run_state.active_override == "boost":
            self._cancel_timer()
            self._group.run_state = self._group.run_state.clear_override().clear_snapshot()
            _LOGGER.debug("[%s] Boost aborted", self._group.entity_id)

    async def _on_expired(self) -> None:
        """Boost timer expired — restore snapshot and apply schedule if active."""
        snapshot = self._group.run_state.pre_override_snapshot
        self._group.run_state = self._group.run_state.clear_override().clear_snapshot()
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
    """Manages the switch_off blocking source."""

    OVERRIDE_NAME = "switch"

    @property
    def call_handler(self):
        return self._group.switch_call_handler

    async def activate(self) -> None:
        """Add 'switch_off' to blocking_sources, abort boost, push members OFF."""
        self._group.boost_override_manager.abort()
        sources = self._group.run_state.blocking_sources | {"switch_off"}
        self._group.run_state = replace(self._group.run_state, blocking_sources=sources)
        if self._group.hvac_mode != HVACMode.OFF:
            await self.call_handler.call_immediate({"hvac_mode": HVACMode.OFF})

    async def restore(self) -> None:
        """Remove 'switch_off' from blocking_sources; restore members if no other block."""
        sources = self._group.run_state.blocking_sources - {"switch_off"}
        self._group.run_state = replace(self._group.run_state, blocking_sources=sources)
        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()

    async def enforce_override(self) -> None:
        """Push OFF to deviating members when switch_off block is active.

        Uses WindowControlCallHandler (bypasses blocking_sources, respects isolated_members).
        """
        if "switch_off" not in self._group.run_state.blocking_sources:
            return
        _LOGGER.debug(
            "[%s] switch enforce_override (sources=%s)",
            self._group.entity_id, self._group.run_state.blocking_sources,
        )
        await self._group.window_control_call_handler.call_debounced({"hvac_mode": HVACMode.OFF})


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
        sources = self._group.run_state.blocking_sources | {"window"}
        self._group.run_state = replace(self._group.run_state, blocking_sources=sources)
        payload = self._active_data()
        if payload.get("hvac_mode") == HVACMode.OFF and self._group.hvac_mode == HVACMode.OFF:
            return
        await self.call_handler.call_immediate(payload)

    async def restore(self) -> None:
        """Remove 'window' from blocking_sources; restore members if no other block."""
        sources = self._group.run_state.blocking_sources - {"window"}
        self._group.run_state = replace(self._group.run_state, blocking_sources=sources)
        if not self._group.run_state.blocking_sources:
            await self.call_handler.call_immediate()

    async def enforce_override(self) -> None:
        """Push the active window override state to deviating members.

        Only runs when 'window' is in blocking_sources — SwitchOverrideManager
        handles its own enforcement (always OFF via SwitchCallHandler).
        Uses WindowControlCallHandler (bypasses blocking_sources, respects isolated_members).
        """
        if "window" not in self._group.run_state.blocking_sources:
            return
        _LOGGER.debug(
            "[%s] enforce_override (sources=%s)",
            self._group.entity_id, self._group.run_state.blocking_sources,
        )
        await self.call_handler.call_debounced(self._active_data())