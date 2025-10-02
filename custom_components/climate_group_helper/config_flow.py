"""Config flow for Climate Group helper integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.components.climate import DOMAIN as CLIMATE_DOMAIN
from homeassistant.components.sensor import DOMAIN as SENSOR_DOMAIN
from homeassistant.const import CONF_ENTITIES, CONF_NAME
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector

from .const import (
    CONF_CURRENT_AVG_OPTION,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_FEATURE_STRATEGY,
    CONF_HVAC_MODE_STRATEGY,
    CONF_ROUND_OPTION,
    CONF_TARGET_AVG_OPTION,
    CONF_TEMP_SENSOR,
    CONF_USE_TEMP_SENSOR,
    DEFAULT_NAME,
    DOMAIN,
    FEATURE_STRATEGY_INTERSECTION,
    FEATURE_STRATEGY_UNION,
    HVAC_MODE_STRATEGY_AUTO,
    HVAC_MODE_STRATEGY_NORMAL,
    HVAC_MODE_STRATEGY_OFF_PRIORITY,
    AverageOption,
    RoundOption,
)

_LOGGER = logging.getLogger(__name__)


class ClimateGroupConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Climate Group."""

    VERSION = 2

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> ClimateGroupOptionsFlow:
        """Create the options flow."""
        return ClimateGroupOptionsFlow(config_entry)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
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

        # --- Schema for setup ---
        setup_schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=DEFAULT_NAME): str,
                vol.Required(CONF_ENTITIES): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=CLIMATE_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Required(
                    CONF_CURRENT_AVG_OPTION, default=AverageOption.MEAN
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="current_avg_option",
                    )
                ),
                vol.Required(
                    CONF_TARGET_AVG_OPTION, default=AverageOption.MEAN
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="target_avg_option",
                    )
                ),
                vol.Required(
                    CONF_ROUND_OPTION, default=RoundOption.NONE
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in RoundOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="round_option",
                    )
                ),
                vol.Required(
                    CONF_HVAC_MODE_STRATEGY, default=HVAC_MODE_STRATEGY_NORMAL
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
                    CONF_FEATURE_STRATEGY, default=FEATURE_STRATEGY_INTERSECTION
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
                vol.Optional(CONF_TEMP_SENSOR): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=SENSOR_DOMAIN,
                        multiple=False,
                    )
                ),
                vol.Optional(CONF_EXPOSE_MEMBER_ENTITIES, default=False): bool,
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
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        errors: dict[str, str] = {}

        if user_input is not None:

            # Check that at least one entity was selected
            if not user_input.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

            # Handle the temperature sensor and associated boolean
            if CONF_TEMP_SENSOR in user_input:
                use_temp_sensor = user_input.get(CONF_USE_TEMP_SENSOR)

                # A new sensor has been selected, add key 'use_temp_sensor' and set to True
                if use_temp_sensor is None:
                    user_input[CONF_USE_TEMP_SENSOR] = True
                # The current sensor is removed, remove both temp sensor keys
                # A new selected sensor is reverted on error
                if (use_temp_sensor is False
                    or errors and use_temp_sensor is not True
                ):
                    user_input.pop(CONF_TEMP_SENSOR)
                    user_input.pop(CONF_USE_TEMP_SENSOR)

            if not errors:
                return self.async_create_entry(title="", data=user_input)

        # --- Schema Generation ---

        # Get current configuration from options
        # Override with user_input to re-displaying the form after an error
        current_config = {**self.config_entry.options, **(user_input or {})}

        # Determine if a sensor is currently active
        # If so, the sensor entity will be read-only and the 'use_temp_sensor' boolean will be shown.
        # If not, an optional temperature sensor can be selected.
        sensor_active = bool(current_config.get(CONF_TEMP_SENSOR))

        # The EntitySelector does not accept an empty string if the sensor has been removed.
        # We therefore use the boolean to remove the key temp_sensor and thus the entity_id from the config.
        # This ensures that the group_state_update can no longer be triggered from this sensors entity_id.
        temp_sensor_schema = (
            {
                vol.Required(CONF_USE_TEMP_SENSOR, default=True): bool,
                vol.Optional(
                    CONF_TEMP_SENSOR,
                    default=current_config.get(CONF_TEMP_SENSOR),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=SENSOR_DOMAIN,
                        multiple=False,
                        read_only=True
                    )
                ),
            }
            if sensor_active
            else {
                vol.Optional(CONF_TEMP_SENSOR): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=SENSOR_DOMAIN,
                        multiple=False,
                    )
                ),
            }
        )

        options_schema = vol.Schema(
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
                    CONF_CURRENT_AVG_OPTION,
                    default=current_config.get(
                        CONF_CURRENT_AVG_OPTION, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="current_avg_option",
                    )
                ),
                vol.Required(
                    CONF_TARGET_AVG_OPTION,
                    default=current_config.get(
                        CONF_TARGET_AVG_OPTION, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in AverageOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="target_avg_option",
                    )
                ),
                vol.Required(
                    CONF_ROUND_OPTION,
                    default=current_config.get(CONF_ROUND_OPTION, RoundOption.NONE),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in RoundOption],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="round_option",
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
                **temp_sensor_schema,
                vol.Optional(
                    CONF_EXPOSE_MEMBER_ENTITIES,
                    default=current_config.get(CONF_EXPOSE_MEMBER_ENTITIES, False),
                ): bool,
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=options_schema,
            errors=errors,
        )
