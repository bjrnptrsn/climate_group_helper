"""Service call execution logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_PRESET_MODE,
    ATTR_PRESET_MODES,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_HORIZONTAL_MODES,
    ATTR_SWING_MODE,
    ATTR_SWING_MODES,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TEMPERATURE,
    DOMAIN as CLIMATE_DOMAIN,
    SERVICE_SET_FAN_MODE,
    SERVICE_SET_HUMIDITY,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_PRESET_MODE,
    SERVICE_SET_SWING_HORIZONTAL_MODE,
    SERVICE_SET_SWING_MODE,
    SERVICE_SET_TEMPERATURE,
    ClimateEntityFeature,
    HVACMode,
)
from homeassistant.const import ATTR_ENTITY_ID, ATTR_SUPPORTED_FEATURES
from homeassistant.helpers.debounce import Debouncer

from .const import SyncMode

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


class ServiceCallHandler:
    """Helper class to execute service calls with retry logic.

    This class manages:
    - Debouncing of rapid service calls to prevent network flooding
    - Retry logic for failed calls (configurable attempts + delay)
    - Context tracking for sync mode differentiation

    Retry Logic:
    - retry_attempts: Number of retries AFTER initial attempt (min 0)
    - retry_delay: Wait time between retry attempts
    - Pre-check: Validates state before retry to avoid unnecessary calls
    """

    def __init__(self, group: ClimateGroup):
        """Initialize the service call handler."""
        self._group = group
        self._debouncers: dict[str, Debouncer] = {}
        self._active_tasks: set[asyncio.Task] = set()

    async def async_cancel_all(self):
        """Cancel all active debouncers and running retry tasks."""
        # Cancel debouncers (pending calls)
        for debouncer in self._debouncers.values():
            debouncer.async_cancel()

        # Cancel running retry loops
        for task in self._active_tasks:
            task.cancel()

        # Wait for them to finish cancelling
        if self._active_tasks:
            await asyncio.gather(*self._active_tasks, return_exceptions=True)

    async def execute_with_retry(self, executor_func, service_name, **kwargs):
        """Execute the service call, with retries if configured."""
        # Configured retries + 1 initial attempt
        max_attempts = self._group._retry_attempts + 1
        retry_delay = self._group._retry_delay

        for attempt in range(max_attempts):
            try:
                _LOGGER.debug("Executing service call '%s' (attempt %d/%d) with: %s", service_name, attempt + 1, max_attempts, kwargs)
                setting_applied = await executor_func(**kwargs)

                if setting_applied: # If True, state is verified to be set
                    _LOGGER.debug("Stopping retries for service '%s': Validation successful or execution not possible.", service_name)
                    break
            except Exception as e:
                _LOGGER.debug("Service call '%s' attempt %d/%d failed: %s", service_name, attempt + 1, max_attempts, e)

            if max_attempts > 1 and attempt < (max_attempts - 1):
                await asyncio.sleep(retry_delay)

    async def call_debounced(self, service_name, executor_func, **kwargs):
        """Debounce and execute a service call."""
        _delay = self._group._debounce_delay

        # Determine Context:
        # 1. Sync/System Action: context is passed in kwargs. Use it.
        # 2. User Action: context is missing. Use self._group._context AND update _last_group_context.

        # Determine Context & Control State:
        # Check if context is already in kwargs (Sync Action)
        if kwargs.get("context"):
            # Sync Action: Do not touch _last_group_context.
            # If in Mirror Mode, this IS an external control event (system correcting state).
            if self._group._sync_mode == SyncMode.MIRROR:
                self._group._is_external_controlled = True
        else:
            # User Action: Capture the context.
            user_context = self._group._context
            kwargs["context"] = user_context
            self._group._last_group_context = user_context
            # User Actions reset external control
            self._group._is_external_controlled = False

        async def _debounce_func():
            """The coroutine to be executed after debounce."""
            task = asyncio.current_task()
            if task:
                self._active_tasks.add(task)
            try:
                await self.execute_with_retry(executor_func, service_name, **kwargs)
            finally:
                if task:
                    self._active_tasks.discard(task)

        if service_name not in self._debouncers:
            self._debouncers[service_name] = Debouncer(
                self._group.hass,
                _LOGGER,
                cooldown=_delay,
                immediate=False,
                function=_debounce_func,
            )
        else:
            # Update the function and cooldown with the latest values
            self._debouncers[service_name].cooldown = _delay
            self._debouncers[service_name].function = _debounce_func

        await self._debouncers[service_name].async_call()

    async def execute_set_hvac_mode(self, hvac_mode: HVACMode, **kwargs: Any) -> bool:
        """Forward the set_hvac_mode command to all climate in the climate group."""

        # Both conditions must be true to skip:
        # - target_hvac_mode == hvac_mode: User already set this as target
        # - attr_hvac_mode == hvac_mode: Devices actually reached this mode
        if self._group._target_hvac_mode == hvac_mode and self._group._attr_hvac_mode == hvac_mode:
            _LOGGER.debug("HVAC mode is already %s.", hvac_mode)
            return True

        entity_ids = self._group._get_supporting_entities(ATTR_HVAC_MODES, hvac_mode)

        if not entity_ids:
            _LOGGER.debug("No entities support the hvac mode %s, skipping service call", hvac_mode)
            return False

        # Update target HVAC mode
        self._group._target_hvac_mode = hvac_mode
        self._group.async_defer_or_update_ha_state()

        data = {ATTR_ENTITY_ID: entity_ids, ATTR_HVAC_MODE: hvac_mode}

        _LOGGER.debug("Setting HVAC mode: %s", data)
        await self._group.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_HVAC_MODE, data, blocking=True, context=kwargs.get("context")
        )

        return False

    async def execute_set_temperature(self, **kwargs: Any) -> bool:
        """Execute the set_temperature service call."""
        if not kwargs:
            return False

        is_temp_ok = (ATTR_TEMPERATURE not in kwargs or self._group._attr_target_temperature == kwargs[ATTR_TEMPERATURE])
        is_low_temp_ok = (ATTR_TARGET_TEMP_LOW not in kwargs or self._group._attr_target_temperature_low == kwargs[ATTR_TARGET_TEMP_LOW])
        is_high_temp_ok = (ATTR_TARGET_TEMP_HIGH not in kwargs or self._group._attr_target_temperature_high == kwargs[ATTR_TARGET_TEMP_HIGH])

        if is_temp_ok and is_low_temp_ok and is_high_temp_ok:
            _LOGGER.debug("Temperature is already at the target value(s).")
            return True

        if (hvac_mode := kwargs.get(ATTR_HVAC_MODE)):
            await self.execute_set_hvac_mode(hvac_mode, **kwargs)

        if ATTR_TEMPERATURE in kwargs:
            if (entity_ids := self._group._get_supporting_entities(ATTR_SUPPORTED_FEATURES, ClimateEntityFeature.TARGET_TEMPERATURE)):
                data = {
                    ATTR_ENTITY_ID: entity_ids,
                    ATTR_TEMPERATURE: kwargs[ATTR_TEMPERATURE]
                }

                _LOGGER.debug("Setting temperature: %s", data)
                await self._group.hass.services.async_call(
                    CLIMATE_DOMAIN, SERVICE_SET_TEMPERATURE, data, blocking=True, context=kwargs.get("context")
                )
            else:
                _LOGGER.debug("No entities support the target temperature feature, skipping service call")

        if ATTR_TARGET_TEMP_LOW in kwargs and ATTR_TARGET_TEMP_HIGH in kwargs:
            if (entity_ids := self._group._get_supporting_entities(ATTR_SUPPORTED_FEATURES, ClimateEntityFeature.TARGET_TEMPERATURE_RANGE)):
                data = {
                    ATTR_ENTITY_ID: entity_ids,
                    ATTR_TARGET_TEMP_LOW: kwargs[ATTR_TARGET_TEMP_LOW],
                    ATTR_TARGET_TEMP_HIGH: kwargs[ATTR_TARGET_TEMP_HIGH]
                }

                _LOGGER.debug("Setting temperature range: %s", data)
                await self._group.hass.services.async_call(
                    CLIMATE_DOMAIN, SERVICE_SET_TEMPERATURE, data, blocking=True, context=kwargs.get("context")
                )
            else:
                _LOGGER.debug("No entities support the target temperature range feature, skipping service call")

        return False

    async def execute_set_humidity(self, humidity: int, **kwargs: Any) -> bool:
        """Set new target humidity."""
        if self._group._attr_target_humidity == humidity:
            _LOGGER.debug("Humidity is already %s.", humidity)
            return True

        entity_ids = self._group._get_supporting_entities(ATTR_SUPPORTED_FEATURES, ClimateEntityFeature.TARGET_HUMIDITY)

        if not entity_ids:
            _LOGGER.debug("No entities support the target humidity feature, skipping service call")
            return False

        data = {ATTR_ENTITY_ID: entity_ids, ATTR_HUMIDITY: humidity}

        _LOGGER.debug("Setting humidity: %s", data)
        await self._group.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_HUMIDITY, data, blocking=True, context=kwargs.get("context")
        )

        return False

    async def execute_set_fan_mode(self, fan_mode: str, **kwargs: Any) -> bool:
        """Forward the set_fan_mode to all climate in the climate group."""
        if self._group._attr_fan_mode == fan_mode:
            _LOGGER.debug("Fan mode is already %s.", fan_mode)
            return True

        entity_ids = self._group._get_supporting_entities(ATTR_FAN_MODES, fan_mode)

        if not entity_ids:
            _LOGGER.debug("No entities support the fan mode %s, skipping service call", fan_mode)
            return False

        data = {ATTR_ENTITY_ID: entity_ids, ATTR_FAN_MODE: fan_mode}

        _LOGGER.debug("Setting fan mode: %s", data)
        await self._group.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_FAN_MODE, data, blocking=True, context=kwargs.get("context")
        )

        return False

    async def execute_set_preset_mode(self, preset_mode: str, **kwargs: Any) -> bool:
        """Forward the set_preset_mode to all climate in the climate group."""
        if self._group._attr_preset_mode == preset_mode:
            _LOGGER.debug("Preset mode is already %s.", preset_mode)
            return True

        entity_ids = self._group._get_supporting_entities(ATTR_PRESET_MODES, preset_mode)

        if not entity_ids:
            _LOGGER.debug("No entities support the preset mode %s, skipping service call", preset_mode)
            return False

        data = {ATTR_ENTITY_ID: entity_ids, ATTR_PRESET_MODE: preset_mode}

        _LOGGER.debug("Setting preset mode: %s", data)
        await self._group.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_PRESET_MODE, data, blocking=True, context=kwargs.get("context")
        )

        return False

    async def execute_set_swing_mode(self, swing_mode: str, **kwargs: Any) -> bool:
        """Forward the set_swing_mode to all climate in the climate group."""
        if self._group._attr_swing_mode == swing_mode:
            _LOGGER.debug("Swing mode is already %s.", swing_mode)
            return True

        entity_ids = self._group._get_supporting_entities(ATTR_SWING_MODES, swing_mode)

        if not entity_ids:
            _LOGGER.debug("No entities support the swing mode %s, skipping service call", swing_mode)
            return False

        data = {ATTR_ENTITY_ID: entity_ids, ATTR_SWING_MODE: swing_mode}

        _LOGGER.debug("Setting swing mode: %s", data)
        await self._group.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_SWING_MODE, data, blocking=True, context=kwargs.get("context")
        )

        return False

    async def execute_set_swing_horizontal_mode(self, swing_horizontal_mode: str, **kwargs: Any) -> bool:
        """Set new target horizontal swing operation."""
        if self._group._attr_swing_horizontal_mode == swing_horizontal_mode:
            _LOGGER.debug("Horizontal swing mode is already %s.", swing_horizontal_mode)
            return True

        entity_ids = self._group._get_supporting_entities(ATTR_SWING_HORIZONTAL_MODES, swing_horizontal_mode)

        if not entity_ids:
            _LOGGER.debug("No entities support the horizontal swing mode %s, skipping service call", swing_horizontal_mode)
            return False

        data = {ATTR_ENTITY_ID: entity_ids, ATTR_SWING_HORIZONTAL_MODE: swing_horizontal_mode}

        _LOGGER.debug("Setting horizontal swing mode: %s", data)
        await self._group.hass.services.async_call(
            CLIMATE_DOMAIN, SERVICE_SET_SWING_HORIZONTAL_MODE, data, blocking=True, context=kwargs.get("context")
        )

        return False
