"""Config flow for Climate Group helper integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.components.climate import DOMAIN as CLIMATE_DOMAIN
from homeassistant.components.number import DOMAIN as NUMBER_DOMAIN
from homeassistant.components.sensor import DOMAIN as SENSOR_DOMAIN
from homeassistant.const import CONF_ENTITIES, CONF_NAME
from homeassistant.core import callback
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.helpers import selector

from .const import (
    CONF_CLOSE_DELAY,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_FEATURE_STRATEGY,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HVAC_MODE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_SCHEDULE_ENTITY,
    CONF_SYNC_ATTRS,
    CONF_SYNC_MODE,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_WINDOW_MODE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DEFAULT_CLOSE_DELAY,
    DEFAULT_NAME,
    DEFAULT_ROOM_OPEN_DELAY,
    DEFAULT_ZONE_OPEN_DELAY,
    DOMAIN,
    FEATURE_STRATEGY_INTERSECTION,
    FEATURE_STRATEGY_UNION,
    HVAC_MODE_STRATEGY_AUTO,
    HVAC_MODE_STRATEGY_NORMAL,
    HVAC_MODE_STRATEGY_OFF_PRIORITY,
    SYNC_TARGET_ATTRS,
    AverageOption,
    RoundOption,
    SyncMode,
    WindowControlMode,
)

_LOGGER = logging.getLogger(__name__)


class ClimateGroupConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Climate Group."""

    VERSION = 6

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> ClimateGroupOptionsFlow:
        """Create the options flow."""
        return ClimateGroupOptionsFlow(config_entry)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            # Check that at least one entity was selected
            if not user_input.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

            if not errors:
                await self.async_set_unique_id(
                    user_input[CONF_NAME].strip().lower().replace(" ", "_")
                )
                self._abort_if_unique_id_configured()

                # Store everything in options, data remains empty
                return self.async_create_entry(
                    title=user_input[CONF_NAME], data={}, options=user_input
                )

        # --- Schema for setup (minimal) ---
        setup_schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=DEFAULT_NAME): str,
                vol.Required(CONF_ENTITIES): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=CLIMATE_DOMAIN,
                        multiple=True,
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=setup_schema,
            errors=errors,
        )


