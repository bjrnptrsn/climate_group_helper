"""Config flow for Climate Group Helper integration."""

from __future__ import annotations
import yaml  # type: ignore[import-untyped]
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
    ATTR_MIN_TEMP,
    ATTR_MAX_TEMP,
    ATTR_PRESET_MODES,
    ATTR_HVAC_MODES,
    DEFAULT_MAX_TEMP,
    DEFAULT_MIN_TEMP,
    HVACMode,
)
from homeassistant.components.number import DOMAIN as NUMBER_DOMAIN
from homeassistant.components.sensor import DOMAIN as SENSOR_DOMAIN
from homeassistant.const import (
    CONF_ENTITIES,
    CONF_NAME,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfTemperature,
)
from homeassistant.util.unit_conversion import TemperatureConverter
from homeassistant.core import callback
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.data_entry_flow import section
from homeassistant.helpers import selector

from .const import (
    CONF_ADVANCED_MODE,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_CALIBRATION_IGNORE_OFF,
    CONF_CLOSE_DELAY,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPAND_SECTIONS,
    CONF_EXPOSE_CONFIG,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_FEATURE_STRATEGY,
    CONF_FORCE_RETRY,
    CONF_GRACE_PERIOD,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HUMIDITY_USE_MASTER,
    CONF_HVAC_MODE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_IGNORE_OFF_MEMBERS_TEMPERATURE,
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_RULES_COUNT,
    CONF_ISOLATION_RULES,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_TRIGGER_HVAC_MODES,
    CONF_ISOLATION_TRIGGER,
    CONF_ISOLATION_ACTION_TYPE,
    CONF_ISOLATION_ACTION_HVAC_MODE,
    CONF_ISOLATION_ACTION_PRESET_MODE,
    CONF_MASTER_ENTITY,
    CONF_MEMBER_OFFSET_CORRECTION,
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_MIN_TEMP_OFF,
    CONF_RETAIN_SERVICE_CHANGES_SCHEDULE,
    CONF_PRESENCE_ACTION,
    CONF_PRESENCE_AWAY_DELAY,
    CONF_PRESENCE_AWAY_OFFSET,
    CONF_PRESENCE_AWAY_PRESET,
    CONF_PRESENCE_AWAY_TEMPERATURE,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_RETURN_DELAY,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_RANGE_TEMPLATE_DEADBAND_ACTION,
    CONF_RANGE_TEMPLATE_ENABLED,
    CONF_RANGE_TEMPLATE_COOL_ENTITIES,
    CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_ROOM_OPEN_DELAY,
    CONF_ROOM_SENSOR,
    CONF_SCHEDULE_BYPASS_ENTITY,
    CONF_SCHEDULE_FALLBACK_PAYLOAD,
    CONF_SCHEDULE_ENTITY,
    CONF_STAGGERED_CALL_DELAY,
    CONF_SYNC_ATTRS,
    CONF_SYNC_MODE,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_TEMP_USE_MASTER,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    CONF_UNION_UNSUPPORTED_HVAC_ACTION,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_WINDOW_MODE,
    CONF_WINDOW_TEMPERATURE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    DEFAULT_CLOSE_DELAY,
    DEFAULT_GRACE_PERIOD,
    DEFAULT_NAME,
    DEFAULT_ROOM_OPEN_DELAY,
    DEFAULT_ZONE_OPEN_DELAY,
    DOMAIN,
    SYNC_TARGET_ATTRS,
    AdoptManualChanges,
    AverageOption,
    CalibrationMode,
    FeatureStrategy,
    HvacModeStrategy,
    IsolationTrigger,
    IsolationActionType,
    PresenceAction,
    PresenceMode,
    RoundOption,
    SyncMode,
    RangeTemplateDeadbandAction,
    UnionOutOfBoundsAction,
    UnsupportedHvacAction,
    WindowControlAction,
    WindowControlMode,
)

from .climate import filter_cgh_entities


class ClimateGroupHelperConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Climate Group."""

    VERSION = 13

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> ClimateGroupHelperOptionsFlow:
        """Create the options flow."""
        return ClimateGroupHelperOptionsFlow(config_entry)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            if not user_input.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

            # A whitespace-only name collapses to an empty unique_id below.
            if not user_input.get(CONF_NAME, "").strip():
                errors[CONF_NAME] = "empty_name"

            if not errors:
                await self.async_set_unique_id(
                    user_input[CONF_NAME].strip().lower().replace(" ", "_")
                )
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=user_input[CONF_NAME], data={}, options=user_input
                )

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


class ClimateGroupHelperOptionsFlow(config_entries.OptionsFlow):
    """Climate Group options flow."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry
        # Placeholder values only — `_update_dynamic_limits()` recomputes both
        # in the system unit before any form is built (`self.hass` is not
        # available yet at this point).
        self._min_temp: float = DEFAULT_MIN_TEMP
        self._max_temp: float = DEFAULT_MAX_TEMP
        self._refresh_hint_shown = False
        self._from_adv_mode: bool = bool(
            config_entry.options.get(CONF_ADVANCED_MODE, False)
        )
        self._isolation_rule_count: str = str(
            config_entry.options.get(CONF_ISOLATION_RULES_COUNT, "1")
        )

    @property
    def _temp_unit(self) -> str:
        """Return the system temperature unit for slider labels.

        A hard-coded °C mislabels every temperature slider in Fahrenheit
        setups: the member limits below already come in system units, so the
        scale would be °F while the label claims °C.
        """
        return self.hass.config.units.temperature_unit

    def _default_temp_limits(self) -> tuple[float, float]:
        """Return the HA climate defaults converted to the system unit.

        `DEFAULT_MIN_TEMP`/`DEFAULT_MAX_TEMP` are Celsius constants; HA core
        converts them the same way for entities without explicit limits.
        """
        unit = self._temp_unit
        return (
            TemperatureConverter.convert(
                DEFAULT_MIN_TEMP, UnitOfTemperature.CELSIUS, unit
            ),
            TemperatureConverter.convert(
                DEFAULT_MAX_TEMP, UnitOfTemperature.CELSIUS, unit
            ),
        )

    def _update_dynamic_limits(self) -> None:
        """Calculate dynamic temperature limits from member entities."""
        default_min, default_max = self._default_temp_limits()
        self._min_temp = default_min
        self._max_temp = default_max

        # Try to get limits from member entities
        entities = self._config_entry.options.get(CONF_ENTITIES)
        if entities:
            valid_states = [
                state
                for entity_id in entities
                if (state := self.hass.states.get(entity_id)) is not None
                and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
            ]
            if valid_states:
                # Min = Highest minimum
                try:
                    min_temps = [
                        float(state.attributes.get(ATTR_MIN_TEMP, default_min))
                        for state in valid_states
                    ]
                    if min_temps:
                        self._min_temp = max(min_temps)
                except (ValueError, TypeError):
                    pass

                # Max = Lowest maximum
                try:
                    max_temps = [
                        float(state.attributes.get(ATTR_MAX_TEMP, default_max))
                        for state in valid_states
                    ]
                    if max_temps:
                        self._max_temp = min(max_temps)
                except (ValueError, TypeError):
                    pass

    def _normalize_options(
        self, user_input: dict[str, Any], refresh: bool = False
    ) -> dict[str, Any]:
        """Normalize and clean up options based on dependencies."""
        # Start with current config and overlay flat inputs
        current_config = {**self._config_entry.options, **user_input}
        # refresh=True means advanced sections weren't rendered — skip deletion guards.
        advanced_mode = bool(user_input.get(CONF_ADVANCED_MODE)) and not refresh

        # Optional entity selectors return no key when cleared (suggested_value pattern) —
        # explicitly remove stale values so deletion is not silently ignored.
        if advanced_mode:
            for key in [
                CONF_ISOLATION_SENSOR,
                "isolation_rule_1_sensor",
                "isolation_rule_2_sensor",
                "isolation_rule_3_sensor",
                "isolation_rule_4_sensor",
                "isolation_rule_1_action_preset_mode",
                "isolation_rule_2_action_preset_mode",
                "isolation_rule_3_action_preset_mode",
                "isolation_rule_4_action_preset_mode",
                CONF_PRESENCE_AWAY_PRESET,
                CONF_PRESENCE_AWAY_TEMPERATURE,
                CONF_PRESENCE_SENSOR,
                CONF_PRESENCE_ZONE,
                CONF_ROOM_SENSOR,
                CONF_SCHEDULE_BYPASS_ENTITY,
                CONF_SCHEDULE_ENTITY,
                CONF_WINDOW_TEMPERATURE,
                CONF_ZONE_SENSOR,
            ]:
                if key not in user_input or user_input.get(key) is None:
                    current_config.pop(key, None)

            # Optional text fields return no key when cleared in the UI (same
            # suggested_value pattern as the entity selectors above) — a previously
            # stored value must be removed even when the key is absent, otherwise
            # deleting the field is silently ignored.
            fallback_val = user_input.get(CONF_SCHEDULE_FALLBACK_PAYLOAD)
            if (
                CONF_SCHEDULE_FALLBACK_PAYLOAD not in user_input
                or not fallback_val
                or (isinstance(fallback_val, str) and not fallback_val.strip())
            ):
                current_config.pop(CONF_SCHEDULE_FALLBACK_PAYLOAD, None)

        # Master Entity Logic
        # Explicitly check for empty/None in input to allow deletion
        new_master = user_input.get(CONF_MASTER_ENTITY)

        if new_master:
            # Auto-add master entity to members if not already included
            entities = list(current_config.get(CONF_ENTITIES, []))
            if new_master not in entities:
                entities.append(new_master)
                current_config[CONF_ENTITIES] = entities
            current_config[CONF_MASTER_ENTITY] = new_master
        elif advanced_mode:
            # Clean up all master-dependent keys
            current_config.pop(CONF_MASTER_ENTITY, None)
            current_config.pop(CONF_TEMP_USE_MASTER, None)
            current_config.pop(CONF_HUMIDITY_USE_MASTER, None)
            # Downgrade master-dependent settings
            if current_config.get(CONF_SYNC_MODE) == SyncMode.MASTER_LOCK:
                current_config[CONF_SYNC_MODE] = SyncMode.LOCK.value
            if (
                current_config.get(CONF_WINDOW_ADOPT_MANUAL_CHANGES)
                == AdoptManualChanges.MASTER_ONLY
            ):
                current_config[CONF_WINDOW_ADOPT_MANUAL_CHANGES] = (
                    AdoptManualChanges.OFF.value
                )

        # Temperature/Humidity Calibration logic
        if not current_config.get(CONF_TEMP_SENSORS) and advanced_mode:
            current_config.pop(CONF_TEMP_UPDATE_TARGETS, None)
        if not current_config.get(CONF_HUMIDITY_SENSORS) and advanced_mode:
            current_config.pop(CONF_HUMIDITY_UPDATE_TARGETS, None)

        # Window Control logic
        if (
            not current_config.get(CONF_ROOM_SENSOR)
            and not current_config.get(CONF_ZONE_SENSOR)
            and advanced_mode
        ):
            current_config[CONF_WINDOW_MODE] = WindowControlMode.DISABLED.value

        # Presence Control logic
        if not current_config.get(CONF_PRESENCE_SENSOR) and advanced_mode:
            current_config[CONF_PRESENCE_MODE] = PresenceMode.DISABLED.value

        # Isolation logic: assemble CONF_ISOLATION_RULES from the slot keys.
        # Slot keys only exist transiently in the rendered form (never persisted to
        # options), so this must only run while the isolation section was actually
        # rendered — otherwise an unrelated save (e.g. simple-mode form, or advanced
        # mode with fewer than 2 members — _section_factory_isolation's own render
        # gate) would find no slot keys and silently wipe previously saved rules.
        valid_members = set(current_config.get(CONF_ENTITIES, []))
        if advanced_mode and len(valid_members) >= 2:
            # rule_count comes as string from SelectSelector — keep as string for round-trip safety,
            # use int only for range() logic
            raw_count = current_config.get(CONF_ISOLATION_RULES_COUNT, "1")
            try:
                rule_count = max(1, min(4, int(raw_count)))
            except (TypeError, ValueError):
                rule_count = 1
                current_config[CONF_ISOLATION_RULES_COUNT] = "1"
            current_config[CONF_ISOLATION_RULES_COUNT] = str(rule_count)
            rules: list[dict[str, Any]] = []
            for i in range(1, rule_count + 1):
                slot_trigger = current_config.get(f"isolation_rule_{i}_trigger", IsolationTrigger.DISABLED)
                if slot_trigger == IsolationTrigger.DISABLED:
                    continue
                rule: dict[str, Any] = {
                    CONF_ISOLATION_TRIGGER: slot_trigger,
                    CONF_ISOLATION_ACTION_TYPE: current_config.get(
                        f"isolation_rule_{i}_action_type", IsolationActionType.HVAC_MODE.value
                    ),
                    CONF_ISOLATION_ACTION_HVAC_MODE: current_config.get(
                        f"isolation_rule_{i}_action_hvac_mode", HVACMode.OFF.value
                    ),
                    CONF_ISOLATION_ACTION_PRESET_MODE: current_config.get(
                        f"isolation_rule_{i}_action_preset_mode"
                    ),
                }
                entities = [
                    e for e in current_config.get(f"isolation_rule_{i}_entities", [])
                    if e in valid_members
                ]
                if slot_trigger == IsolationTrigger.SENSOR:
                    sensor = current_config.get(f"isolation_rule_{i}_sensor")
                    if not sensor:
                        continue  # no sensor configured — skip rule
                    rule[CONF_ISOLATION_SENSOR] = sensor
                    rule[CONF_ISOLATION_ENTITIES] = entities
                    rule[CONF_ISOLATION_ACTIVATE_DELAY] = current_config.get(f"isolation_rule_{i}_activate_delay", 0)
                    rule[CONF_ISOLATION_RESTORE_DELAY] = current_config.get(f"isolation_rule_{i}_restore_delay", 0)
                elif slot_trigger == IsolationTrigger.HVAC_MODE:
                    hvac_modes = current_config.get(f"isolation_rule_{i}_hvac_modes", [])
                    if not hvac_modes:
                        continue  # no modes configured — skip rule
                    rule[CONF_ISOLATION_TRIGGER_HVAC_MODES] = hvac_modes
                    rule[CONF_ISOLATION_ENTITIES] = entities
                    rule[CONF_ISOLATION_ACTIVATE_DELAY] = current_config.get(f"isolation_rule_{i}_activate_delay", 0)
                    rule[CONF_ISOLATION_RESTORE_DELAY] = current_config.get(f"isolation_rule_{i}_restore_delay", 0)
                elif slot_trigger == IsolationTrigger.MEMBER_OFF:
                    # MEMBER_OFF: no sensor/hvac_modes, no delays
                    rule[CONF_ISOLATION_ENTITIES] = entities or list(valid_members)
                    rule[CONF_ISOLATION_ACTIVATE_DELAY] = 0
                    rule[CONF_ISOLATION_RESTORE_DELAY] = 0
                rules.append(rule)

            # Rules beyond the chosen count are hidden, not deleted: keep the
            # previously saved tail so a later count increase reveals the old
            # rules again (matches the "reveal or hide" UI description). Only
            # the visible slots were rebuilt above.
            hidden_rules = list(current_config.get(CONF_ISOLATION_RULES, []))[rule_count:]
            current_config[CONF_ISOLATION_RULES] = rules + hidden_rules

        # Remove all slot keys and legacy flat isolation keys from stored config
        for i in range(1, 5):
            for suffix in (
                "trigger", "sensor", "hvac_modes", "entities", "activate_delay", "restore_delay",
                "action_type", "action_hvac_mode", "action_preset_mode"
            ):
                current_config.pop(f"isolation_rule_{i}_{suffix}", None)
        for legacy_key in (
            CONF_ISOLATION_TRIGGER, CONF_ISOLATION_SENSOR, CONF_ISOLATION_TRIGGER_HVAC_MODES,
            CONF_ISOLATION_ENTITIES, CONF_ISOLATION_ACTIVATE_DELAY, CONF_ISOLATION_RESTORE_DELAY,
        ):
            current_config.pop(legacy_key, None)

        # Collect per-member temperature offsets from form fields
        offset_map: dict[str, float] = {}
        for key in list(current_config.keys()):
            if (
                isinstance(key, str)
                and key.startswith("Offset: ")
                and key.endswith(")")
            ):
                # Extract entity_id from between the last parenthesis
                try:
                    entity_id = key.rsplit("(", 1)[-1].rstrip(")")
                    val = current_config.pop(key)
                    if val and val != 0.0:
                        offset_map[entity_id] = float(val)
                except IndexError:
                    pass
        if offset_map:
            current_config[CONF_MEMBER_TEMP_OFFSETS] = offset_map
        elif advanced_mode:
            current_config.pop(CONF_MEMBER_TEMP_OFFSETS, None)

        # Range Template logic. Only clear when the section was actually rendered
        # (CONF_RANGE_TEMPLATE_ENABLED present in user_input) — the factory omits the
        # section entirely when no member needs it (e.g. all members natively support
        # heat_cool), and a save in that state must not wipe a saved legacy config.
        if advanced_mode and CONF_RANGE_TEMPLATE_ENABLED in user_input:
            if not user_input.get(CONF_RANGE_TEMPLATE_ENABLED, False):
                current_config.pop(CONF_RANGE_TEMPLATE_ENABLED, None)
                current_config.pop(CONF_RANGE_TEMPLATE_DEADBAND_ACTION, None)
                current_config.pop(CONF_RANGE_TEMPLATE_HEAT_ENTITIES, None)
                current_config.pop(CONF_RANGE_TEMPLATE_COOL_ENTITIES, None)

        return current_config

    def _section_factory_members(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for members section."""
        master_fields = {}
        if config.get(CONF_ADVANCED_MODE, False):
            master_fields = {
                vol.Optional(
                    CONF_MASTER_ENTITY,
                    description={"suggested_value": config.get(CONF_MASTER_ENTITY)},
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain=CLIMATE_DOMAIN)
                ),
            }

        return {
            vol.Required("members_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {  # type: ignore[misc]
                        vol.Required(
                            CONF_ENTITIES, default=config.get(CONF_ENTITIES, [])
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(
                                domain=CLIMATE_DOMAIN, multiple=True
                            )
                        ),
                        **master_fields,
                        vol.Required(
                            CONF_HVAC_MODE_STRATEGY,
                            default=config.get(
                                CONF_HVAC_MODE_STRATEGY, HvacModeStrategy.NORMAL
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[
                                    HvacModeStrategy.NORMAL,
                                    HvacModeStrategy.OFF_PRIORITY,
                                    HvacModeStrategy.AUTO,
                                ],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="hvac_mode_strategy",
                            )
                        ),
                        vol.Required(
                            CONF_FEATURE_STRATEGY,
                            default=config.get(
                                CONF_FEATURE_STRATEGY, FeatureStrategy.INTERSECTION
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[
                                    FeatureStrategy.INTERSECTION,
                                    FeatureStrategy.UNION,
                                ],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="feature_strategy",
                            )
                        ),
                        vol.Required(
                            CONF_UNION_OUT_OF_BOUNDS_ACTION,
                            default=config.get(
                                CONF_UNION_OUT_OF_BOUNDS_ACTION,
                                UnionOutOfBoundsAction.OFF,
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[
                                    UnionOutOfBoundsAction.OFF,
                                    UnionOutOfBoundsAction.CLAMP,
                                ],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="union_out_of_bounds_action",
                            )
                        ),
                        vol.Required(
                            CONF_UNION_UNSUPPORTED_HVAC_ACTION,
                            default=config.get(
                                CONF_UNION_UNSUPPORTED_HVAC_ACTION,
                                UnsupportedHvacAction.IGNORE,
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[
                                    UnsupportedHvacAction.IGNORE,
                                    UnsupportedHvacAction.OFF,
                                ],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="union_unsupported_hvac_action",
                            )
                        ),
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_temperature(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for temperature section."""
        master_fields = {}
        if config.get(CONF_MASTER_ENTITY):
            # master_fields[vol.Optional(CONF_TEMP_USE_MASTER, default=config.get(CONF_TEMP_USE_MASTER, False))] = bool
            master_fields = {
                vol.Optional(
                    CONF_TEMP_USE_MASTER,
                    default=config.get(CONF_TEMP_USE_MASTER, False),
                ): selector.BooleanSelector()
            }

        advanced_fields = {}
        if config.get(CONF_ADVANCED_MODE, False):
            advanced_fields = {
                vol.Optional(
                    CONF_MIN_TEMP_OFF, default=config.get(CONF_MIN_TEMP_OFF, False)
                ): selector.BooleanSelector(),
                vol.Optional(
                    CONF_TEMP_SENSORS, default=config.get(CONF_TEMP_SENSORS, [])
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain=SENSOR_DOMAIN, multiple=True)
                ),
                vol.Optional(
                    CONF_TEMP_UPDATE_TARGETS,
                    default=config.get(CONF_TEMP_UPDATE_TARGETS, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain=NUMBER_DOMAIN, multiple=True)
                ),
                vol.Required(
                    CONF_TEMP_CALIBRATION_MODE,
                    default=config.get(
                        CONF_TEMP_CALIBRATION_MODE, CalibrationMode.ABSOLUTE
                    ),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[opt.value for opt in CalibrationMode],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="temp_calibration_mode",
                    )
                ),
                vol.Optional(
                    CONF_CALIBRATION_HEARTBEAT,
                    default=config.get(CONF_CALIBRATION_HEARTBEAT, 0),
                ): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0,
                        max=120,
                        step=1,
                        unit_of_measurement="min",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                ),
                vol.Optional(
                    CONF_CALIBRATION_IGNORE_OFF,
                    default=config.get(CONF_CALIBRATION_IGNORE_OFF, False),
                ): selector.BooleanSelector(),
                vol.Optional(
                    CONF_IGNORE_OFF_MEMBERS_TEMPERATURE,
                    default=config.get(CONF_IGNORE_OFF_MEMBERS_TEMPERATURE, False),
                ): selector.BooleanSelector(),
            }

        return {
            vol.Required("temperature_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {  # type: ignore[misc]
                        vol.Required(
                            CONF_TEMP_TARGET_AVG,
                            default=config.get(
                                CONF_TEMP_TARGET_AVG, AverageOption.MEAN
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in AverageOption],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="temp_target_avg",
                            )
                        ),
                        **master_fields,
                        vol.Required(
                            CONF_TEMP_TARGET_ROUND,
                            default=config.get(
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
                            default=config.get(
                                CONF_TEMP_CURRENT_AVG, AverageOption.MEAN
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in AverageOption],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="temp_current_avg",
                            )
                        ),
                        **advanced_fields,
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_humidity(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for humidity section."""
        master_fields = {}
        if config.get(CONF_MASTER_ENTITY):
            master_fields = {
                vol.Optional(
                    CONF_HUMIDITY_USE_MASTER,
                    default=config.get(CONF_HUMIDITY_USE_MASTER, False),
                ): selector.BooleanSelector()
            }

        advanced_fields = {}
        if config.get(CONF_ADVANCED_MODE, False):
            advanced_fields = {
                vol.Optional(
                    CONF_HUMIDITY_SENSORS, default=config.get(CONF_HUMIDITY_SENSORS, [])
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain=SENSOR_DOMAIN, multiple=True)
                ),
                vol.Optional(
                    CONF_HUMIDITY_UPDATE_TARGETS,
                    default=config.get(CONF_HUMIDITY_UPDATE_TARGETS, []),
                ): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain=NUMBER_DOMAIN, multiple=True)
                ),
            }

        return {
            vol.Required("humidity_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {  # type: ignore[misc]
                        vol.Required(
                            CONF_HUMIDITY_TARGET_AVG,
                            default=config.get(
                                CONF_HUMIDITY_TARGET_AVG, AverageOption.MEAN
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in AverageOption],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="humidity_target_avg",
                            )
                        ),
                        **master_fields,
                        vol.Required(
                            CONF_HUMIDITY_TARGET_ROUND,
                            default=config.get(
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
                            default=config.get(
                                CONF_HUMIDITY_CURRENT_AVG, AverageOption.MEAN
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in AverageOption],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="humidity_current_avg",
                            )
                        ),
                        **advanced_fields,
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_sync(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for sync section."""
        sync_options = [opt.value for opt in SyncMode if opt != SyncMode.MASTER_LOCK]
        if config.get(CONF_MASTER_ENTITY):
            sync_options.append(SyncMode.MASTER_LOCK.value)

        return {
            vol.Required("sync_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {
                        vol.Required(
                            CONF_SYNC_MODE,
                            default=config.get(CONF_SYNC_MODE, SyncMode.DISABLED),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=sync_options,
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="sync_mode",
                            )
                        ),
                        vol.Required(
                            CONF_SYNC_ATTRS,
                            default=config.get(CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=SYNC_TARGET_ATTRS,
                                mode=selector.SelectSelectorMode.LIST,
                                multiple=True,
                                translation_key="sync_attributes",
                            )
                        ),
                        vol.Optional(
                            CONF_IGNORE_OFF_MEMBERS_SYNC,
                            default=config.get(CONF_IGNORE_OFF_MEMBERS_SYNC, False),
                        ): selector.BooleanSelector(),
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_window_control(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for window control section."""
        adopt_options = [AdoptManualChanges.OFF.value, AdoptManualChanges.ALL.value]
        if config.get(CONF_MASTER_ENTITY):
            adopt_options = [opt.value for opt in AdoptManualChanges]

        # Default/Migration logic for window manual changes
        adopt_val = config.get(CONF_WINDOW_ADOPT_MANUAL_CHANGES)
        if isinstance(adopt_val, bool):
            adopt_val = AdoptManualChanges.ALL if adopt_val else AdoptManualChanges.OFF
        try:
            adopt_val = AdoptManualChanges(str(adopt_val))
        except ValueError:
            adopt_val = AdoptManualChanges.OFF

        return {
            vol.Required("window_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {
                        vol.Required(
                            CONF_WINDOW_MODE,
                            default=config.get(
                                CONF_WINDOW_MODE, WindowControlMode.DISABLED
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in WindowControlMode],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="window_mode",
                            )
                        ),
                        vol.Required(
                            CONF_WINDOW_ADOPT_MANUAL_CHANGES, default=adopt_val
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=adopt_options,
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="window_adopt_manual_changes",
                            )
                        ),
                        vol.Required(
                            CONF_WINDOW_ACTION,
                            default=config.get(
                                CONF_WINDOW_ACTION, WindowControlAction.OFF
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in WindowControlAction],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="window_action",
                            )
                        ),
                        vol.Optional(
                            CONF_WINDOW_TEMPERATURE,
                            description={
                                "suggested_value": config.get(CONF_WINDOW_TEMPERATURE)
                            },
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=self._min_temp,
                                max=self._max_temp,
                                step=0.5,
                                unit_of_measurement=self._temp_unit,
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_ROOM_SENSOR,
                            description={
                                "suggested_value": config.get(CONF_ROOM_SENSOR)
                            },
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(
                                domain=["binary_sensor", "input_boolean", "cover"]
                            )
                        ),
                        vol.Optional(
                            CONF_ZONE_SENSOR,
                            description={
                                "suggested_value": config.get(CONF_ZONE_SENSOR)
                            },
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(
                                domain=["binary_sensor", "input_boolean", "cover"]
                            )
                        ),
                        vol.Optional(
                            CONF_ROOM_OPEN_DELAY,
                            default=config.get(
                                CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY
                            ),
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
                            default=config.get(
                                CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY
                            ),
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
                            default=config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY),
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
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_presence(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for presence control section."""

        # Determine available presets based on members' supported presets
        available_presets: list[str] = []
        seen: set[str] = set()
        for entity_id in config.get(CONF_ENTITIES, []):
            if state := self.hass.states.get(entity_id):
                for mode in state.attributes.get(ATTR_PRESET_MODES, []):
                    if mode not in seen:
                        seen.add(mode)
                        available_presets.append(mode)

        return {
            vol.Required("presence_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {
                        vol.Required(
                            CONF_PRESENCE_MODE,
                            default=config.get(
                                CONF_PRESENCE_MODE, PresenceMode.DISABLED
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in PresenceMode],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="presence_mode",
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_SENSOR,
                            default=config.get(CONF_PRESENCE_SENSOR, []),
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(
                                domain=[
                                    "binary_sensor",
                                    "input_boolean",
                                    "device_tracker",
                                    "person",
                                    "calendar",
                                ],
                                multiple=True,
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_ZONE,
                            default=config.get(CONF_PRESENCE_ZONE, []),
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(domain="zone", multiple=True)
                        ),
                        vol.Required(
                            CONF_PRESENCE_ACTION,
                            default=config.get(
                                CONF_PRESENCE_ACTION, PresenceAction.OFF
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in PresenceAction],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="presence_action",
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_AWAY_OFFSET,
                            default=config.get(CONF_PRESENCE_AWAY_OFFSET, 0.0),
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=-10,
                                max=10,
                                step=0.5,
                                unit_of_measurement=self._temp_unit,
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_AWAY_TEMPERATURE,
                            description={
                                "suggested_value": config.get(
                                    CONF_PRESENCE_AWAY_TEMPERATURE
                                )
                            },
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=self._min_temp,
                                max=self._max_temp,
                                step=0.5,
                                unit_of_measurement=self._temp_unit,
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_AWAY_PRESET,
                            description={
                                "suggested_value": config.get(CONF_PRESENCE_AWAY_PRESET)
                            },
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=available_presets,
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="presence_away_preset",
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_AWAY_DELAY,
                            default=config.get(CONF_PRESENCE_AWAY_DELAY, 0),
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=0,
                                max=3600,
                                step=1,
                                unit_of_measurement="s",
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_PRESENCE_RETURN_DELAY,
                            default=config.get(CONF_PRESENCE_RETURN_DELAY, 0),
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=0,
                                max=3600,
                                step=1,
                                unit_of_measurement="s",
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_schedule(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for schedule section."""
        return {
            vol.Required("schedule_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {
                        vol.Optional(
                            CONF_SCHEDULE_ENTITY,
                            description={
                                "suggested_value": config.get(CONF_SCHEDULE_ENTITY)
                            },
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(
                                domain=["schedule", "calendar"]
                            )
                        ),
                        vol.Optional(
                            CONF_SCHEDULE_FALLBACK_PAYLOAD,
                            description={
                                "suggested_value": config.get(
                                    CONF_SCHEDULE_FALLBACK_PAYLOAD, ""
                                )
                            },
                        ): selector.TextSelector(
                            selector.TextSelectorConfig(multiline=True)
                        ),
                        vol.Optional(
                            CONF_SCHEDULE_BYPASS_ENTITY,
                            description={
                                "suggested_value": config.get(
                                    CONF_SCHEDULE_BYPASS_ENTITY
                                )
                            },
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(
                                domain=["schedule", "calendar"]
                            )
                        ),
                        vol.Optional(
                            CONF_RETAIN_SERVICE_CHANGES_SCHEDULE,
                            default=config.get(CONF_RETAIN_SERVICE_CHANGES_SCHEDULE, False),
                        ): selector.BooleanSelector(),
                        vol.Optional(
                            CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
                            default=config.get(CONF_IGNORE_OFF_MEMBERS_SCHEDULE, False),
                        ): selector.BooleanSelector(),
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_temp_offsets(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for per-member temperature offset section."""
        entities = config.get(CONF_ENTITIES, [])
        if len(entities) < 2:
            return {}
        offsets = config.get(CONF_MEMBER_TEMP_OFFSETS, {})
        fields = {}
        for entity_id in entities:
            # Try to get a friendly name for a more readable UI label
            state = self.hass.states.get(entity_id)
            name = (
                state.attributes.get("friendly_name", entity_id) if state else entity_id
            )

            # Format: "Offset: Friendly Name (entity_id)" so HA displays it nicely
            key = f"Offset: {name} ({entity_id})"

            fields[vol.Optional(key, default=offsets.get(entity_id, 0.0))] = (
                selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=-20,
                        max=20,
                        step=0.5,
                        unit_of_measurement="°",
                        mode=selector.NumberSelectorMode.SLIDER,
                    )
                )
            )
        fields[
            vol.Optional(
                CONF_MEMBER_OFFSET_CORRECTION,
                default=config.get(CONF_MEMBER_OFFSET_CORRECTION, True),
            )
        ] = selector.BooleanSelector()  # type: ignore[assignment]
        return {
            vol.Required("temp_offsets_section"): section(  # type: ignore[dict-item]
                vol.Schema(fields), {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _isolation_rule_schema(
        self,
        i: int,
        slot: dict[str, Any],
        members: list[str],
        hvac_mode_options: list[str],
        member_options: list[dict[str, Any]],
        preset_options: list[str],
    ) -> dict[Any, Any]:
        """Return the voluptuous fields for one isolation rule slot (i=1..4)."""
        slot_trigger = slot.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
        slot_entities = [e for e in slot.get(CONF_ISOLATION_ENTITIES, []) if e in members]
        # The saved configuration is the truth, not the current device states: a
        # member that is offline while the form renders advertises no hvac_modes,
        # so filtering the default against the live modes would silently drop the
        # configured mode — including when only one member advertises it. The
        # rule would then be saved back with a shortened mode list — or dropped
        # entirely once the list runs empty — without the user ever noticing.
        # Configured modes are therefore kept and, if missing, appended to the
        # options (a default outside `options` is rejected by the selector).
        slot_hvac_modes = list(slot.get(CONF_ISOLATION_TRIGGER_HVAC_MODES, []))
        missing_modes = [m for m in slot_hvac_modes if m not in hvac_mode_options]
        if missing_modes:
            hvac_mode_options = hvac_mode_options + missing_modes
        slot_sensor = slot.get(CONF_ISOLATION_SENSOR)
        slot_activate_delay = slot.get(CONF_ISOLATION_ACTIVATE_DELAY, 0)
        slot_restore_delay = slot.get(CONF_ISOLATION_RESTORE_DELAY, 0)

        slot_action_type = slot.get(CONF_ISOLATION_ACTION_TYPE, IsolationActionType.HVAC_MODE.value)
        slot_action_hvac_mode = slot.get(CONF_ISOLATION_ACTION_HVAC_MODE, HVACMode.OFF.value)
        slot_action_preset_mode = slot.get(CONF_ISOLATION_ACTION_PRESET_MODE)

        return {
            vol.Optional(
                f"isolation_rule_{i}_entities", default=slot_entities
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=member_options,  # type: ignore[typeddict-item]
                    multiple=True,
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
            vol.Required(f"isolation_rule_{i}_trigger", default=slot_trigger): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[
                        IsolationTrigger.DISABLED,
                        IsolationTrigger.SENSOR,
                        IsolationTrigger.HVAC_MODE,
                        IsolationTrigger.MEMBER_OFF,
                    ],
                    mode=selector.SelectSelectorMode.DROPDOWN,
                    translation_key="isolation_trigger",
                )
            ),
            vol.Optional(
                f"isolation_rule_{i}_sensor",
                description={"suggested_value": slot_sensor},
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["binary_sensor", "input_boolean"])
            ),
            vol.Optional(
                f"isolation_rule_{i}_hvac_modes", default=slot_hvac_modes
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=hvac_mode_options,
                    multiple=True,
                    mode=selector.SelectSelectorMode.DROPDOWN,
                    translation_key="isolation_trigger_hvac_modes",
                )
            ),
            vol.Optional(
                f"isolation_rule_{i}_activate_delay", default=slot_activate_delay
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=300, step=1, unit_of_measurement="s",
                    mode=selector.NumberSelectorMode.SLIDER,
                )
            ),
            vol.Optional(
                f"isolation_rule_{i}_restore_delay", default=slot_restore_delay
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=300, step=1, unit_of_measurement="s",
                    mode=selector.NumberSelectorMode.SLIDER,
                )
            ),
            vol.Required(
                f"isolation_rule_{i}_action_type", default=slot_action_type
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[IsolationActionType.HVAC_MODE.value, IsolationActionType.PRESET_MODE.value],
                    mode=selector.SelectSelectorMode.DROPDOWN,
                    translation_key="isolation_action_type",
                )
            ),
            vol.Required(
                f"isolation_rule_{i}_action_hvac_mode", default=slot_action_hvac_mode
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=hvac_mode_options,
                    mode=selector.SelectSelectorMode.DROPDOWN,
                    translation_key="isolation_action_hvac_mode",
                )
            ),
            vol.Optional(
                f"isolation_rule_{i}_action_preset_mode",
                description={"suggested_value": slot_action_preset_mode},
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=preset_options,
                    mode=selector.SelectSelectorMode.DROPDOWN,
                    translation_key="isolation_action_preset_mode",
                )
            ),
        }

    def _section_factory_isolation(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for member isolation sections. Hidden when group has fewer than 2 members.

        Rule 1 lives inside isolation_section (always visible).
        Additional rules (2–4) appear as top-level sections after saving with a higher count.
        HA does not support nested expandable sections, so this is the only viable layout.
        """
        members = config.get(CONF_ENTITIES, [])
        if len(members) < 2:
            return {}

        member_options = [{"value": eid, "label": eid} for eid in members]

        available_hvac_modes: list[str] = []
        seen: set[str] = set()
        for entity_id in members:
            if state := self.hass.states.get(entity_id):
                for mode in state.attributes.get(ATTR_HVAC_MODES, []):
                    if mode not in seen:
                        seen.add(mode)
                        available_hvac_modes.append(mode)
        hvac_mode_options = available_hvac_modes if available_hvac_modes else [m.value for m in HVACMode]

        available_presets: list[str] = []
        seen_presets: set[str] = set()
        for entity_id in members:
            if state := self.hass.states.get(entity_id):
                for mode in state.attributes.get(ATTR_PRESET_MODES, []):
                    if mode not in seen_presets:
                        seen_presets.add(mode)
                        available_presets.append(mode)
        preset_options = available_presets

        saved_rules: list[dict[str, Any]] = config.get(CONF_ISOLATION_RULES, [])
        saved_count = config.get(CONF_ISOLATION_RULES_COUNT, str(max(len(saved_rules), 1)))
        # Only render the chosen number of slots. Rules beyond the count are
        # HIDDEN, not deleted — _normalize_options keeps them in
        # CONF_ISOLATION_RULES so increasing the count later reveals them again
        # (matches the "reveal or hide" UI description).
        try:
            rule_count = max(int(saved_count), 1)
        except (TypeError, ValueError):
            rule_count = max(len(saved_rules), 1)

        slots: list[dict[str, Any]] = (list(saved_rules) + [{}] * rule_count)[:rule_count]

        collapsed = not config.get(CONF_EXPAND_SECTIONS)

        # Rule 1 is embedded directly in the isolation_section
        rule_1_fields = self._isolation_rule_schema(1, slots[0], members, hvac_mode_options, member_options, preset_options)
        isolation_section_fields: dict[Any, Any] = {
            vol.Required(CONF_ISOLATION_RULES_COUNT, default=str(rule_count)): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=["1", "2", "3", "4"],
                    mode=selector.SelectSelectorMode.DROPDOWN,
                    translation_key="isolation_rule_count",
                )
            ),
            **rule_1_fields,
        }

        result: dict[Any, Any] = {
            vol.Required("isolation_section"): section(  # type: ignore[dict-item]
                vol.Schema(isolation_section_fields),
                {"collapsed": collapsed},
            )
        }

        # Additional rules (2–4) as top-level sections
        for i, slot in enumerate(slots[1:], start=2):
            result[vol.Required(f"isolation_rule_{i}_section")] = section(  # type: ignore[index]
                vol.Schema(
                    self._isolation_rule_schema(i, slot, members, hvac_mode_options, member_options, preset_options)
                ),
                {"collapsed": collapsed},
            )

        return result

    def _section_factory_member_template(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for Range Template section.

        Shows the section only when at least one member lacks native heat_cool —
        i.e. when the Range Template would actually do something useful.
        """
        if not (members := config.get(CONF_ENTITIES, [])):
            return {}

        has_single_setpoint = any(
            HVACMode.HEAT_COOL
            not in (
                state.attributes.get(ATTR_HVAC_MODES, [])
                if (state := self.hass.states.get(entity_id))
                else []
            )
            for entity_id in members
        )
        if not has_single_setpoint:
            return {}

        # Role lists offer only members that could plausibly run the mode.
        # Hidden are only provably incapable members (state present, hvac_modes
        # reported, neither the mode nor heat_cool included). Unknown devices
        # (offline, no hvac_modes) stay selectable — the role still restricts
        # them at runtime. Saved values are always kept in the options so a
        # legacy entry is never lost on save.
        def _mode_selectable(entity_id: str, mode: str) -> bool:
            state = self.hass.states.get(entity_id)
            if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                return True  # unknown/offline — capability not trustworthy, stay selectable
            modes = state.attributes.get(ATTR_HVAC_MODES)
            if not modes:
                return True  # no capability report — treated as "supports everything"
            return HVACMode.HEAT_COOL in modes or mode in modes

        heat_options = [{"value": eid, "label": eid} for eid in members if _mode_selectable(eid, HVACMode.HEAT)]
        cool_options = [{"value": eid, "label": eid} for eid in members if _mode_selectable(eid, HVACMode.COOL)]
        heat_options += [{"value": eid, "label": eid} for eid in config.get(CONF_RANGE_TEMPLATE_HEAT_ENTITIES, [])
                         if eid not in {o["value"] for o in heat_options}]
        cool_options += [{"value": eid, "label": eid} for eid in config.get(CONF_RANGE_TEMPLATE_COOL_ENTITIES, [])
                         if eid not in {o["value"] for o in cool_options}]

        return {
            vol.Required("member_template_section"): section(
                vol.Schema(
                    {
                        vol.Required(
                            CONF_RANGE_TEMPLATE_ENABLED,
                            default=config.get(CONF_RANGE_TEMPLATE_ENABLED, False),
                        ): selector.BooleanSelector(),
                        vol.Required(
                            CONF_RANGE_TEMPLATE_DEADBAND_ACTION,
                            default=config.get(
                                CONF_RANGE_TEMPLATE_DEADBAND_ACTION,
                                RangeTemplateDeadbandAction.NONE,
                            ),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=[opt.value for opt in RangeTemplateDeadbandAction],
                                mode=selector.SelectSelectorMode.DROPDOWN,
                                translation_key="range_template_deadband_action",
                            )
                        ),
                        vol.Optional(
                            CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
                            default=config.get(CONF_RANGE_TEMPLATE_HEAT_ENTITIES, []),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=heat_options,  # type: ignore[typeddict-item]
                                multiple=True,
                                mode=selector.SelectSelectorMode.DROPDOWN,
                            )
                        ),
                        vol.Optional(
                            CONF_RANGE_TEMPLATE_COOL_ENTITIES,
                            default=config.get(CONF_RANGE_TEMPLATE_COOL_ENTITIES, []),
                        ): selector.SelectSelector(
                            selector.SelectSelectorConfig(
                                options=cool_options,  # type: ignore[typeddict-item]
                                multiple=True,
                                mode=selector.SelectSelectorMode.DROPDOWN,
                            )
                        ),
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _section_factory_advanced(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for advanced section."""
        return {
            vol.Required("advanced_section"): section(  # type: ignore[dict-item]
                vol.Schema(
                    {
                        vol.Optional(
                            CONF_DEBOUNCE_DELAY,
                            default=config.get(CONF_DEBOUNCE_DELAY, 0),
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
                            default=config.get(CONF_RETRY_ATTEMPTS, 0),
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=0,
                                max=5,
                                step=1,
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_RETRY_DELAY, default=config.get(CONF_RETRY_DELAY, 2.5)
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=0,
                                max=10,
                                step=0.5,
                                unit_of_measurement="s",
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_FORCE_RETRY,
                            default=config.get(CONF_FORCE_RETRY, False),
                        ): selector.BooleanSelector(),
                        vol.Optional(
                            CONF_STAGGERED_CALL_DELAY,
                            default=config.get(CONF_STAGGERED_CALL_DELAY, 0.0),
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=0,
                                max=2,
                                step=0.1,
                                unit_of_measurement="s",
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_GRACE_PERIOD,
                            default=config.get(CONF_GRACE_PERIOD, DEFAULT_GRACE_PERIOD),
                        ): selector.NumberSelector(
                            selector.NumberSelectorConfig(
                                min=0,
                                max=30,
                                step=0.5,
                                unit_of_measurement="s",
                                mode=selector.NumberSelectorMode.SLIDER,
                            )
                        ),
                        vol.Optional(
                            CONF_EXPOSE_SMART_SENSORS,
                            default=config.get(CONF_EXPOSE_SMART_SENSORS, False),
                        ): selector.BooleanSelector(),
                        vol.Optional(
                            CONF_EXPOSE_MEMBER_ENTITIES,
                            default=config.get(CONF_EXPOSE_MEMBER_ENTITIES, False),
                        ): selector.BooleanSelector(),
                        vol.Optional(
                            CONF_EXPOSE_CONFIG,
                            default=config.get(CONF_EXPOSE_CONFIG, False),
                        ): selector.BooleanSelector(),
                    }
                ),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)},
            )
        }

    def _flatten_input(self, user_input: dict[str, Any]) -> dict[str, Any]:
        """Extract and flatten nested section data from user_input.

        Home Assistant's UI sections group fields into dictionaries (e.g., 'members_section': {...}).
        This method pulls all nested fields back into a single flat dictionary to maintain
        compatibility with the integration's internal configuration structure and the
        Config Entry storage.
        """
        flattened = {}
        for key, value in user_input.items():
            if key.endswith("_section") and isinstance(value, dict):
                flattened.update(value)
            else:
                flattened[key] = value
        return flattened

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the climate group options."""
        old_master = self._config_entry.options.get(CONF_MASTER_ENTITY)

        if user_input is not None:
            flattened_input = self._flatten_input(user_input)
            current_config = {**self._config_entry.options, **flattened_input}

            # Re-render if rule count changed — shows/hides additional rule slots immediately
            new_rule_count = flattened_input.get(CONF_ISOLATION_RULES_COUNT, self._isolation_rule_count)
            if new_rule_count != self._isolation_rule_count:
                self._isolation_rule_count = new_rule_count
                return await self._show_main_form(self._normalize_options(flattened_input))

            # Validate: the group must keep at least one member
            if not flattened_input.get(
                CONF_ENTITIES, self._config_entry.options.get(CONF_ENTITIES, [])
            ):
                return await self._show_main_form(
                    current_config,
                    form_errors={"members_section": "no_entities"},
                )

            # Suggest a refresh if master changed and hint not yet shown
            new_master = flattened_input.get(CONF_MASTER_ENTITY)
            master_changed = (
                CONF_MASTER_ENTITY in flattened_input and new_master != old_master
            )

            if master_changed and not self._refresh_hint_shown:
                self._refresh_hint_shown = True
                return await self._show_main_form(
                    current_config,
                    form_errors={
                        "base": "master_refresh_notice",
                        "temperature_section": "master_options_notice",
                        "humidity_section": "master_options_notice",
                        "sync_section": "master_options_notice",
                        "window_section": "master_options_notice",
                        "presence_section": "master_options_notice",
                    },
                )

            # Validate: no isolation rule may isolate all members
            # (not enforced for MEMBER_OFF — dynamic per-entity trigger has no batch deadlock risk)
            entities = set(
                flattened_input.get(
                    CONF_ENTITIES, self._config_entry.options.get(CONF_ENTITIES, [])
                )
            )
            isolation_error: str | None = None
            for i in range(1, 5):
                slot_trigger = flattened_input.get(f"isolation_rule_{i}_trigger", IsolationTrigger.DISABLED)
                if slot_trigger in (IsolationTrigger.DISABLED, IsolationTrigger.MEMBER_OFF):
                    continue
                slot_entities = set(flattened_input.get(f"isolation_rule_{i}_entities", []))
                if slot_entities and slot_entities >= entities:
                    isolation_error = f"isolation_rule_{i}_section" if i > 1 else "isolation_section"
                    break
            if isolation_error:
                return await self._show_main_form(
                    current_config,
                    form_errors={
                        isolation_error: "isolation_all_selected",
                    },
                )

            # Validate: if action_type is preset_mode, action_preset_mode must be configured
            for i in range(1, 5):
                slot_trigger = flattened_input.get(f"isolation_rule_{i}_trigger", IsolationTrigger.DISABLED)
                if slot_trigger == IsolationTrigger.DISABLED:
                    continue
                action_type = flattened_input.get(f"isolation_rule_{i}_action_type", IsolationActionType.HVAC_MODE.value)
                if action_type == IsolationActionType.PRESET_MODE.value:
                    if not flattened_input.get(f"isolation_rule_{i}_action_preset_mode"):
                        section_key = f"isolation_rule_{i}_section" if i > 1 else "isolation_section"
                        return await self._show_main_form(
                            current_config,
                            form_errors={
                                section_key: "isolation_action_preset_required"
                            },
                        )

            # Validate: no entity may appear in more than one isolation rule
            seen_isolation_entities: set[str] = set()
            for i in range(1, 5):
                slot_trigger = flattened_input.get(f"isolation_rule_{i}_trigger", IsolationTrigger.DISABLED)
                if slot_trigger == IsolationTrigger.DISABLED:
                    continue
                slot_entities = set(flattened_input.get(f"isolation_rule_{i}_entities", []))
                overlap = slot_entities & seen_isolation_entities
                if overlap:
                    return await self._show_main_form(
                        current_config,
                        form_errors={f"isolation_rule_{i}_section": "isolation_entity_overlap"},
                    )
                seen_isolation_entities |= slot_entities

            # Validate: an action that needs a value must have one. Without it the
            # runtime silently falls back to OFF (with a log warning) — the user gets
            # something other than what they configured and only finds out from the log.
            # Keyed on the *effective* mode: both modes are forced to DISABLED during
            # normalization when no sensor is configured, so a prepared-but-inactive
            # action must not block the save.
            window_enabled = (
                flattened_input.get(CONF_WINDOW_MODE) == WindowControlMode.ENABLED
                and (
                    flattened_input.get(CONF_ROOM_SENSOR)
                    or flattened_input.get(CONF_ZONE_SENSOR)
                )
            )
            if (
                window_enabled
                and flattened_input.get(CONF_WINDOW_ACTION) == WindowControlAction.TEMPERATURE
                and flattened_input.get(CONF_WINDOW_TEMPERATURE) is None
            ):
                return await self._show_main_form(
                    current_config,
                    form_errors={"window_section": "window_temperature_required"},
                )

            presence_enabled = (
                flattened_input.get(CONF_PRESENCE_MODE) == PresenceMode.ENABLED
                and flattened_input.get(CONF_PRESENCE_SENSOR)
            )
            if presence_enabled:
                presence_action = flattened_input.get(CONF_PRESENCE_ACTION)
                if (
                    presence_action == PresenceAction.AWAY_TEMPERATURE
                    and flattened_input.get(CONF_PRESENCE_AWAY_TEMPERATURE) is None
                ) or (
                    presence_action == PresenceAction.AWAY_PRESET
                    and not flattened_input.get(CONF_PRESENCE_AWAY_PRESET)
                ):
                    return await self._show_main_form(
                        current_config,
                        form_errors={"presence_section": "presence_action_value_required"},
                    )

            # Validate: own CGH sensors must not be used as external sensors (feedback loop)
            for conf_key in (CONF_TEMP_SENSORS, CONF_HUMIDITY_SENSORS):
                selected = flattened_input.get(conf_key, [])
                label = "temperature" if conf_key == CONF_TEMP_SENSORS else "humidity"
                if len(filter_cgh_entities(self.hass, selected, label)) < len(selected):
                    section_key = (
                        "temperature_section"
                        if conf_key == CONF_TEMP_SENSORS
                        else "humidity_section"
                    )
                    return await self._show_main_form(
                        current_config,
                        form_errors={
                            section_key: "sensor_loop_protection",
                        },
                    )

            # Validate: own CGH entities must not be used as calibration targets (feedback loop)
            for conf_key in (CONF_TEMP_UPDATE_TARGETS, CONF_HUMIDITY_UPDATE_TARGETS):
                selected = flattened_input.get(conf_key, [])
                label = "temperature" if conf_key == CONF_TEMP_UPDATE_TARGETS else "humidity"
                if len(filter_cgh_entities(self.hass, selected, label)) < len(selected):
                    section_key = (
                        "temperature_section"
                        if conf_key == CONF_TEMP_UPDATE_TARGETS
                        else "humidity_section"
                    )
                    return await self._show_main_form(
                        current_config,
                        form_errors={
                            section_key: "sensor_loop_protection",
                        },
                    )

            # Validate: schedule_fallback_payload must be valid YAML mapping if provided
            fallback_payload_raw = flattened_input.get(CONF_SCHEDULE_FALLBACK_PAYLOAD)
            if fallback_payload_raw and isinstance(fallback_payload_raw, str) and fallback_payload_raw.strip():
                try:
                    parsed = yaml.safe_load(fallback_payload_raw)
                    if not isinstance(parsed, dict):
                        return await self._show_main_form(
                            current_config,
                            form_errors={"schedule_section": "schedule_fallback_payload_invalid"},
                        )
                except yaml.YAMLError:
                    return await self._show_main_form(
                        current_config,
                        form_errors={"schedule_section": "schedule_fallback_payload_invalid"},
                    )

            new_adv_mode = bool(flattened_input.get(CONF_ADVANCED_MODE))
            adv_mode_changed = (
                CONF_ADVANCED_MODE in flattened_input
                and new_adv_mode != self._from_adv_mode
            )

            final_options = self._normalize_options(
                flattened_input, refresh=adv_mode_changed
            )

            if adv_mode_changed:
                return await self._show_main_form(final_options)

            # Reset markers and save
            self._refresh_hint_shown = False

            return self.async_create_entry(title="", data=final_options)

        return await self._show_main_form(dict(self._config_entry.options))

    async def _show_main_form(
        self, config: dict[str, Any], form_errors: dict[str, str] | None = None
    ) -> ConfigFlowResult:
        """Show the unified configuration form."""
        self._update_dynamic_limits()

        advanced_mode = config.get(CONF_ADVANCED_MODE, False)
        self._from_adv_mode = bool(advanced_mode)

        # Compose schema from factories
        schema_dict = {}
        schema_dict.update(self._section_factory_members(config))
        schema_dict.update(self._section_factory_temperature(config))
        schema_dict.update(self._section_factory_humidity(config))

        if advanced_mode:
            schema_dict.update(self._section_factory_sync(config))
            schema_dict.update(self._section_factory_window_control(config))
            schema_dict.update(self._section_factory_presence(config))
            schema_dict.update(self._section_factory_schedule(config))
            schema_dict.update(self._section_factory_temp_offsets(config))
            schema_dict.update(self._section_factory_isolation(config))
            schema_dict.update(self._section_factory_member_template(config))
            schema_dict.update(self._section_factory_advanced(config))

        schema_dict[vol.Optional(CONF_ADVANCED_MODE, default=advanced_mode)] = selector.BooleanSelector()  # type: ignore[index]
        schema_dict[vol.Optional(CONF_EXPAND_SECTIONS, default=config.get(CONF_EXPAND_SECTIONS, False))] = selector.BooleanSelector()  # type: ignore[index]

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(schema_dict),
            description_placeholders={},
            errors=form_errors or {},
        )
