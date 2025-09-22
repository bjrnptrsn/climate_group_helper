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
    CONF_AVERAGE_OPTION,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_FEATURE_STRATEGY,
    CONF_HVAC_MODE_STRATEGY,
    CONF_ROUND_OPTION,
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

    VERSION = 1

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
                # Generate unique_str from the name and add a random number to ensure uniqueness
                await self.async_set_unique_id(
                    user_input[CONF_NAME].strip().lower().replace(" ", "_")
                )
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=user_input[CONF_NAME], data=user_input
                )

        CONFIG_SCHEMA = vol.Schema(
            {
                vol.Required(CONF_NAME, default=DEFAULT_NAME): str,
                vol.Required(CONF_ENTITIES): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=CLIMATE_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Required(
                    CONF_AVERAGE_OPTION, default=AverageOption.MEAN
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            AverageOption.MEAN,
                            AverageOption.MEDIAN,
                            AverageOption.MIN,
                            AverageOption.MAX,
                        ],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="average_option",
                    )
                ),
                vol.Required(
                    CONF_ROUND_OPTION, default=RoundOption.NONE
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            RoundOption.NONE,
                            RoundOption.HALF,
                            RoundOption.INTEGER,
                        ],
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
            data_schema=CONFIG_SCHEMA,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> ClimateGroupOptionsFlow:
        """Create the options flow."""
        return ClimateGroupOptionsFlow(config_entry)


class ClimateGroupOptionsFlow(config_entries.OptionsFlow):
    """Climate Group options flow."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        errors: dict[str, str] = {}

        # Get current configuration (data + options)
        current_config = {**self._config_entry.data, **self._config_entry.options}

        if user_input is not None:

            # The key 'use_temp_sensor' is only present if a sensor was already configured.
            # If the boolean is set to False (not None), remove both temp_sensor keys from the config.
            if user_input.get(CONF_USE_TEMP_SENSOR) is False:
                user_input.pop(CONF_TEMP_SENSOR, None)
                user_input.pop(CONF_USE_TEMP_SENSOR, None)
            # If the key 'use_temp_sensor' is missing but a sensor is selected, a new sensor has been selected.
            # If so, create key 'use_temp_sensor' and set it True.
            elif CONF_TEMP_SENSOR in user_input and CONF_USE_TEMP_SENSOR not in user_input:
                user_input[CONF_USE_TEMP_SENSOR] = True

            # Check that at least one entity was selected
            if not user_input.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

            if not errors:
                # Check if anything actually changed
                if user_input == current_config:
                    _LOGGER.debug("No changes detected, aborting options flow")
                    return self.async_abort(reason="no_changes")

                _LOGGER.debug("Options updated: %s", user_input)
                return self.async_create_entry(title="", data=user_input)

        hvac_mode_strategy_default = current_config.get(CONF_HVAC_MODE_STRATEGY)
        if hvac_mode_strategy_default is None:
            if current_config.get("hvac_mode_off_priority", False):
                hvac_mode_strategy_default = HVAC_MODE_STRATEGY_OFF_PRIORITY
            else:
                hvac_mode_strategy_default = HVAC_MODE_STRATEGY_NORMAL

        # --- Schema Generation ---

        # Determine if a sensor is currently active
        # If so, the sensor entity will be read-only and the 'use_temp_sensor' boolean will be shown.
        # If not, an optional temperature sensor can be selected.
        sensor_active = bool(CONF_TEMP_SENSOR in current_config)
        
        # The EntitySelector does not accept an empty string if the sensor has been removed.
        # We therefore use the boolean to remove the key temp_sensor and thus the entity_id from the config.
        # This ensures that the group_state_update can no longer be triggered from this sensors entity_id.
        TEMP_SENSOR_SCHEMA = {
            vol.Required(
                CONF_USE_TEMP_SENSOR,
                default=True,
            ): bool,
            vol.Optional(
                CONF_TEMP_SENSOR,
                default=current_config.get(CONF_TEMP_SENSOR),
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(
                    domain=SENSOR_DOMAIN,
                    multiple=False,
                    read_only=True,
                )
            ),
        } if sensor_active else {
            vol.Optional(
                CONF_TEMP_SENSOR,
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(
                    domain=SENSOR_DOMAIN,
                    multiple=False,
                )
            ),
        }

        # Base schema fields
        OPTIONS_SCHEMA = vol.Schema(
            {
                vol.Required(
                    CONF_ENTITIES,
                    default=current_config.get(CONF_ENTITIES, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=CLIMATE_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Required(
                    CONF_AVERAGE_OPTION,
                    default=current_config.get(
                        CONF_AVERAGE_OPTION, AverageOption.MEAN
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            AverageOption.MEAN,
                            AverageOption.MEDIAN,
                            AverageOption.MIN,
                            AverageOption.MAX,
                        ],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="average_option",
                    )
                ),
                vol.Required(
                    CONF_ROUND_OPTION,
                    default=current_config.get(CONF_ROUND_OPTION, RoundOption.NONE),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            RoundOption.NONE,
                            RoundOption.HALF,
                            RoundOption.INTEGER,
                        ],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="round_option",
                    )
                ),
                vol.Required(
                    CONF_HVAC_MODE_STRATEGY, default=hvac_mode_strategy_default
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
                **TEMP_SENSOR_SCHEMA,
                vol.Optional(
                    CONF_EXPOSE_MEMBER_ENTITIES,
                    default=current_config.get(CONF_EXPOSE_MEMBER_ENTITIES, False),
                ): bool,
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=OPTIONS_SCHEMA,
            errors=errors,
        )
