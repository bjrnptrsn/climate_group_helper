"""Config flow for Climate Group helper integration."""

from __future__ import annotations
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
    ATTR_MIN_TEMP,
    ATTR_MAX_TEMP,
    HVACMode,
)
from homeassistant.components.number import DOMAIN as NUMBER_DOMAIN
from homeassistant.components.sensor import DOMAIN as SENSOR_DOMAIN
from homeassistant.const import CONF_ENTITIES, CONF_NAME, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import callback
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.data_entry_flow import section
from homeassistant.helpers import selector

from .const import (
    CONF_CLOSE_DELAY,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPAND_SECTIONS,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_EXPOSE_CONFIG,
    CONF_EXPOSE_SMART_SENSORS,
    CONF_FEATURE_STRATEGY,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HUMIDITY_USE_MASTER,
    CONF_HVAC_MODE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    CONF_MASTER_ENTITY,
    CONF_OVERRIDE_DURATION,
    CONF_PERSIST_ACTIVE_SCHEDULE,
    CONF_PERSIST_CHANGES,
    CONF_RESYNC_INTERVAL,
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
    CONF_TEMP_USE_MASTER,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_CALIBRATION_HEARTBEAT,
    CONF_CALIBRATION_IGNORE_OFF,
    CONF_MIN_TEMP_OFF,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_TEMPERATURE,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_WINDOW_MODE,
    CONF_ZONE_OPEN_DELAY,
    CONF_ZONE_SENSOR,
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_ACTIVATE_DELAY,
    CONF_ISOLATION_RESTORE_DELAY,
    CONF_ISOLATION_TRIGGER,
    CONF_ISOLATION_TRIGGER_HVAC_MODES,
    DEFAULT_ISOLATION_ACTIVATE_DELAY,
    DEFAULT_ISOLATION_RESTORE_DELAY,
    IsolationTrigger,
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
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    DEFAULT_UNION_OUT_OF_BOUNDS_ACTION,
    AdoptManualChanges,
    AverageOption,
    RoundOption,
    CalibrationMode,
    SyncMode,
    UnionOutOfBoundsAction,
    WindowControlAction,
    WindowControlMode,
)

from .climate import (
    DEFAULT_MIN_TEMP,
    DEFAULT_MAX_TEMP,
)


class ClimateGroupConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Climate Group."""

    VERSION = 8

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
            if not user_input.get(CONF_ENTITIES):
                errors[CONF_ENTITIES] = "no_entities"

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


class ClimateGroupOptionsFlow(config_entries.OptionsFlow):
    """Climate Group options flow."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry
        self._min_temp = DEFAULT_MIN_TEMP
        self._max_temp = DEFAULT_MAX_TEMP
        self._refresh_hint_shown = False

    def _update_dynamic_limits(self) -> None:
        """Calculate dynamic temperature limits from member entities."""
        self._min_temp = DEFAULT_MIN_TEMP
        self._max_temp = DEFAULT_MAX_TEMP

        # Try to get limits from member entities
        entities = self._config_entry.options.get(CONF_ENTITIES)
        if entities:
            valid_states = [
                state for entity_id in entities
                if (state := self.hass.states.get(entity_id)) is not None
                and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
            ]
            if valid_states:
                # Min = Highest minimum
                try:
                    min_temps = [float(state.attributes.get(ATTR_MIN_TEMP, DEFAULT_MIN_TEMP)) for state in valid_states]
                    if min_temps:
                        self._min_temp = max(min_temps)
                except (ValueError, TypeError):
                    pass
                
                # Max = Lowest maximum
                try:
                    max_temps = [float(state.attributes.get(ATTR_MAX_TEMP, DEFAULT_MAX_TEMP)) for state in valid_states]
                    if max_temps:
                        self._max_temp = min(max_temps)
                except (ValueError, TypeError):
                    pass

    def _normalize_options(self, user_input: dict[str, Any]) -> dict[str, Any]:
        """Normalize and clean up options based on dependencies."""
        # Start with current config and overlay flat inputs
        current_config = {**self._config_entry.options, **user_input}
        
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
        else:
            # Clean up all master-dependent keys
            current_config.pop(CONF_MASTER_ENTITY, None)
            current_config.pop(CONF_TEMP_USE_MASTER, None)
            current_config.pop(CONF_HUMIDITY_USE_MASTER, None)
            # Downgrade master-dependent settings
            if current_config.get(CONF_SYNC_MODE) == SyncMode.MASTER_LOCK:
                current_config[CONF_SYNC_MODE] = SyncMode.LOCK
            if current_config.get(CONF_WINDOW_ADOPT_MANUAL_CHANGES) == AdoptManualChanges.MASTER_ONLY:
                current_config[CONF_WINDOW_ADOPT_MANUAL_CHANGES] = AdoptManualChanges.OFF

        # Temperature Calibration Logic
        if not current_config.get(CONF_TEMP_SENSORS):
            current_config.pop(CONF_TEMP_UPDATE_TARGETS, None)

        # Window Control Logic
        if not current_config.get(CONF_ROOM_SENSOR) and not current_config.get(CONF_ZONE_SENSOR):
            current_config[CONF_WINDOW_MODE] = WindowControlMode.OFF

        # Isolation Logic
        trigger = current_config.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
        valid_members = set(current_config.get(CONF_ENTITIES, []))

        if trigger == IsolationTrigger.DISABLED:
            # Feature off — clean up all isolation keys
            current_config.pop(CONF_ISOLATION_SENSOR, None)
            current_config.pop(CONF_ISOLATION_ENTITIES, None)
            current_config.pop(CONF_ISOLATION_TRIGGER_HVAC_MODES, None)
        elif trigger == IsolationTrigger.SENSOR:
            # Remove HVAC-mode trigger keys when sensor mode is active
            current_config.pop(CONF_ISOLATION_TRIGGER_HVAC_MODES, None)
            if not user_input.get(CONF_ISOLATION_SENSOR):
                current_config.pop(CONF_ISOLATION_SENSOR, None)
                current_config.pop(CONF_ISOLATION_ENTITIES, None)
            elif CONF_ISOLATION_ENTITIES in current_config:
                current_config[CONF_ISOLATION_ENTITIES] = [
                    eid for eid in current_config[CONF_ISOLATION_ENTITIES] if eid in valid_members
                ]
        elif trigger == IsolationTrigger.MEMBER_OFF:
            # MEMBER_OFF: no sensor, no hvac_mode trigger.
            # Prune stale entity refs; fall back to all members if none selected.
            current_config.pop(CONF_ISOLATION_SENSOR, None)
            current_config.pop(CONF_ISOLATION_TRIGGER_HVAC_MODES, None)
            pruned = [
                eid for eid in current_config.get(CONF_ISOLATION_ENTITIES, [])
                if eid in valid_members
            ]
            current_config[CONF_ISOLATION_ENTITIES] = pruned or list(valid_members)
        else:
            # HVAC_MODE trigger: remove sensor key; prune stale entity refs
            current_config.pop(CONF_ISOLATION_SENSOR, None)
            if CONF_ISOLATION_ENTITIES in current_config:
                current_config[CONF_ISOLATION_ENTITIES] = [
                    eid for eid in current_config[CONF_ISOLATION_ENTITIES] if eid in valid_members
                ]
            # Remove trigger if no hvac_modes configured
            if not current_config.get(CONF_ISOLATION_TRIGGER_HVAC_MODES):
                current_config.pop(CONF_ISOLATION_TRIGGER_HVAC_MODES, None)
                current_config.pop(CONF_ISOLATION_ENTITIES, None)

        # Clean up empty strings/lists for sensors
        for key in [CONF_ROOM_SENSOR, CONF_ZONE_SENSOR, CONF_SCHEDULE_ENTITY]:
            if key in current_config and not current_config[key]:
                current_config.pop(key, None)

        # Collect per-member temperature offsets from form fields
        offset_map: dict[str, float] = {}
        for key in list(current_config.keys()):
            if isinstance(key, str) and key.startswith("Offset: ") and key.endswith(")"):
                # Extract entity_id from between the last parenthesis
                try:
                    entity_id = key.rsplit("(", 1)[-1].rstrip(")")
                    val = current_config.pop(key)
                    if val and val != 0.0:
                        offset_map[entity_id] = float(val)
                except IndexError:
                    pass
            # Backwards compatibility for old temp_offset__ keys during active forms/migrations
            elif isinstance(key, str) and key.startswith("temp_offset__"):
                entity_id = key[len("temp_offset__"):]
                val = current_config.pop(key)
                if val and val != 0.0:
                    offset_map[entity_id] = float(val)
        if offset_map:
            current_config[CONF_MEMBER_TEMP_OFFSETS] = offset_map
        else:
            current_config.pop(CONF_MEMBER_TEMP_OFFSETS, None)

        return current_config

    def _section_factory_members(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for members section."""
        return {
            vol.Required("members_section"): section(
                vol.Schema({
                    vol.Required(CONF_ENTITIES, default=config.get(CONF_ENTITIES, [])): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=CLIMATE_DOMAIN, multiple=True)
                    ),
                    vol.Optional(CONF_MASTER_ENTITY, description={"suggested_value": config.get(CONF_MASTER_ENTITY)}): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=CLIMATE_DOMAIN)
                    ),
                    vol.Required(CONF_HVAC_MODE_STRATEGY, default=config.get(CONF_HVAC_MODE_STRATEGY, HVAC_MODE_STRATEGY_NORMAL)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[HVAC_MODE_STRATEGY_NORMAL, HVAC_MODE_STRATEGY_OFF_PRIORITY, HVAC_MODE_STRATEGY_AUTO],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="hvac_mode_strategy",
                        )
                    ),
                    vol.Required(CONF_FEATURE_STRATEGY, default=config.get(CONF_FEATURE_STRATEGY, FEATURE_STRATEGY_INTERSECTION)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[FEATURE_STRATEGY_INTERSECTION, FEATURE_STRATEGY_UNION],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="feature_strategy",
                        )
                    ),
                    vol.Required(
                        CONF_UNION_OUT_OF_BOUNDS_ACTION,
                        default=config.get(CONF_UNION_OUT_OF_BOUNDS_ACTION, DEFAULT_UNION_OUT_OF_BOUNDS_ACTION),
                    ): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[UnionOutOfBoundsAction.OFF, UnionOutOfBoundsAction.CLAMP],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="union_out_of_bounds_action",
                        )
                    ),
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _section_factory_temperature(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for temperature section."""
        master_fields = {}
        if config.get(CONF_MASTER_ENTITY):
            master_fields[vol.Optional(CONF_TEMP_USE_MASTER, default=config.get(CONF_TEMP_USE_MASTER, False))] = bool

        return {
            vol.Required("temperature_section"): section(
                vol.Schema({
                    vol.Required(CONF_TEMP_TARGET_AVG, default=config.get(CONF_TEMP_TARGET_AVG, AverageOption.MEAN)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in AverageOption],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="temp_target_avg",
                        )
                    ),
                    **master_fields,
                    vol.Required(CONF_TEMP_TARGET_ROUND, default=config.get(CONF_TEMP_TARGET_ROUND, RoundOption.NONE)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in RoundOption],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="temp_target_round",
                        )
                    ),
                    vol.Required(CONF_TEMP_CURRENT_AVG, default=config.get(CONF_TEMP_CURRENT_AVG, AverageOption.MEAN)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in AverageOption],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="temp_current_avg",
                        )
                    ),
                    vol.Optional(CONF_TEMP_SENSORS, default=config.get(CONF_TEMP_SENSORS, [])): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=SENSOR_DOMAIN, multiple=True)
                    ),
                    vol.Optional(CONF_TEMP_UPDATE_TARGETS, default=config.get(CONF_TEMP_UPDATE_TARGETS, [])): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=NUMBER_DOMAIN, multiple=True)
                    ),
                    vol.Required(CONF_TEMP_CALIBRATION_MODE, default=config.get(CONF_TEMP_CALIBRATION_MODE, CalibrationMode.ABSOLUTE)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in CalibrationMode],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="temp_calibration_mode",
                        )
                    ),
                    vol.Optional(CONF_CALIBRATION_HEARTBEAT, default=config.get(CONF_CALIBRATION_HEARTBEAT, 0)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=120, step=1, unit_of_measurement="min", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_CALIBRATION_IGNORE_OFF, default=config.get(CONF_CALIBRATION_IGNORE_OFF, False)): bool,
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _section_factory_humidity(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for humidity section."""
        master_fields = {}
        if config.get(CONF_MASTER_ENTITY):
            master_fields[vol.Optional(CONF_HUMIDITY_USE_MASTER, default=config.get(CONF_HUMIDITY_USE_MASTER, False))] = bool

        return {
            vol.Required("humidity_section"): section(
                vol.Schema({
                    vol.Required(CONF_HUMIDITY_TARGET_AVG, default=config.get(CONF_HUMIDITY_TARGET_AVG, AverageOption.MEAN)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in AverageOption],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="humidity_target_avg",
                        )
                    ),
                    **master_fields,
                    vol.Required(CONF_HUMIDITY_TARGET_ROUND, default=config.get(CONF_HUMIDITY_TARGET_ROUND, RoundOption.NONE)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in RoundOption],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="humidity_target_round",
                        )
                    ),
                    vol.Required(CONF_HUMIDITY_CURRENT_AVG, default=config.get(CONF_HUMIDITY_CURRENT_AVG, AverageOption.MEAN)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[opt.value for opt in AverageOption],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="humidity_current_avg",
                        )
                    ),
                    vol.Optional(CONF_HUMIDITY_SENSORS, default=config.get(CONF_HUMIDITY_SENSORS, [])): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=SENSOR_DOMAIN, multiple=True)
                    ),
                    vol.Optional(CONF_HUMIDITY_UPDATE_TARGETS, default=config.get(CONF_HUMIDITY_UPDATE_TARGETS, [])): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=NUMBER_DOMAIN, multiple=True)
                    ),
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _section_factory_sync(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for sync section."""
        sync_options = [opt.value for opt in SyncMode if opt != SyncMode.MASTER_LOCK]
        if config.get(CONF_MASTER_ENTITY):
            sync_options.append(SyncMode.MASTER_LOCK.value)

        return {
            vol.Required("sync_section"): section(
                vol.Schema({
                    vol.Required(CONF_SYNC_MODE, default=config.get(CONF_SYNC_MODE, SyncMode.DISABLED)): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=sync_options,
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="sync_mode"
                        )
                    ),
                    vol.Required(CONF_SYNC_ATTRS, default=config.get(CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS)): selector.SelectSelector(
                        selector.SelectSelectorConfig(options=SYNC_TARGET_ATTRS, mode=selector.SelectSelectorMode.LIST, multiple=True, translation_key="sync_attributes")
                    ),
                    vol.Optional(CONF_IGNORE_OFF_MEMBERS_SYNC, default=config.get(CONF_IGNORE_OFF_MEMBERS_SYNC, False)): bool,
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
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
            adopt_val = AdoptManualChanges(adopt_val)
        except (ValueError, KeyError):
            adopt_val = AdoptManualChanges.OFF

        return {
            vol.Required("window_section"): section(
                vol.Schema({
                    vol.Required(CONF_WINDOW_MODE, default=config.get(CONF_WINDOW_MODE, WindowControlMode.OFF)): selector.SelectSelector(
                        selector.SelectSelectorConfig(options=[opt.value for opt in WindowControlMode], mode=selector.SelectSelectorMode.DROPDOWN, translation_key="window_mode")
                    ),
                    vol.Required(CONF_WINDOW_ADOPT_MANUAL_CHANGES, default=adopt_val): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=adopt_options,
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="window_adopt_manual_changes",
                        )
                    ),
                    vol.Required(CONF_WINDOW_ACTION, default=config.get(CONF_WINDOW_ACTION, WindowControlAction.OFF)): selector.SelectSelector(
                        selector.SelectSelectorConfig(options=[opt.value for opt in WindowControlAction], mode=selector.SelectSelectorMode.DROPDOWN, translation_key="window_action")
                    ),
                    vol.Optional(CONF_WINDOW_TEMPERATURE, description={"suggested_value": config.get(CONF_WINDOW_TEMPERATURE)}): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=self._min_temp, max=self._max_temp, step=0.5, unit_of_measurement="°C", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_ROOM_SENSOR, description={"suggested_value": config.get(CONF_ROOM_SENSOR)}): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["binary_sensor", "input_boolean"])
                    ),
                    vol.Optional(CONF_ZONE_SENSOR, description={"suggested_value": config.get(CONF_ZONE_SENSOR)}): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["binary_sensor", "input_boolean"])
                    ),
                    vol.Optional(CONF_ROOM_OPEN_DELAY, default=config.get(CONF_ROOM_OPEN_DELAY, DEFAULT_ROOM_OPEN_DELAY)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=120, step=1, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_ZONE_OPEN_DELAY, default=config.get(CONF_ZONE_OPEN_DELAY, DEFAULT_ZONE_OPEN_DELAY)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=1, max=900, step=5, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_CLOSE_DELAY, default=config.get(CONF_CLOSE_DELAY, DEFAULT_CLOSE_DELAY)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=300, step=1, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
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
            name = state.attributes.get("friendly_name", entity_id) if state else entity_id
            
            # Format: "Offset: Friendly Name (entity_id)" so HA displays it nicely
            key = f"Offset: {name} ({entity_id})"
            
            fields[vol.Optional(key, default=offsets.get(entity_id, 0.0))] = selector.NumberSelector(
                selector.NumberSelectorConfig(min=-20, max=20, step=0.5, unit_of_measurement="°", mode=selector.NumberSelectorMode.SLIDER)
            )
        return {
            vol.Required("temp_offsets_section"): section(
                vol.Schema(fields),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _section_factory_isolation(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for member isolation section. Hidden when group has fewer than 2 members."""
        members = config.get(CONF_ENTITIES, [])
        if len(members) < 2:
            return {}

        # Filter saved entities to only those still in the group (stale-ref guard)
        saved_isolation = [e for e in config.get(CONF_ISOLATION_ENTITIES, []) if e in members]
        member_options = [{"value": eid, "label": eid} for eid in members]

        # Collect available HVAC modes from member states (for HVAC_MODE trigger selector)
        from homeassistant.components.climate import ATTR_HVAC_MODES as _ATTR_HVAC_MODES
        available_hvac_modes: list[str] = []
        seen: set[str] = set()
        for entity_id in members:
            if state := self.hass.states.get(entity_id):
                for mode in state.attributes.get(_ATTR_HVAC_MODES, []):
                    if mode not in seen:
                        seen.add(mode)
                        available_hvac_modes.append(mode)

        trigger = config.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
        saved_hvac_modes = [m for m in config.get(CONF_ISOLATION_TRIGGER_HVAC_MODES, []) if m in seen]
        hvac_mode_options = available_hvac_modes if available_hvac_modes else [m.value for m in HVACMode]

        return {
            vol.Required("isolation_section"): section(
                vol.Schema({
                    vol.Required(CONF_ISOLATION_TRIGGER, default=trigger): selector.SelectSelector(
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
                    vol.Optional(CONF_ISOLATION_SENSOR, description={"suggested_value": config.get(CONF_ISOLATION_SENSOR)}): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["binary_sensor", "input_boolean"])
                    ),
                    vol.Optional(CONF_ISOLATION_TRIGGER_HVAC_MODES, default=saved_hvac_modes): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=hvac_mode_options,
                            multiple=True,
                            mode=selector.SelectSelectorMode.DROPDOWN,
                            translation_key="isolation_trigger_hvac_modes",
                        )
                    ),
                    vol.Optional(CONF_ISOLATION_ENTITIES, default=saved_isolation): selector.SelectSelector(
                        selector.SelectSelectorConfig(options=member_options, multiple=True, mode=selector.SelectSelectorMode.DROPDOWN)
                    ),
                    vol.Optional(CONF_ISOLATION_ACTIVATE_DELAY, default=config.get(CONF_ISOLATION_ACTIVATE_DELAY, DEFAULT_ISOLATION_ACTIVATE_DELAY)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=300, step=1, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_ISOLATION_RESTORE_DELAY, default=config.get(CONF_ISOLATION_RESTORE_DELAY, DEFAULT_ISOLATION_RESTORE_DELAY)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=300, step=1, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _section_factory_schedule(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for schedule section."""
        return {
            vol.Required("schedule_section"): section(
                vol.Schema({
                    vol.Optional(CONF_SCHEDULE_ENTITY, description={"suggested_value": config.get(CONF_SCHEDULE_ENTITY)}): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="schedule")
                    ),
                    vol.Optional(CONF_RESYNC_INTERVAL, default=config.get(CONF_RESYNC_INTERVAL, 0)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=120, step=1, unit_of_measurement="min", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_OVERRIDE_DURATION, default=config.get(CONF_OVERRIDE_DURATION, 0)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=120, step=1, unit_of_measurement="min", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_PERSIST_CHANGES, default=config.get(CONF_PERSIST_CHANGES, False)): bool,
                    vol.Optional(CONF_PERSIST_ACTIVE_SCHEDULE, default=config.get(CONF_PERSIST_ACTIVE_SCHEDULE, False)): bool,
                    vol.Optional(CONF_IGNORE_OFF_MEMBERS_SCHEDULE, default=config.get(CONF_IGNORE_OFF_MEMBERS_SCHEDULE, False)): bool,
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
            )
        }

    def _section_factory_advanced(self, config: dict[str, Any]) -> dict[str, Any]:
        """Factory for advanced section."""
        return {
            vol.Required("advanced_section"): section(
                vol.Schema({
                    vol.Optional(CONF_DEBOUNCE_DELAY, default=config.get(CONF_DEBOUNCE_DELAY, 0)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=10, step=0.1, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_RETRY_ATTEMPTS, default=config.get(CONF_RETRY_ATTEMPTS, 0)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=5, step=1, mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_RETRY_DELAY, default=config.get(CONF_RETRY_DELAY, 2.5)): selector.NumberSelector(
                        selector.NumberSelectorConfig(min=0, max=10, step=0.5, unit_of_measurement="s", mode=selector.NumberSelectorMode.SLIDER)
                    ),
                    vol.Optional(CONF_MIN_TEMP_OFF, default=config.get(CONF_MIN_TEMP_OFF, False)): bool,
                    vol.Optional(CONF_EXPOSE_SMART_SENSORS, default=config.get(CONF_EXPOSE_SMART_SENSORS, False)): bool,
                    vol.Optional(CONF_EXPOSE_MEMBER_ENTITIES, default=config.get(CONF_EXPOSE_MEMBER_ENTITIES, True)): bool,
                    vol.Optional(CONF_EXPOSE_CONFIG, default=config.get(CONF_EXPOSE_CONFIG, False)): bool,
                }),
                {"collapsed": not config.get(CONF_EXPAND_SECTIONS)}
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
            
            # Suggest a refresh if master changed and hint not yet shown
            new_master = flattened_input.get(CONF_MASTER_ENTITY)
            master_changed = (CONF_MASTER_ENTITY in flattened_input and new_master != old_master)
            
            if master_changed and not self._refresh_hint_shown:
                self._refresh_hint_shown = True
                current_config = {**self._config_entry.options, **flattened_input}
                return await self._show_main_form(current_config, form_errors={
                    "base": "master_refresh_notice",
                    "temperature_section": "master_options_notice",
                    "humidity_section": "master_options_notice",
                    "sync_section": "master_options_notice",
                    "window_section": "master_options_notice",
                })

            # Reset hint marker and save
            self._refresh_hint_shown = False

            # Validate: isolation_entities must be a proper subset of entities
            # (not enforced for MEMBER_OFF — dynamic per-entity trigger has no batch deadlock risk)
            entities = set(flattened_input.get(CONF_ENTITIES, self._config_entry.options.get(CONF_ENTITIES, [])))
            isolation_trigger = flattened_input.get(CONF_ISOLATION_TRIGGER, IsolationTrigger.DISABLED)
            isolation_entities = set(flattened_input.get(CONF_ISOLATION_ENTITIES, []))
            if isolation_trigger not in (IsolationTrigger.DISABLED, IsolationTrigger.MEMBER_OFF) and isolation_entities and isolation_entities >= entities:
                current_config = {**self._config_entry.options, **flattened_input}
                return await self._show_main_form(current_config, form_errors={
                    "isolation_section": "isolation_all_selected",
                })

            final_options = self._normalize_options(flattened_input)
            return self.async_create_entry(title="", data=final_options)

        return await self._show_main_form(self._config_entry.options)

    async def _show_main_form(self, config: dict[str, Any], form_errors: dict[str, str] | None = None) -> ConfigFlowResult:
        """Show the unified configuration form."""
        self._update_dynamic_limits()

        # Compose schema from factories
        schema_dict = {}
        schema_dict.update(self._section_factory_members(config))
        schema_dict.update(self._section_factory_temperature(config))
        schema_dict.update(self._section_factory_humidity(config))
        schema_dict.update(self._section_factory_sync(config))
        schema_dict.update(self._section_factory_window_control(config))
        schema_dict.update(self._section_factory_temp_offsets(config))
        schema_dict.update(self._section_factory_isolation(config))
        schema_dict.update(self._section_factory_schedule(config))
        schema_dict.update(self._section_factory_advanced(config))

        schema_dict[vol.Optional(CONF_EXPAND_SECTIONS, default=config.get(CONF_EXPAND_SECTIONS, False))] = bool

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(schema_dict),
            description_placeholders={},
            errors=form_errors or {},
        )