class ClimateGroupOptionsFlow(config_entries.OptionsFlow):
    """Climate Group options flow."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry

    def _update_config_if_changed(self, new_options: dict[str, Any]) -> None:
        """Update config entry only if options have changed."""
        if new_options != self._config_entry.options:
            self.hass.config_entries.async_update_entry(
                self._config_entry, options=new_options
            )

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the options menu."""
        return self.async_show_menu(
            step_id="init",
            menu_options=[
                "members",
                "temperature",
                "humidity",
                "timings",
                "sync",
                "window_control",
                "schedule",
                "other",
            ],
        )

    async def async_step_members(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage members and strategies."""
        errors: dict[str, str] = {}
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            # Validate: At least one entity must be selected
            if not current_config.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

            if not errors:
                self._update_config_if_changed(current_config)
                # Auto-navigate to next step
                return await self.async_step_temperature()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_ENTITIES, default=current_config.get(CONF_ENTITIES, [])
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=CLIMATE_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Required(
                    CONF_HVAC_MODE_STRATEGY,
                    default=current_config.get(
                        CONF_HVAC_MODE_STRATEGY, HVAC_MODE_STRATEGY_NORMAL
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            HVAC_MODE_STRATEGY_NORMAL,
                            HVAC_MODE_STRATEGY_OFF_PRIORITY,
                            HVAC_MODE_STRATEGY_AUTO,
                        ],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="hvac_mode_strategy",
                    )
                ),
                vol.Required(
                    CONF_FEATURE_STRATEGY,
                    default=current_config.get(
                        CONF_FEATURE_STRATEGY, FEATURE_STRATEGY_INTERSECTION
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            FEATURE_STRATEGY_INTERSECTION,
                            FEATURE_STRATEGY_UNION,
                        ],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="feature_strategy",
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="members",
            data_schema=schema,
            errors=errors,
        )

    async def async_step_temperature(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage temperature settings."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            self._update_config_if_changed(current_config)
            # Auto-navigate to next step
            return await self.async_step_humidity()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_TEMP_TARGET_AVG,
                    default=current_config.get(
                        CONF_TEMP_TARGET_AVG, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="temp_target_avg",
                    )
                ),
                vol.Required(
                    CONF_TEMP_TARGET_ROUND,
                    default=current_config.get(
                        CONF_TEMP_TARGET_ROUND, RoundOption.NONE
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in RoundOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="temp_target_round",
                    )
                ),
                vol.Required(
                    CONF_TEMP_CURRENT_AVG,
                    default=current_config.get(
                        CONF_TEMP_CURRENT_AVG, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="temp_current_avg",
                    )
                ),
                vol.Optional(
                    CONF_TEMP_SENSORS,
                    default=current_config.get(CONF_TEMP_SENSORS, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=SENSOR_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Optional(
                    CONF_TEMP_UPDATE_TARGETS,
                    default=current_config.get(CONF_TEMP_UPDATE_TARGETS, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=NUMBER_DOMAIN,
                        multiple=True,
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="temperature",
            data_schema=schema,
        )

    async def async_step_humidity(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage humidity settings."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            self._update_config_if_changed(current_config)
            # Auto-navigate to next step
            return await self.async_step_timings()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_HUMIDITY_TARGET_AVG,
                    default=current_config.get(
                        CONF_HUMIDITY_TARGET_AVG, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="humidity_target_avg",
                    )
                ),
                vol.Required(
                    CONF_HUMIDITY_TARGET_ROUND,
                    default=current_config.get(
                        CONF_HUMIDITY_TARGET_ROUND, RoundOption.NONE
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in RoundOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="humidity_target_round",
                    )
                ),
                vol.Required(
                    CONF_HUMIDITY_CURRENT_AVG,
                    default=current_config.get(
                        CONF_HUMIDITY_CURRENT_AVG, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="humidity_current_avg",
                    )
                ),
                vol.Optional(
                    CONF_HUMIDITY_SENSORS,
                    default=current_config.get(CONF_HUMIDITY_SENSORS, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=SENSOR_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Optional(
                    CONF_HUMIDITY_UPDATE_TARGETS,
                    default=current_config.get(CONF_HUMIDITY_UPDATE_TARGETS, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=NUMBER_DOMAIN,
                        multiple=True,
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="humidity",
            data_schema=schema,
        )

    async def async_step_timings(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage timing settings."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            self._update_config_if_changed(current_config)
            # Auto-navigate to next step
            return await self.async_step_sync()

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_DEBOUNCE_DELAY,
                    default=current_config.get(CONF_DEBOUNCE_DELAY, 0),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0,
                        max=10,
                        step=0.1,
                        unit_of_measurement="s",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
                vol.Optional(
                    CONF_RETRY_ATTEMPTS,
                    default=current_config.get(CONF_RETRY_ATTEMPTS, 1),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0,
                        max=5,
                        step=1,
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
                vol.Optional(
                    CONF_RETRY_DELAY,
                    default=current_config.get(CONF_RETRY_DELAY, 2.5),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0,
                        max=10,
                        step=0.5,
                        unit_of_measurement="s",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="timings",
            data_schema=schema,
        )

    async def async_step_sync(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage sync mode."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            self._update_config_if_changed(current_config)
            # Auto-navigate to next step
            return await self.async_step_window_control()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_SYNC_MODE,
                    default=current_config.get(CONF_SYNC_MODE, SyncMode.STANDARD),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in SyncMode],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="sync_mode",
                    )
                ),
                vol.Required(
                    CONF_SYNC_ATTRS,
                    default=current_config.get(
                        CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=SYNC_TARGET_ATTRS,
                        mode=selector.SelectSelectorMode.LIST,
                        multiple=True,
                        translation_key="sync_attributes",
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="sync",
            data_schema=schema,
        )

    async def async_step_window_control(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage window control settings."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            # If user clears a sensor field, remove it from config
            for key in [CONF_ROOM_SENSOR, CONF_ZONE_SENSOR]:
                if key not in user_input or not user_input.get(key):
                    current_config.pop(key, None)
            # Auto-disable window control if no sensors configured
            if CONF_ROOM_SENSOR not in current_config and CONF_ZONE_SENSOR not in current_config:
                current_config[CONF_WINDOW_MODE] = WindowControlMode.OFF
            
            self._update_config_if_changed(current_config)
            return await self.async_step_schedule()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_WINDOW_MODE,
                    default=current_config.get(CONF_WINDOW_MODE, WindowControlMode.OFF),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in WindowControlMode],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="window_mode",
                    )
                ),
                vol.Optional(
                    CONF_ROOM_SENSOR,
                    description={"suggested_value": current_config.get(CONF_ROOM_SENSOR)},
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain="binary_sensor",
                    )
                ),
                vol.Optional(
                    CONF_ZONE_SENSOR,
                    description={"suggested_value": current_config.get(CONF_ZONE_SENSOR)},
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain="binary_sensor",
                    )
                ),
                vol.Optional(
                    CONF_ROOM_OPEN_DELAY,
                    default=current_config.get(CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0,
                        max=120,
                        step=1,
                        unit_of_measurement="s",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
                vol.Optional(
                    CONF_ZONE_OPEN_DELAY,
                    default=current_config.get(CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=1,
                        max=900,
                        step=5,
                        unit_of_measurement="s",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
                vol.Optional(
                    CONF_CLOSE_DELAY,
                    default=current_config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0,
                        max=300,
                        step=1,
                        unit_of_measurement="s",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="window_control",
            data_schema=schema,
        )

    async def async_step_schedule(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage schedule settings."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            # If user clears the schedule entity field, remove it from config
            if CONF_SCHEDULE_ENTITY not in user_input or not user_input.get(CONF_SCHEDULE_ENTITY):
                current_config.pop(CONF_SCHEDULE_ENTITY, None)
            
            self._update_config_if_changed(current_config)
            return await self.async_step_other()

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_SCHEDULE_ENTITY,
                    description={"suggested_value": current_config.get(CONF_SCHEDULE_ENTITY)},
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain="schedule",
                    )
                ),
            }
        )

        return self.async_show_form(
            step_id="schedule",
            data_schema=schema,
        )

    async def async_step_other(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage other settings."""
        current_config = {**self._config_entry.options, **(user_input or {})}

        if user_input is not None:
            return self.async_create_entry(title="", data=current_config)

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_EXPOSE_SMART_SENSORS,
                    default=current_config.get(CONF_EXPOSE_SMART_SENSORS, False),
                ): bool,
                vol.Optional(
                    CONF_EXPOSE_MEMBER_ENTITIES,
                    default=current_config.get(CONF_EXPOSE_MEMBER_ENTITIES, False),
                ): bool,
                vol.Optional(
                    CONF_IGNORE_OFF_MEMBERS,
                    default=current_config.get(CONF_IGNORE_OFF_MEMBERS, False),
                ): bool,
            }
        )

        return self.async_show_form(
            step_id="other",
            data_schema=schema,
        )
