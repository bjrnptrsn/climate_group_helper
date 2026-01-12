"""Service call execution logic for the climate group."""
from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING, Any

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
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.helpers.debounce import Debouncer

from .const import (
    ATTR_MODES_MAPPING,
    ATTR_SERVICE_MAPPING,
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

    async def call_debounced(self, filter_state: FilterState | None = None):
        """Debounce and execute a service call."""

        async def debounce_func():
            """The coroutine to be executed after debounce."""
            task = asyncio.current_task()
            if task:
                self._active_tasks.add(task)
            try:
                await self._execute_calls(filter_state=filter_state)
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

    async def _execute_calls(self, filter_state: FilterState | None = None):
        """Execute service calls to sync members, with retry logic.
        
        Generates sync calls from target_state and executes them.
        Retries failed calls up to retry_attempts times with retry_delay between.
        
        Args:
            filter_state: Optional FilterState to enforce. If None, uses group.target_state.
        """
        attempts = self._group.retry_attempts + 1
        delay = self._group.retry_delay

        for attempt in range(attempts):
            try:
                calls = self._generate_calls(filter_state=filter_state)

                if not calls:
                    _LOGGER.debug("All members synced, stopping retry loop.")
                    return

                for call in calls:
                    service=call["service"]
                    data={ATTR_ENTITY_ID: call["entity_ids"], **call["kwargs"]}

                    # Track the time of the last service call for sync block logic
                    self._group.last_service_call_time = time.time()

                    _LOGGER.debug("Executing service %s: %s", service, data)    

                    # Generic handling for all services
                    await self._group.hass.services.async_call(
                        CLIMATE_DOMAIN,
                        service=service,
                        service_data=data,
                        blocking=True
                    )

            except Exception as e:
                _LOGGER.warning("Enforcement attempt %d/%d failed: %s", attempt + 1, attempts, e)

            if attempts > 1 and attempt < (attempts - 1):
                await asyncio.sleep(delay)

    def _generate_calls(self, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate all service calls needed to sync members to target_state.
        
        Handles special cases:
        - Temperature range (target_temp_low/high): Sent together in one call
        - Single temperature: Sent separately to devices without range support
        - Other attributes: Mapped via ATTR_SERVICE_MAPPING
        
        Returns:
            List of call dicts with 'service', 'kwargs', and 'entity_ids'.
        """

        calls = []
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

            service = ATTR_SERVICE_MAPPING.get(attr)
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

            # Modes: Check if attr is in its modes list and get value
            if attr in ATTR_MODES_MAPPING:
                if target_value not in state.attributes.get(ATTR_MODES_MAPPING[attr], []):
                    continue
            # Temperature/Humidity: Check if attr exists in state and get value
            elif attr not in state.attributes:
                continue

            current_value = state.state if attr == ATTR_HVAC_MODE else state.attributes.get(attr)

            # Special handling for temperature and humidity tolerance
            if attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH, ATTR_HUMIDITY):
                if self._group.within_tolerance(current_value, target_value):
                    continue

            if current_value != target_value:
                entity_ids.append(entity_id)

        return entity_ids
