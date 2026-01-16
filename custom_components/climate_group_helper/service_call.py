"""Service call execution logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

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
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import Context
from homeassistant.helpers.debounce import Debouncer

from .const import (
    MODE_MODES_MAP,
    ATTR_SERVICE_MAP,
)
from .state import FilterState

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class ServiceCallHandler:
    """Executes climate service calls with debouncing and retry logic.

    This handler coordinates the execution of service calls to all climate member entities.
    
    It ensures that service calls are efficiently executed by:
    - Debouncing multiple rapid changes into a single execution.
    - Filtering out devices that are already in the desired state.
    - Retrying failed operations to strictly enforce state consistency.
    """

    def __init__(self, group: ClimateGroup):
        """Initialize the service call handler."""
        self._group = group
        self._debouncer: Debouncer | None = None
        self._active_tasks: set[asyncio.Task] = set()

    async def async_cancel_all(self):
        """Cancel all active debouncers and running retry tasks."""
        # Cancel debouncer (pending calls)
        if self._debouncer:
            self._debouncer.async_cancel()

        # Cancel running retry loops
        for task in self._active_tasks:
            task.cancel()

        # Wait for them to finish cancelling
        if self._active_tasks:
            await asyncio.gather(*self._active_tasks, return_exceptions=True)

    async def call_hvac_off(self, context_id: str | None = None):
        """Execute a service call to turn off HVAC on all member entities.
        
        This bypasses target_state entirely - used by Window Control to force OFF
        while preserving target_state for later restoration.
        """
        await self._group.hass.services.async_call(
            domain=CLIMATE_DOMAIN,
            service=SERVICE_SET_HVAC_MODE,
            service_data={
                ATTR_ENTITY_ID: self._group.climate_entity_ids,
                ATTR_HVAC_MODE: HVACMode.OFF
            },
            blocking=True,
            context=Context(id=context_id) if context_id else None,
        )

    async def call_immediate(self, filter_state: FilterState | None = None, context_id: str | None = None):
        """Execute a service call immediately."""
        await self._execute_calls(filter_state=filter_state, context_id=context_id)

    async def call_debounced(self, filter_state: FilterState | None = None, context_id: str | None = None):
        """Debounce and execute a service call."""

        async def debounce_func():
            """The coroutine to be executed after debounce."""
            task = asyncio.current_task()
            if task:
                self._active_tasks.add(task)
            try:
                await self._execute_calls(filter_state=filter_state, context_id=context_id)
            finally:
                if task:
                    self._active_tasks.discard(task)

        if not self._debouncer:
            self._debouncer = Debouncer(
                self._group.hass,
                _LOGGER,
                cooldown=self._group.debounce_delay,
                immediate=False,
                function=debounce_func,
            )
        else:
            self._debouncer.async_cancel()
            self._debouncer.function = debounce_func

        await self._debouncer.async_call()

    async def _execute_calls(self, filter_state: FilterState | None = None, context_id: str | None = None):
        """Execute service calls to sync members, with retry logic.
        
        Generates sync calls from target_state and executes them.
        Retries failed calls up to retry_attempts times with retry_delay between.
        
        Args:
            filter_state: Optional FilterState to filter calls. If None, uses group.target_state.
            context_id: Optional context ID to tag service calls (for echo detection).
        """
        attempts = self._group.retry_attempts + 1
        delay = self._group.retry_delay
        context = Context(id=context_id) if context_id else None

        for attempt in range(attempts):
            try:
                calls = self._generate_calls(filter_state=filter_state, context_id=context_id)

                if not calls:
                    _LOGGER.debug("[%s] No pending calls, stopping retry loop", self._group.entity_id)
                    return

                for call in calls:
                    service=call["service"]
                    data={ATTR_ENTITY_ID: call["entity_ids"], **call["kwargs"]}

                    _LOGGER.debug("[%s] Call (%d/%d) '%s' with data: %s", self._group.entity_id, attempt + 1, attempts, service, data)    

                    # Generic handling for all services
                    await self._group.hass.services.async_call(
                        domain=CLIMATE_DOMAIN,
                        service=service,
                        service_data=data,
                        blocking=True,
                        context=context,
                    )

            except Exception as e:
                _LOGGER.warning("[%s] Call attempt (%d/%d) failed: %s", self._group.entity_id, attempt + 1, attempts, e)

            if attempts > 1 and attempt < (attempts - 1):
                await asyncio.sleep(delay)

    def _generate_calls(self, filter_state: FilterState | None = None, context_id: str | None = None) -> list[dict[str, Any]]:
        """Generate all service calls needed to sync members to target_state.
        
        Handles special cases:
        - Temperature range (target_temp_low/high): Sent together in one call
        - Single temperature: Sent separately to devices without range support
        - Other attributes: Mapped via ATTR_SERVICE_MAP
        
        Returns:
            List of call dicts with 'service', 'kwargs', and 'entity_ids'.
        """

        calls = []

        # Block calls when blocking mode is active
        if self._group.blocking_mode and context_id != "window_control":
            _LOGGER.debug("[%s] Blocking mode active (context_id=%s), skipping calls", self._group.entity_id, context_id)
            return calls

        target_state_dict = self._group.target_state.to_dict()

        filter_attrs = filter_state.to_dict() if filter_state else FilterState().to_dict()


        temp_range_processed = False

        for attr, target in target_state_dict.items():
            if not filter_attrs.get(attr):
                continue

            # Prevent "Wake Up" bug: If target is OFF, only process HVAC_MODE (to turn off).
            # Skip all other attributes (temp, fan, etc.) which might perform implicit wakeups.
            if target_state_dict.get(ATTR_HVAC_MODE) == HVACMode.OFF and attr != ATTR_HVAC_MODE:
                continue

            if attr in (ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
                if not temp_range_processed:
                    low = target_state_dict.get(ATTR_TARGET_TEMP_LOW)
                    high = target_state_dict.get(ATTR_TARGET_TEMP_HIGH)

                    for temp_attr in (ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
                        # Ensure we have both values before trying to sync range
                        if low is not None and high is not None:
                            if (entity := self._get_unsynced_entities(temp_attr)):
                                calls.append({
                                    "service": SERVICE_SET_TEMPERATURE,
                                    "kwargs": {ATTR_TARGET_TEMP_LOW: low, ATTR_TARGET_TEMP_HIGH: high},
                                    "entity_ids": entity
                                })
                                temp_range_processed = True
                                break
                continue

            service = ATTR_SERVICE_MAP.get(attr)
            if not service:
                continue

            if (entity := self._get_unsynced_entities(attr)):
                calls.append({
                    "service": service,
                    "kwargs": {attr: target},
                    "entity_ids": entity
                })

        return calls

    def _get_unsynced_entities(self, attr: str) -> list[str]:
        """Get members that support this attribute AND are not yet at target.
        
        Filters entities by:
        1. Mode attributes: Member must support the target mode value
        2. Temperature/humidity: Value must be outside tolerance range
        3. Other attributes: Must exist in state and not match target
        
        Args:
            attr: The attribute to check (e.g., 'temperature', 'hvac_mode')
            
        Returns:
            List of entity IDs that need to be synced.
        """
        entity_ids = []
        
        target_value = getattr(self._group.target_state, attr, None)

        if target_value is None:
            return []

        for entity_id in self._group.climate_entity_ids:
            state = self._group.hass.states.get(entity_id)
            if not state:
                continue

            # Modes: Check if attr is in its modes list
            if attr in MODE_MODES_MAP:
                if target_value not in state.attributes.get(MODE_MODES_MAP[attr], []):
                    continue
            # Temperature/Humidity: Check if attr exists in state
            elif attr not in state.attributes:
                continue

            current_value = state.state if attr == ATTR_HVAC_MODE else state.attributes.get(attr)

            # Float values: Check if current_value is within tolerance of target_value
            if attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH, ATTR_HUMIDITY):
                if self._group.within_tolerance(current_value, target_value):
                    continue

            # If current/target values differ, add to list
            if current_value != target_value:
                entity_ids.append(entity_id)

        return entity_ids
