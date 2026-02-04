"""Service call execution logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
import time
from abc import ABC
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_HUMIDITY,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TEMPERATURE,
    DOMAIN as CLIMATE_DOMAIN,
    SERVICE_SET_TEMPERATURE,
    HVACMode,
)
from homeassistant.const import ATTR_ENTITY_ID, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Context, State
from homeassistant.helpers.debounce import Debouncer

from .const import (
    MODE_MODES_MAP,
    ATTR_SERVICE_MAP,
    CONF_IGNORE_OFF_MEMBERS,
    CONF_SYNC_ATTRS,
    SYNC_TARGET_ATTRS,
)
from .state import FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class BaseServiceCallHandler(ABC):
    """Base class for service call execution with debouncing and retry logic.

    This abstract base class provides the common infrastructure for:
    - Debouncing multiple rapid changes into a single execution
    - Retry logic for failed operations
    - Context-based call tagging for echo detection

    Derived classes must implement `_generate_calls()` to define how calls are generated.
    They can override CONTEXT_ID to set their own context identifier.
    """

    CONTEXT_ID: str = "service_call"  # Default context ID, override in derived classes

    def __init__(self, group: ClimateGroup):
        """Initialize the service call handler.

        Args:
            group: Reference to the parent ClimateGroup entity.
        """
        self._group = group
        self._hass = group.hass
        self._debouncer: Debouncer | None = None
        self._active_tasks: set[asyncio.Task] = set()
        self._call_triggers: list[Callable[[], Any]] = []

    @property
    def target_state(self):
        """Return the shared target state."""
        return self._group.shared_target_state

    async def async_cancel_all(self) -> None:
        """Cancel all active debouncers and running retry tasks."""
        if self._debouncer:
            self._debouncer.async_cancel()

        for task in self._active_tasks:
            task.cancel()

        if self._active_tasks:
            await asyncio.gather(*self._active_tasks, return_exceptions=True)

    async def call_immediate(self, data: dict[str, Any] | None = None) -> None:
        """Execute a service call immediately without debouncing."""
        await self._execute_calls(data)

    def register_call_trigger(self, callback: Callable[[], Any]) -> None:
        """Register a callback to be called after successful execution."""
        if callback not in self._call_triggers:
            self._call_triggers.append(callback)

    def _call_trigger(self) -> None:
        """Trigger all registered execution callbacks."""
        for callback_func in self._call_triggers:
            try:
                callback_func()
            except Exception as e:
                _LOGGER.error("[%s] Error in execution callback: %s", self._group.entity_id, e)

    async def call_debounced(self, data: dict[str, Any] | None = None) -> None:
        """Debounce and execute a service call."""

        async def debounce_func():
            """The coroutine to be executed after debounce."""
            task = asyncio.current_task()
            if task:
                self._active_tasks.add(task)
            try:
                await self._execute_calls(data)
            finally:
                if task:
                    self._active_tasks.discard(task)

        if not self._debouncer:
            self._debouncer = Debouncer(
                self._hass,
                _LOGGER,
                cooldown=self._group.debounce_delay,
                immediate=False,
                function=debounce_func,
            )
        else:
            self._debouncer.async_cancel()
            self._debouncer.function = debounce_func

        await self._debouncer.async_call()

    async def _execute_calls(self, data: dict[str, Any] | None = None) -> None:
        """Execute service calls with retry logic."""
        attempts = 1 + self._group.retry_attempts
        delay = self._group.retry_delay
        context_id = self.CONTEXT_ID

        # Check blocking BEFORE retry loop (state doesn't change between retries)
        if self._block_all_calls(data):
            _LOGGER.debug("[%s] Calls suppressed (source=%s): Blocking mode active (e.g. Window open)", self._group.entity_id, context_id)
            return

        # Trigger hook for calls
        self._call_trigger()

        for attempt in range(attempts):
            try:
                calls = self._generate_calls(data)

                if not calls:
                    _LOGGER.debug("[%s] No pending calls, stopping retry loop", self._group.entity_id)
                    return

                parent_id = self._get_parent_id()

                for call in calls:
                    service = call["service"]
                    data = {ATTR_ENTITY_ID: call["entity_ids"], **call["kwargs"]}

                    await self._hass.services.async_call(
                        domain=CLIMATE_DOMAIN,
                        service=service,
                        service_data=data,
                        blocking=True,
                        context=Context(id=context_id, parent_id=parent_id),
                    )

                    _LOGGER.debug("[%s] Call (%d/%d) '%s' with data: %s, Parent ID: %s", self._group.entity_id, attempt + 1, attempts, service, data, parent_id)

            except Exception as e:
                _LOGGER.warning("[%s] Call attempt (%d/%d) failed: %s", self._group.entity_id, attempt + 1, attempts, e)

            if attempts > 1 and attempt < (attempts - 1):
                await asyncio.sleep(delay)

    def _generate_calls(self, data: dict[str, Any] | None = None, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate service calls. Must be implemented by derived classes."""
        return self._generate_calls_from_dict(data, filter_state)

    def _generate_calls_from_dict(self, data: dict[str, Any] | None = None, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate service calls from a dict of target attributes.

        This is the central template method for call generation:
        - Filters attributes based on filter_state
        - Applies wake-up bug prevention (skip setpoints when target is OFF)
        - Handles temperature range specially (must be sent in one call)
        - Uses _get_call_entity_ids() for entity selection

        Args:
            data: Dict of attribute values to sync
            filter_state: Optional FilterState for attribute filtering.
                          Attributes with False are skipped.
        """
        calls = []
        temp_range_processed = False
        data = data or self.target_state.to_dict()
        filter_attrs = (filter_state or FilterState()).to_dict()

        # Inject kwargs
        data = self._inject_call_kwargs(data)

        for attr, value in data.items():
            # Skip None values
            if value is None:
                continue

            # Skip if attribute is filtered out
            if not filter_attrs.get(attr, True):
                continue

            # Skip if blocked
            if self._block_call_attr(data, attr):
                continue

            # Handle temperature range specially - must be sent in one call
            if attr in (ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
                if not temp_range_processed:
                    low = data.get(ATTR_TARGET_TEMP_LOW)
                    high = data.get(ATTR_TARGET_TEMP_HIGH)
                    if low is not None and high is not None:
                        if (entity_ids := self._get_call_entity_ids(attr)):
                            calls.append({
                                    "service": SERVICE_SET_TEMPERATURE,
                                "kwargs": {ATTR_TARGET_TEMP_LOW: low, ATTR_TARGET_TEMP_HIGH: high},
                                "entity_ids": entity_ids
                            })
                            temp_range_processed = True
                continue

            service = ATTR_SERVICE_MAP.get(attr)
            if not service:
                continue

            if (entity_ids := self._get_call_entity_ids(attr)):
                    calls.append({
                        "service": service,
                        "kwargs": {attr: value},
                        "entity_ids": entity_ids
                    })
        return calls

    def _get_call_entity_ids(self, attr: str) -> list[str]:
        """Get entity IDs for a given attribute.

        Default: returns all member entity IDs.
        Override in derived classes for diffing behavior.
        """
        return self._group.climate_entity_ids

    def _get_unsynced_entities(self, attr: str) -> list[str]:
        """Get members that need to be synced for this attribute.

        Compares current member state against target_state and returns
        only entities that differ from the target.

        Args:
            attr: The attribute to check
        """
        entity_ids = []

        target_value = getattr(self.target_state, attr, None)
        if target_value is None:
            return []

        for entity_id in self._group.climate_entity_ids:
            state = self._hass.states.get(entity_id)
            if not state:
                continue

            # Check mode support
            if attr in MODE_MODES_MAP:
                if target_value not in state.attributes.get(MODE_MODES_MAP[attr], []):
                    continue
            elif attr not in state.attributes:
                continue

            current_value = state.state if attr == ATTR_HVAC_MODE else state.attributes.get(attr)

            # Output Filter
            if self._block_unsynced_entity(attr, target_value, state):
                _LOGGER.debug("[%s] Skipping member %s", self._group.entity_id, entity_id)
                continue

            # Float tolerance check
            if attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH, ATTR_HUMIDITY):
                if self._group.within_tolerance(current_value, target_value):
                    continue

            if current_value != target_value:
                entity_ids.append(entity_id)

        return entity_ids

    def _get_parent_id(self) -> str:
        """Create a unique Parent ID for echo tracking.

        Format: "MasterEntityID|Timestamp"
        - MasterEntityID: The entity that triggered the change (primary, for "Sender Wins" logic)
        - Timestamp: When the command was sent (secondary, for stale echo detection)
        """
        master_entity = self.target_state.last_entity or ""
        timestamp = str(time.time())
        return f"{master_entity}|{timestamp}"

    # Filter hook to inject kwargs into service calls
    def _inject_call_kwargs(self, data: dict[str, Any]) -> dict[str, Any]:
        """Inject kwargs into the data dict."""
        return self._min_temp_when_off(data)

    def _min_temp_when_off(self, data: dict[str, Any]) -> dict[str, Any]:
        """Inject Min Temp if turning OFF and configured."""
        if not self._group.min_temp_off:
            return data
        if data.get(ATTR_HVAC_MODE) == HVACMode.OFF:
            return {**data, ATTR_TEMPERATURE: self._group._attr_min_temp}
        return data

    # Block hook to prevent all service calls
    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Hook for derived classes to implement custom call blocking logic.
        Returns:
            bool: True if calls should be blocked, False otherwise.
        """
        return False

    # Block hook to prevent service calls to specific attributes
    def _block_call_attr(self, data: dict[str, Any], attr: str) -> bool:
        """Block calls for specific attributes."""
        return self._block_wakeup_calls(data, attr)

    def _block_wakeup_calls(self, data: dict[str, Any], attr: str) -> bool:
        """Block calls that would wake up devices.

        Prevent setpoint changes if target HVAC mode is OFF
        Exception: Allow Min Temp Injection
        """
        if data.get(ATTR_HVAC_MODE) == HVACMode.OFF and attr != ATTR_HVAC_MODE:
            if attr == ATTR_TEMPERATURE and self._group.min_temp_off:
                return False
            return True

        return False

    # Block hook for unsynced entities
    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:
        """Check if this entity should be skipped."""
        return self._skip_off_member(state=state, target_value=target_value)

    def _skip_off_member(self, state: State, target_value: Any) -> bool:
        """Check if this OFF member should be skipped (Partial Sync).

        Used by handlers that support CONF_IGNORE_OFF_MEMBERS to prevent
        waking up members that were manually turned OFF.
        """
        if not self._group.config.get(CONF_IGNORE_OFF_MEMBERS):
            return False
        if self.target_state.hvac_mode == HVACMode.OFF:
            return False
        if state.state != HVACMode.OFF:
            return False
        if target_value == HVACMode.OFF:
            return False

        # Deadlock Prevention: Don't skip if ALL members are OFF
        return any(
            self._hass.states.get(member_id).state != HVACMode.OFF
            for member_id in self._group.climate_entity_ids
            if (member_state := self._hass.states.get(member_id)) and member_state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
        )


class ClimateCallHandler(BaseServiceCallHandler):
    """Handler for ClimateGroup's own service calls (user commands).

    This handler is used for direct user interactions:
    - set_temperature, set_hvac_mode, set_fan_mode, etc.

    Generates calls based on target_state diff (only sends to unsynced members).

    Blocking:
    - Blocked by Window Control/force_off for setpoint changes.
    - HVAC Mode changes ALWAYS bypass the block (allows turning group OFF while window is open).
    """

    CONTEXT_ID = "group"

    def __init__(self, group: ClimateGroup):
        """Initialize the climate call handler."""
        super().__init__(group)

    def _generate_calls(self, data: dict[str, Any] | None = None, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate calls for user operations."""
        if not data:
            return []
        return super()._generate_calls(data=data, filter_state=filter_state)

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block calls if blocking mode is active, UNLESS hvac_mode is being changed."""
        if data and ATTR_HVAC_MODE in data:
            _LOGGER.debug("[%s] Bypass blocking mode (HVAC mode change)", self._group.entity_id)
            return False
        return self._group.blocking_mode

    def _block_call_attr(self, data: dict[str, Any], attr: str) -> bool:
        """Do not block any attributes."""
        return False


class SyncCallHandler(BaseServiceCallHandler):
    """Generates calls based on target_state diff.

    Used when Sync Mode (Lock/Mirror) is active. Compares current member states
    against target_state and generates calls to sync deviations.

    Includes:
    - Blocking mode check
    - Partial sync output filter (don't wake OFF members)
    - Wake-up bug prevention
    """

    CONTEXT_ID = "sync_mode"

    def __init__(self, group: ClimateGroup):
        """Initialize the sync call handler."""
        super().__init__(group)
        self._filter_state = FilterState.from_keys(group.config.get(CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS))

    def _generate_calls(self, data: dict[str, Any] | None = None, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate calls based on target_state diff."""
        return super()._generate_calls(data=data, filter_state=self._filter_state)

    def _get_call_entity_ids(self, attr: str) -> list[str]:
        """Override to use diffing - only return entities that need sync."""
        return self._get_unsynced_entities(attr)

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block calls if blocking mode is active."""
        return self._group.blocking_mode


class WindowControlCallHandler(BaseServiceCallHandler):
    """Call handler for Window Control operations."""

    CONTEXT_ID = "window_control"

    def __init__(self, group: ClimateGroup):
        """Initialize the window control call handler."""
        super().__init__(group)


class ScheduleCallHandler(BaseServiceCallHandler):
    """Call handler for Schedule operations."""

    CONTEXT_ID = "schedule"

    def __init__(self, group: ClimateGroup):
        """Initialize the schedule call handler."""
        super().__init__(group)

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block schedule calls if blocking mode is active."""
        return self._group.blocking_mode

    def _get_call_entity_ids(self, attr: str) -> list[str]:
        """Override to use diffing - only return entities that need sync."""
        return self._get_unsynced_entities(attr)
