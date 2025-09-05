"""Config flow for Climate Group helper integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.components.climate import DOMAIN as CLIMATE_DOMAIN
from homeassistant.const import CONF_ENTITIES, CONF_NAME
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector

from .const import (
    CONF_AVERAGE_OPTION,
    CONF_ROUND_OPTION,
    CONF_EXPOSE_MEMBER_ENTITIES,
    DEFAULT_NAME,
    DOMAIN,
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
                await self.async_set_unique_id(user_input[CONF_NAME].strip().lower().replace(' ', '_'))
                self._abort_if_unique_id_configured()
                _LOGGER.debug("Creating config entry with data: %s", user_input)

                return self.async_create_entry(
                    title=user_input[CONF_NAME], data=user_input
                )

        data_schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=DEFAULT_NAME): str,
                vol.Required(CONF_ENTITIES): selector.EntitySelector(
                    selector.EntitySelectorConfig(
                        domain=CLIMATE_DOMAIN,
                        multiple=True,
                    )
                ),
                vol.Required(CONF_AVERAGE_OPTION, default=AverageOption.MEAN): selector.SelectSelector(
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
                vol.Required(CONF_ROUND_OPTION, default=RoundOption.NONE): selector.SelectSelector(
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
                vol.Optional(CONF_EXPOSE_MEMBER_ENTITIES, default=False): bool,
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
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

        _LOGGER.debug("Starting options flow with current options: %s", self._config_entry.options)

        # Get current configuration (data + options)
        current_config = {**self._config_entry.data, **self._config_entry.options}

        if user_input is not None:
            # Check that at least one entity was selected
            if not user_input.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

            if not errors:
                # Check if anything actually changed
                if all(
                    key in current_config and user_input[key] == current_config[key]
                    for key in user_input
                ):
                    _LOGGER.debug("No changes detected, aborting options flow")
                    return self.async_abort(reason="no_changes")

                _LOGGER.debug("Options updated: %s", user_input)
                return self.async_create_entry(title="", data=user_input)

        data_schema = vol.Schema(
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
                    default=current_config.get(CONF_AVERAGE_OPTION, AverageOption.MEAN),
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
                vol.Optional(
                    CONF_EXPOSE_MEMBER_ENTITIES,
                    default=current_config.get(CONF_EXPOSE_MEMBER_ENTITIES, False),
                ): bool,
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=data_schema,
            errors=errors,
        )
