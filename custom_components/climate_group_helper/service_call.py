"""Service call execution logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
import time
from abc import ABC
from dataclasses import replace
from typing import TYPE_CHECKING, Any, Callable

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_HUMIDITY,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TEMPERATURE,
    DOMAIN as CLIMATE_DOMAIN,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
    HVACMode,
)
from homeassistant.const import ATTR_ENTITY_ID, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Context, State
from homeassistant.helpers.debounce import Debouncer

from .const import (
    MODE_MODES_MAP,
    ATTR_SERVICE_MAP,
    CONF_FEATURE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS,
    CONF_SYNC_ATTRS,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    DEFAULT_UNION_OUT_OF_BOUNDS_ACTION,
    FEATURE_STRATEGY_UNION,
    SYNC_TARGET_ATTRS,
    UnionOutOfBoundsAction,
)
from .state import FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class BaseServiceCallHandler(ABC):
    """Base class for service call execution with debouncing and retry logic.

    This abstract base class provides the common infrastructure for:
    - Debouncing multiple rapid changes into a single execution
    - Cancelling superseded retry tasks when a new command arrives
    - Stale-call detection to abort zombie calls that arrived too late
    - Retry logic for failed operations
    - Context-based call tagging for echo detection

    Derived classes must implement `_generate_calls()` to define how calls are generated.
    Hook methods (`_block_all_calls`, `_block_call_attr`, `_is_stale_call`, etc.) can be
    overridden per handler type to customise blocking and injection behaviour.
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
        """Debounce and execute a service call.

        Each new call cancels any running retry task from a previous command,
        because a newer command completely supersedes it. The actual execution
        is wrapped in an asyncio Task so it can be cancelled mid-retry-sleep.
        Stale calls that slip through a blocking `async_call` are caught by
        `_is_stale_call` inside `_execute_calls`.
        """
        # Cancel any running retry task — its stale data must not be sent.
        for task in list(self._active_tasks):
            task.cancel()

        async def debounce_func():
            """Wrap _execute_calls as a cancellable Task."""
            task = asyncio.current_task()
            if task:
                self._active_tasks.add(task)
            try:
                await self._execute_calls(data)
            except asyncio.CancelledError:
                pass  # Cancelled by a newer command — exit silently.
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
                    service_data = {ATTR_ENTITY_ID: call["entity_ids"], **call["kwargs"]}

                    # Stale guard: a new command may have arrived while the previous
                    # blocking async_call was running. task.cancel() cannot interrupt
                    # that await, so we check target_state here before each call.
                    if self._is_stale_call(call):
                        _LOGGER.debug("[%s] Aborting stale call: kwargs=%s no longer match target_state", self._group.entity_id, call["kwargs"])
                        return

                    await self._hass.services.async_call(
                        domain=CLIMATE_DOMAIN,
                        service=service,
                        service_data=service_data,
                        blocking=True,
                        context=Context(id=context_id, parent_id=parent_id),
                    )

                    _LOGGER.debug("[%s] Call (%d/%d) '%s' with data: %s, Parent ID: %s", self._group.entity_id, attempt + 1, attempts, service, service_data, parent_id)

            except Exception as error:
                error_msg = str(error)
                if "not_valid_hvac_mode" in error_msg:
                    _LOGGER.debug("[%s] Call attempt (%d/%d) skipped (not supported): %s", self._group.entity_id, attempt + 1, attempts, error_msg)
                else:
                    _LOGGER.warning("[%s] Call attempt (%d/%d) failed: %s", self._group.entity_id, attempt + 1, attempts, error)

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
                        if (entity_ids := self._get_call_entity_ids(attr, low)):
                            calls.append({
                                "service": SERVICE_SET_TEMPERATURE,
                                "kwargs": {ATTR_TARGET_TEMP_LOW: low, ATTR_TARGET_TEMP_HIGH: high},
                                "entity_ids": entity_ids
                            })
                            temp_range_processed = True
                continue

            entity_ids = self._get_call_entity_ids(attr, value)
            calls.extend(self._post_process_call(attr, value, entity_ids))

        return calls

    def _get_call_entity_ids(self, attr: str, value: Any = None) -> list[str]:
        """Get entity IDs for a given attribute and target value.

        Default: all members capable of handling this attribute/value ("Can I?" only).
        For direct UI commands (ClimateCallHandler), this is the final answer — no diffing.
        Override in Sync/Schedule handlers to also apply necessity check ("Should I?").
        """
        return self._get_capable_entities(attr, value)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Check if a specific member should be excluded from service calls.

        Combines global block (e.g. window open) and per-member isolation
        (e.g. curtain closed). Returns True if either applies.
        Override in derived handlers that bypass all blocking (e.g. IsolationCallHandler).
        """
        ctx = self._group.group_context
        return ctx.is_blocked or entity_id in ctx.isolated_members

    def _get_capable_entities(self, attr: str, value: Any = None) -> list[str]:
        """Get members that technically support this attribute/value (Capability check).

        For mode attributes (hvac_mode, fan_mode, preset_mode, swing_mode):
            With value: checks if value is in the device's supported modes list.
            Without value: checks only that the modes list attribute exists and is non-empty.
            Exception for hvac_mode without value: missing modes list is tolerated
            (some devices don't advertise hvac_modes but still accept mode commands).
        For float attributes (temperature, humidity, etc.):
            value is not meaningful for capability — only checks attribute existence.

        Args:
            attr: The attribute to check capability for.
            value: Target value. Used for mode attributes only — ignored for float attributes.
        """
        entity_ids = []
        for entity_id in self._group.climate_entity_ids:
            if self._is_member_blocked(entity_id):
                continue
            state = self._hass.states.get(entity_id)
            if not state:
                continue
            if attr in MODE_MODES_MAP:
                supported_modes = state.attributes.get(MODE_MODES_MAP[attr], [])
                if value is not None:
                    if attr == ATTR_HVAC_MODE:
                        # hvac_mode exception: devices that don't advertise hvac_modes are
                        # assumed to accept all mode commands (no constraint known).
                        if supported_modes and value not in supported_modes:
                            continue
                    else:
                        if value not in supported_modes:
                            continue
                elif attr != ATTR_HVAC_MODE and not supported_modes:
                    continue
            elif attr not in state.attributes:
                continue
            entity_ids.append(entity_id)
        return entity_ids

    def _get_unsynced_entities(self, attr: str) -> list[str]:
        """Get members that need to be synced for this attribute (Necessity check).

        Internally calls _get_capable_entities(attr, target_value) to build the
        candidate list, then filters by value deviation and partial-sync rules.

        Args:
            attr: The attribute to check.
        """
        result = []

        target_value = getattr(self.target_state, attr, None)
        if target_value is None:
            return []

        for entity_id in self._get_capable_entities(attr, target_value):
            state = self._hass.states.get(entity_id)
            if not state:
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
                result.append(entity_id)

        return result

    def _get_parent_id(self) -> str:
        """Create a unique Parent ID for echo tracking.

        Format: "OriginEntityID|Timestamp"
        - OriginEntityID: The entity that triggered the change (primary, for "Sender Wins" logic)
        - Timestamp: When the command was sent (secondary, for stale echo detection)
        """
        origin_entity = self.target_state.last_entity or ""
        timestamp = str(time.time())
        return f"{origin_entity}|{timestamp}"

    def _post_process_call(self, attr: str, value: Any, entity_ids: list[str]) -> list[dict]:
        """Post-process a call after entity selection.

        Default: produce a single standard call for all entity_ids.
        Override for entity-specific logic (e.g. OOB handling in Phase 2).
        Injected attributes (intentionally deviating from target_state) receive
        'injected': [list_of_attrs] so _is_stale_call does not abort the call.
        """
        if attr == ATTR_HVAC_MODE and value == HVACMode.OFF and self._group.min_temp_off:
            temp_ids = [
                eid for eid in entity_ids
                if (state := self._hass.states.get(eid)) and ATTR_TEMPERATURE in state.attributes
            ]
            non_temp_ids = [eid for eid in entity_ids if eid not in temp_ids]
            calls = []
            if temp_ids:
                calls.append({
                    "service": SERVICE_SET_TEMPERATURE,
                    "kwargs": {ATTR_TEMPERATURE: self._group._attr_min_temp, ATTR_HVAC_MODE: HVACMode.OFF},
                    "entity_ids": temp_ids,
                    "injected": [ATTR_TEMPERATURE],
                })
            if non_temp_ids:
                calls.append({
                    "service": SERVICE_SET_HVAC_MODE,
                    "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                    "entity_ids": non_temp_ids,
                })
            return calls

        # OOB — only for ATTR_TEMPERATURE and only when union strategy is active
        if attr == ATTR_TEMPERATURE and self._group.config.get(CONF_FEATURE_STRATEGY) == FEATURE_STRATEGY_UNION:
            return self._process_oob(value, entity_ids)

        if not entity_ids:
            return []
        service = ATTR_SERVICE_MAP.get(attr)
        if not service:
            return []
        return [{"service": service, "kwargs": {attr: value}, "entity_ids": entity_ids}]

    def _process_oob(self, value: float, entity_ids: list[str]) -> list[dict]:
        """OOB handling after entity selection (union strategy only).

        Splits entity_ids into in-range and out-of-bounds. Generates entity-specific
        extra calls (OFF or CLAMP). Writes group_context.oob_members once at the end
        (retry-safe — no partial state).
        """
        action = self._group.config.get(CONF_UNION_OUT_OF_BOUNDS_ACTION, DEFAULT_UNION_OUT_OF_BOUNDS_ACTION)
        ctx = self._group.group_context
        new_oob = set(ctx.oob_members)
        in_range_ids = []
        extra_calls = []

        for entity_id in entity_ids:
            state = self._hass.states.get(entity_id)
            if not state:
                continue
            min_t = state.attributes.get("min_temp")
            max_t = state.attributes.get("max_temp")

            if (min_t is not None and value < min_t) or (max_t is not None and value > max_t):
                new_oob.add(entity_id)
                if action == UnionOutOfBoundsAction.OFF:
                    if state.state != HVACMode.OFF:
                        extra_calls.append({
                            "service": SERVICE_SET_HVAC_MODE,
                            "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                            "entity_ids": [entity_id],
                            # hvac_mode=off intentionally deviates from target_state
                            "injected": [ATTR_HVAC_MODE],
                        })
                else:  # CLAMP
                    clamped = max_t if value > max_t else min_t
                    extra_calls.append({
                        "service": SERVICE_SET_TEMPERATURE,
                        "kwargs": {ATTR_TEMPERATURE: clamped},
                        "entity_ids": [entity_id],
                        "injected": [ATTR_TEMPERATURE],
                    })
            else:
                in_range_ids.append(entity_id)
                if entity_id in ctx.oob_members and state.state == HVACMode.OFF:
                    # Was OOB-forced OFF — restore hvac_mode if target is not OFF
                    if self.target_state.hvac_mode and self.target_state.hvac_mode != HVACMode.OFF:
                        extra_calls.append({
                            "service": SERVICE_SET_HVAC_MODE,
                            "kwargs": {ATTR_HVAC_MODE: self.target_state.hvac_mode},
                            "entity_ids": [entity_id],
                        })
                new_oob.discard(entity_id)

        # Write once at end (retry-safe, no partial state).
        # Read current group_context (not snapshot) to avoid overwriting
        # concurrent changes to other fields (e.g. isolated_members).
        self._group.group_context = replace(self._group.group_context, oob_members=frozenset(new_oob))

        calls = []
        if in_range_ids:
            calls.append({
                "service": SERVICE_SET_TEMPERATURE,
                "kwargs": {ATTR_TEMPERATURE: value},
                "entity_ids": in_range_ids,
            })
        return calls + extra_calls

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

        Prevent setpoint changes if target HVAC mode is OFF.
        The min_temp_when_off temperature is now part of the HVAC_MODE call
        via _post_process_call, so no exception needed here.
        """
        return data.get(ATTR_HVAC_MODE) == HVACMode.OFF and attr != ATTR_HVAC_MODE

    # Stale call guard hook
    def _is_stale_call(self, call: dict[str, Any]) -> bool:  # noqa: ARG002
        """Return True if this call is stale and should be aborted.

        Called before each individual service call inside the retry loop.
        Default: never stale — handlers that operate on live target_state diffs
        (SyncCallHandler, ScheduleCallHandler) are always current by design.

        Override in handlers that carry a fixed data snapshot from the moment
        the user command was issued (e.g. ClimateCallHandler), where a newer
        command may have changed target_state while a blocking call was running.
        """
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
    """Handler for direct user commands (set_hvac_mode, set_temperature, etc.).

    Carries the exact attributes the user changed as a fixed data snapshot and
    forwards them to all members. Because the snapshot is frozen at command time,
    this handler implements `_is_stale_call` to abort if target_state has moved
    on before a blocking call completes (race condition with rapid UI input).

    Blocking:
    - Setpoint changes are blocked when Window Control / force_off is active.
    - HVAC mode changes always bypass the block (turning the group OFF must work
      even when a window is open).
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
        """Block calls if blocking mode is active, unless turning the group off."""
        if data and data.get(ATTR_HVAC_MODE) == HVACMode.OFF:
            _LOGGER.debug("[%s] Bypass blocking mode (turning group off)", self._group.entity_id)
            return False
        return self._group.group_context.is_blocked

    def _is_stale_call(self, call: dict[str, Any]) -> bool:
        """Return True if any user-commanded attribute no longer matches target_state.

        Handles the race condition where a new UI command arrives while a previous
        blocking async_call is still running. In that window, target_state has
        already moved on, so the in-flight call would push the wrong state.

        Injected attributes (listed in call['injected']) are excluded from the
        staleness check — their values intentionally deviate from target_state.
        """
        target = self.target_state.to_dict()
        injected_attrs = call.get("injected", [])
        for attr, value in call["kwargs"].items():
            if attr in injected_attrs:
                continue
            if attr in target and target[attr] is not None and target[attr] != value:
                return True
        return False

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

    def _get_call_entity_ids(self, attr: str, value: Any = None) -> list[str]:  # noqa: ARG002
        """Capability + necessity check: 'Can I?' and 'Should I?'."""
        return self._get_unsynced_entities(attr)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check.

        OOB members are excluded from automatic syncs (SyncCallHandler) to
        prevent constant re-syncing of devices that intentionally deviate from
        target_state. ClimateCallHandler (base) does NOT override this, so
        direct user commands still reach OOB members and can clear their OOB state.
        """
        if super()._is_member_blocked(entity_id):
            return True
        return entity_id in self._group.group_context.oob_members

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block calls if blocking mode is active."""
        return self._group.group_context.is_blocked


class WindowControlCallHandler(BaseServiceCallHandler):
    """Call handler for Window Control operations.

    Bypasses member-level blocking so that window open/close commands
    always reach all members regardless of group_context state.
    """

    CONTEXT_ID = "window_control"

    def __init__(self, group: ClimateGroup):
        """Initialize the window control call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Bypass global block, but still respect per-member isolation."""
        return entity_id in self._group.group_context.isolated_members


class ScheduleCallHandler(BaseServiceCallHandler):
    """Call handler for Schedule operations."""

    CONTEXT_ID = "schedule"

    def __init__(self, group: ClimateGroup):
        """Initialize the schedule call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check (same as SyncCallHandler)."""
        if super()._is_member_blocked(entity_id):
            return True
        return entity_id in self._group.group_context.oob_members

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block schedule calls if blocking mode is active."""
        return self._group.group_context.is_blocked

    def _get_call_entity_ids(self, attr: str, value: Any = None) -> list[str]:  # noqa: ARG002
        """Capability + necessity check: 'Can I?' and 'Should I?'."""
        return self._get_unsynced_entities(attr)
