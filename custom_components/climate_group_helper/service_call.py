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
    DEFAULT_MIN_TEMP,
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
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    CONF_SYNC_ATTRS,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    SYNC_TARGET_ATTRS,
    FeatureStrategy,
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
        """Execute service calls with retry and optional stagger logic."""
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
                stagger_delay = self._group.stagger_delay

                if stagger_delay:
                    calls = self._split_calls_by_entity(calls)

                for i, call in enumerate(calls):
                    service = call["service"]
                    service_data = {ATTR_ENTITY_ID: call["entity_ids"], **call["kwargs"]}

                    # Stale guard: a new command may have arrived while the previous
                    # blocking async_call was running. task.cancel() cannot interrupt
                    # that await, so we check target_state here before each call.
                    if self._is_stale_call(call):
                        _LOGGER.debug("[%s] Aborting stale call: kwargs=%s no longer match target_state", self._group.entity_id, call["kwargs"])
                        return

                    # Stagger delay between calls (not before first, not after last)
                    if i > 0 and stagger_delay:
                        await asyncio.sleep(stagger_delay)

                    await self._hass.services.async_call(
                        domain=CLIMATE_DOMAIN,
                        service=service,
                        service_data=service_data,
                        blocking=True,
                        context=Context(id=context_id, parent_id=parent_id),
                    )

                    _LOGGER.debug("[%s] Call %d/%d (%d/%d) '%s' with data: %s, Parent ID: %s", self._group.entity_id, i + 1, len(calls), attempt + 1, attempts, service, service_data, parent_id)

                await self._after_call_trigger(data)

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
        - Routes calls through the processing pipeline:
          _build_initial_call → _process_min_temp_off → _process_member_offset → _process_group_offset → _process_oob_guard

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
                            raw = [{"service": SERVICE_SET_TEMPERATURE,
                                    "kwargs": {ATTR_TARGET_TEMP_LOW: low, ATTR_TARGET_TEMP_HIGH: high},
                                    "entity_ids": entity_ids}]
                            processed = self._process_min_temp_off(raw)
                            processed = self._process_member_offset(processed)
                            processed = self._process_group_offset(processed)
                            processed = self._process_oob_guard(processed)
                            calls.extend(processed)
                            temp_range_processed = True
                continue

            entity_ids = self._get_call_entity_ids(attr, value)
            if not entity_ids:
                continue

            # Pipeline: build → process min_temp_off → process offsets → process OOB guard
            raw = self._build_initial_call(attr, value, entity_ids)
            processed = self._process_min_temp_off(raw)
            processed = self._process_member_offset(processed)
            processed = self._process_group_offset(processed)
            processed = self._process_oob_guard(processed)
            calls.extend(processed)

        return calls

    def _get_call_entity_ids(self, attr: str, value: Any = None) -> list[str]:
        """Get entity IDs for a given attribute and target value.

        Delegates to _get_filtered_entities, which applies capability check,
        _block_unsynced_entity hook, and optionally value diffing (_should_diff).
        """
        return self._get_filtered_entities(attr, value)

    def _split_calls_by_entity(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Split bundled calls into per-entity calls to allow stagger delays between them."""
        result = []
        for call in calls:
            for entity_id in call["entity_ids"]:
                result.append({**call, "entity_ids": [entity_id]})
        return result

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Get the target value for an attribute.

        Default: return the explicitly passed value (used by direct command handlers).
        Override in Sync/Schedule handlers to read from target_state instead.
        """
        return value

    def _get_target_value_with_offset(self, attr: str, value: Any = None) -> Any:
        """Read from target_state, with group_offset applied for temperature attributes."""
        raw = getattr(self.target_state, attr, None)
        if raw is not None and attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
            group_offset = self._group.run_state.group_offset
            if group_offset != 0.0:
                return round(float(raw) + group_offset, 1)
        return raw

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Check if a specific member should be excluded from service calls.

        Combines global block (e.g. window open) and per-member isolation
        (e.g. curtain closed). Returns True if either applies.
        Override in derived handlers that bypass all blocking (e.g. IsolationCallHandler).
        """
        run_state = self._group.run_state
        return run_state.blocked or entity_id in run_state.isolated_members

    def _is_oob_blocked(self, entity_id: str) -> bool:
        """Check if a member is blocked due to being out-of-bounds (OOB).

        If target_state has drifted back into range, the member is unblocked
        so _process_oob_guard can restore it.
        """
        if entity_id in self._group.run_state.oob_members:
            # Check if current target_state would STILL put it OOB.
            # If target_state is now valid, unblock it so it can receive the call & restore.
            temp_attrs = (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH)
            active_temps = [
                getattr(self.target_state, attr) for attr in temp_attrs
                if getattr(self.target_state, attr) is not None
            ]

            if not active_temps:
                return False  # Targets cleared -> no longer OOB

            state = self._hass.states.get(entity_id)
            if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                return True  # Device unavailable -> keep blocked

            min_temp = state.attributes.get("min_temp")
            max_temp = state.attributes.get("max_temp")
            member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
            group_offset = self._group.run_state.group_offset

            for target_temp in active_temps:
                effective_tgt = target_temp + member_offset + group_offset
                if (min_temp is not None and effective_tgt < min_temp) or \
                   (max_temp is not None and effective_tgt > max_temp):
                    return True  # Still OOB -> keep blocked

            return False  # In range! Remove block so _process_oob_guard can clear it.

        return False

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
            if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
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

    def _get_filtered_entities(self, attr: str, value: Any = None) -> list[str]:
        """Get members that should receive a call for this attribute.

        Unified entity selection pipeline used by all handlers:
        1. Capability check via _get_capable_entities (with target value for mode attrs).
        2. _block_unsynced_entity hook (e.g. skip OFF members for Partial Sync).
        3. Value diffing — skipped when _should_diff() returns False (ClimateCallHandler).

        Args:
            attr: The attribute to check.
            value: Explicit value (used by ClimateCallHandler via _get_target_value override).
        """
        result = []

        target_value = self._get_target_value(attr, value)
        if target_value is None:
            return []

        for entity_id in self._get_capable_entities(attr, target_value):
            state = self._hass.states.get(entity_id)
            if not state or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                continue

            if attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
                member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
                effective_target = target_value + member_offset if target_value is not None else None
            else:
                effective_target = target_value

            current_value = state.state if attr == ATTR_HVAC_MODE else state.attributes.get(attr)

            # Output Filter hook (e.g. Partial Sync: skip OFF members)
            if self._block_unsynced_entity(attr, effective_target, state):
                _LOGGER.debug("[%s] Skipping member %s", self._group.entity_id, entity_id)
                continue

            if not self._should_diff():  # default: skip diffing
                result.append(entity_id)
                continue

            # Float tolerance check
            if attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH, ATTR_HUMIDITY):
                if self._group.within_tolerance(current_value, effective_target):
                    continue

            if current_value != effective_target:
                result.append(entity_id)

        return result

    def _should_diff(self) -> bool:
        """Whether _get_filtered_entities should filter by value deviation.

        False (default): all capable entities are included regardless of current value.
        Override to True in handlers that should only update members that actually need it
        (Sync/Schedule).
        """
        return False

    def _get_parent_id(self) -> str:
        """Create a unique Parent ID for echo tracking.

        Format: "OriginEntityID|Timestamp"
        - OriginEntityID: The entity that triggered the change (primary, for "Sender Wins" logic)
        - Timestamp: When the command was sent (secondary, for stale echo detection)
        """
        origin_entity = self.target_state.last_entity or ""
        timestamp = str(time.time())
        return f"{origin_entity}|{timestamp}"

    def _build_initial_call(self, attr: str, value: Any, entity_ids: list[str]) -> list[dict]:
        """Build a simple initial call dict from attr/value. No feature logic."""
        service = ATTR_SERVICE_MAP.get(attr)
        if not service:
            return []
        return [{"service": service, "kwargs": {attr: value}, "entity_ids": entity_ids}]

    def _process_min_temp_off(self, calls: list[dict]) -> list[dict]:
        """Handle min_temp_off: restructure HVAC_MODE calls for temp-capable devices.

        - OFF: split into temp-capable (SET_TEMPERATURE with min_temp + OFF) and
          non-temp (SET_HVAC_MODE OFF)
        - Restore (ON): inject target_temp for temp-capable devices
        - Non-applicable calls pass through unchanged.
        """
        if not self._group.min_temp_off:
            return calls  # Feature not active → No-Op

        result = []
        for call in calls:
            kwargs = call["kwargs"]

            # Only process HVAC_MODE calls
            if ATTR_HVAC_MODE not in kwargs or call["service"] != SERVICE_SET_HVAC_MODE:
                result.append(call)
                continue

            hvac_mode = kwargs[ATTR_HVAC_MODE]
            entity_ids = call["entity_ids"]

            # Entity split: temp-capable vs. non-temp devices
            temp_ids = [
                eid for eid in entity_ids
                if (state := self._hass.states.get(eid)) and ATTR_TEMPERATURE in state.attributes
            ]
            non_temp_ids = [eid for eid in entity_ids if eid not in temp_ids]

            if hvac_mode == HVACMode.OFF:
                # OFF: each temp-capable device gets its own min_temp
                for eid in temp_ids:
                    state = self._hass.states.get(eid)
                    device_min = state.attributes.get("min_temp", DEFAULT_MIN_TEMP) if state else DEFAULT_MIN_TEMP
                    result.append({
                        "service": SERVICE_SET_TEMPERATURE,
                        "kwargs": {ATTR_TEMPERATURE: device_min, ATTR_HVAC_MODE: HVACMode.OFF},
                        "entity_ids": [eid],
                        "injected": [ATTR_TEMPERATURE],
                    })
                if non_temp_ids:
                    result.append({
                        "service": SERVICE_SET_HVAC_MODE,
                        "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                        "entity_ids": non_temp_ids,
                    })
            else:
                # Restore (turning ON): inject target_temp for temp-capable devices
                target_temp = self.target_state.temperature
                if target_temp is not None and temp_ids:
                    result.append({
                        "service": SERVICE_SET_TEMPERATURE,
                        "kwargs": {ATTR_TEMPERATURE: target_temp, ATTR_HVAC_MODE: hvac_mode},
                        "entity_ids": temp_ids,
                    })
                if non_temp_ids or (target_temp is None and temp_ids):
                    result.append({
                        "service": SERVICE_SET_HVAC_MODE,
                        "kwargs": {ATTR_HVAC_MODE: hvac_mode},
                        "entity_ids": non_temp_ids + (temp_ids if target_temp is None else []),
                    })

        return result

    def _process_member_offset(self, calls: list[dict]) -> list[dict]:
        """Apply per-entity temperature offset.

        For calls with temperature kwargs that are not already injected,
        apply the configured offset. Members with offset are split into
        per-entity calls; members without offset are batched together.
        """
        if not self._group._temp_offset_map:
            return calls  # No-op when no offsets configured

        result = []
        temp_attrs = {ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH}

        for call in calls:
            kwargs = call["kwargs"]
            injected = set(call.get("injected", []))
            # Only transform temp attrs that are not already injected
            transformable = temp_attrs & set(kwargs) - injected

            if not transformable:
                result.append(call)
                continue

            # Split by offset: batch no-offset entities, per-entity for offset
            no_offset_ids = []
            for entity_id in call["entity_ids"]:
                member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
                if member_offset == 0.0:
                    no_offset_ids.append(entity_id)
                    continue

                adjusted_kwargs = dict(kwargs)
                for attr in transformable:
                    if adjusted_kwargs[attr] is not None:
                        adjusted_kwargs[attr] = adjusted_kwargs[attr] + member_offset

                result.append({
                    **call,
                    "kwargs": adjusted_kwargs,
                    "entity_ids": [entity_id],
                    "injected": list(injected | transformable),
                })

            if no_offset_ids:
                result.append({**call, "entity_ids": no_offset_ids})

        return result

    def _process_group_offset(self, calls: list[dict]) -> list[dict]:
        """Shift temperature attributes by the global group offset."""
        if not self._apply_group_offset():
            return calls

        group_offset = self._group.run_state.group_offset
        if group_offset == 0.0:
            return calls

        result = []
        temp_attrs = {ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH}

        for call in calls:
            kwargs = call["kwargs"]
            injected = set(call.get("injected", []))
            # Only transform temp attrs that are not already injected
            transformable = temp_attrs & set(kwargs) - injected

            if not transformable:
                result.append(call)
                continue

            adjusted_kwargs = dict(kwargs)
            for attr in transformable:
                if adjusted_kwargs[attr] is not None:
                    adjusted_kwargs[attr] = round(float(adjusted_kwargs[attr]) + group_offset, 1)

            result.append({
                **call,
                "kwargs": adjusted_kwargs,
                "injected": list(injected | transformable)
            })

        return result

    def _apply_group_offset(self) -> bool:
        """Whether to apply the global group offset. False by default (direct-command handlers)."""
        return False

    def _process_oob_guard(self, calls: list[dict]) -> list[dict]:
        """OOB guard: check if temperature values are within device range (union only).

        Checks ALL calls with ATTR_TEMPERATURE kwargs against device min/max.
        Preserves upstream kwargs (e.g. hvac_mode from min_temp_off restore).
        Mutates run_state.oob_members once at the end.
        """
        if self._group.config.get(CONF_FEATURE_STRATEGY) != FeatureStrategy.UNION:
            return calls  # No-op when not union strategy

        result = []
        new_oob = set(self._group.run_state.oob_members)
        action = self._group.config.get(CONF_UNION_OUT_OF_BOUNDS_ACTION, UnionOutOfBoundsAction.OFF)

        temp_attrs = (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH)

        for call in calls:
            kwargs = call["kwargs"]

            # Intercept any temperature-altering attributes
            call_temp_attrs = {attr: kwargs[attr] for attr in temp_attrs if attr in kwargs}
            if not call_temp_attrs:
                result.append(call)
                continue

            upstream_kwargs = {k: v for k, v in kwargs.items() if k not in temp_attrs}

            in_range_ids = []
            for entity_id in call["entity_ids"]:
                state = self._hass.states.get(entity_id)
                if not state:
                    continue

                min_temp = state.attributes.get("min_temp")
                max_temp = state.attributes.get("max_temp")

                is_oob = False
                for attr, value in call_temp_attrs.items():
                    if (min_temp is not None and value < min_temp) or \
                       (max_temp is not None and value > max_temp):
                        is_oob = True
                        break

                if is_oob:
                    # → OOB
                    new_oob.add(entity_id)
                    if action == UnionOutOfBoundsAction.OFF:
                        if state.state != HVACMode.OFF:
                            result.append({
                                "service": SERVICE_SET_HVAC_MODE,
                                "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                                "entity_ids": [entity_id],
                                "injected": [ATTR_HVAC_MODE],
                            })
                    else:  # CLAMP
                        clamped_kwargs = {**upstream_kwargs}
                        injected = []
                        for attr, value in call_temp_attrs.items():
                            clamped = value
                            if min_temp is not None and value < min_temp:
                                clamped = min_temp
                            elif max_temp is not None and value > max_temp:
                                clamped = max_temp
                            clamped_kwargs[attr] = clamped
                            injected.append(attr)
                            
                        result.append({
                            "service": SERVICE_SET_TEMPERATURE,
                            "kwargs": clamped_kwargs,
                            "entity_ids": [entity_id],
                            "injected": injected,
                        })
                else:
                    # → In-range
                    in_range_ids.append(entity_id)
                    if entity_id in self._group.run_state.oob_members and state.state == HVACMode.OFF:
                        if self.target_state.hvac_mode and self.target_state.hvac_mode != HVACMode.OFF:
                            result.append({
                                "service": SERVICE_SET_HVAC_MODE,
                                "kwargs": {ATTR_HVAC_MODE: self.target_state.hvac_mode},
                                "entity_ids": [entity_id],
                            })
                    new_oob.discard(entity_id)

            if in_range_ids:
                result.append({
                    "service": call["service"],
                    "kwargs": {**call_temp_attrs, **upstream_kwargs},
                    "entity_ids": in_range_ids,
                    # Preserve injected from original call if present
                    **({"injected": call["injected"]} if call.get("injected") else {}),
                })

        # Side effect: write oob_members once at end (retry-safe)
        self._group.run_state = replace(self._group.run_state, oob_members=frozenset(new_oob))

        return result

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
        via _process_min_temp_off, so no exception needed here.
        """
        return data.get(ATTR_HVAC_MODE) == HVACMode.OFF and attr != ATTR_HVAC_MODE

    # Stale call guard hook
    def _is_stale_call(self, call: dict[str, Any]) -> bool:
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
        """Check if this entity should be skipped. Default: no filtering."""
        return False

    def _skip_off_member(self, state: State, target_value: Any, conf_key: str) -> bool:
        """Check if this OFF member should be skipped (Partial Sync).

        Args:
            conf_key: The config key to check (CONF_IGNORE_OFF_MEMBERS_SYNC or _SCHEDULE).
        """
        if not self._group.config.get(conf_key):
            return False
        if self.target_state.hvac_mode == HVACMode.OFF:
            return False
        if state.state != HVACMode.OFF:
            return False
        if target_value == HVACMode.OFF:
            return False

        # Deadlock Prevention: Don't skip if ALL members are OFF.
        return any(
            self._hass.states.get(member_id).state != HVACMode.OFF
            for member_id in self._group.climate_entity_ids
            if (member_state := self._hass.states.get(member_id)) and member_state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
        )

    async def _after_call_trigger(self, data: dict[str, Any] | None = None) -> None:
        """Hook called after a successful service call batch. No-op by default.

        Override in handlers that need to react after the call completes
        (e.g. ClimateCallHandler resets the group offset on manual setpoint changes).
        Must be async — the base implementation is a no-op coroutine so that all
        subclasses can be awaited uniformly without 'await None' footguns.
        """
        pass

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
        blocked = self._group.run_state.blocked
        if data and data.get(ATTR_HVAC_MODE) == HVACMode.OFF:
            if blocked:
                _LOGGER.debug("[%s] Bypass blocking mode (turning group off)", self._group.entity_id)
            return False
        return blocked

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

    async def _after_call_trigger(self, data: dict[str, Any] | None = None) -> None:
        """Execute calls and reset group offset if a temperature was explicitly set."""
        temp_attrs = {ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH}
        if data and temp_attrs & set(data) and self._group.offset_set_callback:
            await self._group.offset_set_callback(0.0)


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

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check.

        OOB members are excluded from automatic syncs (SyncCallHandler) to
        prevent constant re-syncing of devices that intentionally deviate from
        target_state. ClimateCallHandler (base) does NOT override this, so
        direct user commands still reach OOB members and can clear their OOB state.
        """
        return super()._is_member_blocked(entity_id) or self._is_oob_blocked(entity_id)

    def _should_diff(self) -> bool:
        """Only update members that actually need it."""
        return True

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Read from target_state with group_offset applied for temperature attributes."""
        return self._get_target_value_with_offset(attr, value)

    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:  # noqa: ARG002
        """Apply Partial Sync: skip OFF members if CONF_IGNORE_OFF_MEMBERS_SYNC is set."""
        return self._skip_off_member(state=state, target_value=target_value, conf_key=CONF_IGNORE_OFF_MEMBERS_SYNC)

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block calls if blocking mode is active."""
        return self._group.run_state.blocked

    def _apply_group_offset(self) -> bool:
        # Suspended during active override (boost/schedule_override): those handlers
        # send an exact temperature that must land on members unchanged.
        return self._group.run_state.active_override is None


class WindowControlCallHandler(BaseServiceCallHandler):
    """Call handler for Window Control operations.

    Bypasses member-level blocking so that window open/close commands
    always reach all members regardless of run_state state.
    """

    CONTEXT_ID = "window_control"

    def __init__(self, group: ClimateGroup):
        """Initialize the window control call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Bypass global block, but still respect per-member isolation."""
        return entity_id in self._group.run_state.isolated_members

    def _apply_group_offset(self) -> bool:
        # Apply offset only during restore (blocking_sources empty = window just closed).
        # When blocking (window open), explicit override data is sent — offset must not apply.
        return not self._group.run_state.blocking_sources


class PresenceCallHandler(BaseServiceCallHandler):
    """Call handler for Presence Control away-fallback operations.

    Bypasses member-level blocking so away commands always reach members
    regardless of run_state.blocked. Identical bypass profile to WindowControlCallHandler.
    """

    CONTEXT_ID = "presence"

    def __init__(self, group: ClimateGroup):
        """Initialize the presence call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Bypass global block, but still respect per-member isolation."""
        return entity_id in self._group.run_state.isolated_members

    def _apply_group_offset(self) -> bool:
        # Apply offset only during restore (blocking_sources empty = presence just cleared).
        # Away payloads (AWAY_OFFSET etc.) already incorporate group_offset via _active_data().
        return not self._group.run_state.blocking_sources


class SwitchCallHandler(BaseServiceCallHandler):
    """Call handler for Main Switch operations (OFF / restore).

    Bypasses all blocking — switch is the master on/off and must always
    reach all members regardless of blocking_sources or isolated_members.
    """

    CONTEXT_ID = "switch"

    def __init__(self, group: ClimateGroup):
        """Initialize the switch call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:  # noqa: ARG002
        """Bypass all blocking — switch commands always reach every member."""
        return False

    def _apply_group_offset(self) -> bool:
        # Apply offset only during restore (blocking_sources empty = switch just turned on).
        # Switch-OFF payload {"hvac_mode": "off"} must not be shifted.
        return not self._group.run_state.blocking_sources


class SwitchEnforceCallHandler(BaseServiceCallHandler):
    """Call handler for Switch enforcement (deviating member correction).

    Bypass profile: ignores run_state.blocked, respects isolated_members.
    Isolated members were deliberately turned OFF — enforcement must not
    overwrite that. Distinct from SwitchCallHandler, which bypasses everything.
    """

    CONTEXT_ID = "switch_enforce"

    def __init__(self, group: ClimateGroup):
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        return entity_id in self._group.run_state.isolated_members


class OverrideCallHandler(BaseServiceCallHandler):
    """Call handler for Override operations (boost).

    Diffing and OOB-blocking like ScheduleCallHandler, but:
    - context_id="override" (not "schedule")
    - no _block_all_calls: boost is already guarded in activate_boost()
    - no _block_unsynced_entity: OFF-member skipping is a future config option
    """

    CONTEXT_ID = "override"

    def __init__(self, group: ClimateGroup):
        """Initialize the override call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check."""
        return super()._is_member_blocked(entity_id) or self._is_oob_blocked(entity_id)

    def _should_diff(self) -> bool:
        """Only update members that actually need it."""
        return True

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Read from target_state instead of using the passed value."""
        return getattr(self.target_state, attr, None)

    def _apply_group_offset(self) -> bool:
        # Apply offset only during restore (active_override cleared = boost just expired).
        # During boost, active_override is set — exact temperature must land unchanged.
        return self._group.run_state.active_override is None


class ScheduleCallHandler(BaseServiceCallHandler):
    """Call handler for Schedule operations."""

    CONTEXT_ID = "schedule"

    def __init__(self, group: ClimateGroup):
        """Initialize the schedule call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check (same as SyncCallHandler)."""
        return super()._is_member_blocked(entity_id) or self._is_oob_blocked(entity_id)

    def _should_diff(self) -> bool:
        """Only update members that actually need it."""
        return True

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Read from target_state with group_offset applied for temperature attributes."""
        return self._get_target_value_with_offset(attr, value)

    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:  # noqa: ARG002
        """Apply Partial Sync: skip OFF members if CONF_IGNORE_OFF_MEMBERS_SCHEDULE is set."""
        return self._skip_off_member(state=state, target_value=target_value, conf_key=CONF_IGNORE_OFF_MEMBERS_SCHEDULE)

    def _block_all_calls(self, data: dict[str, Any] | None = None) -> bool:
        """Block schedule calls if blocking mode is active."""
        return self._group.run_state.blocked

    def _apply_group_offset(self) -> bool:
        # Suspended during active override (boost/schedule_override): see SyncCallHandler.
        return self._group.run_state.active_override is None