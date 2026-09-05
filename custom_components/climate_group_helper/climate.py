"""This platform allows several climate devices to be grouped into one climate device."""
from __future__ import annotations

from dataclasses import replace
import asyncio
import logging
import time
from statistics import mean, median
from typing import Any, Awaitable, Callable

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_PRESET_MODE,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_MODE,
    DEFAULT_MAX_HUMIDITY,
    DEFAULT_MAX_TEMP,
    DEFAULT_MIN_HUMIDITY,
    DEFAULT_MIN_TEMP,
    ClimateEntity,
    HVACMode,
)
from homeassistant.components.group.entity import GroupEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    CONF_ENTITIES,
    CONF_NAME,
)
from homeassistant.core import HomeAssistant, State, callback, Event
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import (
    CONF_ADVANCED_MODE,
    CONF_DEBOUNCE_DELAY,
    CONF_EXPOSE_MEMBER_ENTITIES,
    CONF_FEATURE_STRATEGY,
    CONF_GRACE_PERIOD,
    CONF_GROUP_PRESETS,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_TARGET_ROUND,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_HUMIDITY_USE_MASTER,
    CONF_HVAC_MODE_STRATEGY,
    CONF_IGNORE_OFF_MEMBERS_TEMPERATURE,
    CONF_ISOLATION_RULES,
    CONF_ISOLATION_RULES_COUNT,
    CONF_ISOLATION_SLOT,
    CONF_MASTER_ENTITY,
    CONF_MEMBER_OFFSET_CORRECTION,
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_MIN_TEMP_OFF,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_TARGET_ROUND,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_TEMP_USE_MASTER,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_RANGE_TEMPLATE_ENABLED,
    CONF_RANGE_TEMPLATE_DEADBAND_ACTION,
    CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
    CONF_RANGE_TEMPLATE_COOL_ENTITIES,
    CONF_RANGE_TEMPLATE_HUMIDITY_ACTION,
    CONF_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY,
    CONF_RANGE_TEMPLATE_HUMIDITY_ENABLED,
    CONF_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS,
    DEFAULT_DEBOUNCE_DELAY,
    DEFAULT_GRACE_PERIOD,
    DEFAULT_RANGE_TEMPLATE_HUMIDITY_ACTION,
    DEFAULT_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY,
    DEFAULT_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS,
    DEFAULT_SUPPORTED_FEATURES,
    DOMAIN,
    AdoptManualChanges,
    AverageOption,
    FeatureStrategy,
    HvacModeStrategy,
    RoundOption,
    RangeTemplateDeadbandAction,
)
from .aggregation import Aggregator
from .calibration import CalibrationHandler
from .initialization import (
    filter_sensor_entities,
    restore_state,
    strip_self_reference,
    warn_missing_entities,
)
from .isolation import MemberIsolationHandler
from .override import (
    BoostOverrideManager,
    OverrideHandler,
    SwitchOverrideManager,
    WindowOverrideManager,
)
from .presence import PresenceHandler, PresenceOverrideManager
from .member_template import MemberTemplateManager
from .preset import PresetManager
from .reset import async_reset_group
from .schedule import ScheduleHandler, ScheduleBypassHandler
from .services import async_apply_config, async_boost, async_register_services
from .service_call import (
    ClimateCallHandler,
    OverrideCallHandler,
    PresenceCallHandler,
    ScheduleCallHandler,
    SwitchCallHandler,
    SwitchEnforceCallHandler,
    SyncCallHandler,
    TemplateCallHandler,
    WindowControlCallHandler,
)
from .state import (
    ChangeState,
    CurrentState,
    RunState,
    TargetState,
    ClimateStateManager,
    FollowStateManager,
    ScheduleStateManager,
    SyncModeStateManager,
    WindowControlStateManager,
)
from .sync_mode import SyncModeHandler
from .window_control import WindowControlHandler
from .meta_processor import SlotMetaProcessor
from .status import build_extra_state_attributes

CALC_TYPES: dict[AverageOption, Callable[..., float]] = {
    AverageOption.MIN: min,
    AverageOption.MAX: max,
    AverageOption.MEAN: mean,
    AverageOption.MEDIAN: median,
}

# No limit on parallel updates to enable a group calling another group
PARALLEL_UPDATES = 0

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Initialize Climate Group config entry."""

    config = {**config_entry.options}

    registry = er.async_get(hass)
    entities = er.async_validate_entity_ids(registry, config[CONF_ENTITIES])

    group = ClimateGroupHelper(
        hass=hass,
        unique_id=config_entry.unique_id,
        name=config.get(CONF_NAME, config_entry.title),
        entity_ids=entities,
        config=config,
    )

    # Store reference for other platforms (switch, etc.) to access the group entity
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN].setdefault(config_entry.entry_id, {})
    hass.data[DOMAIN][config_entry.entry_id]["group"] = group

    async_add_entities([group])


class ClimateGroupHelper(GroupEntity, ClimateEntity, RestoreEntity):
    """Representation of a climate group."""

    def __init__(
        self,
        hass: HomeAssistant,
        unique_id: str | None,
        name: str,
        entity_ids: list[str],
        config: dict[str, Any],
    ) -> None:
        """Initialize a climate group."""

        # Home Assistant
        self.hass = hass
        self.entry: ConfigEntry | None = None
        self.config = config
        self.climate_entity_ids = entity_ids
        self.event: Event | None = None
        self._attr_name = name
        self._attr_unique_id = unique_id
        self._event_entity_id: str | None = None

        # Advanced mode
        self._advanced_mode: bool = config.get(CONF_ADVANCED_MODE, False)

        def _get_adv(key: str, fallback: Any = None) -> Any:
            """Return config[key] only in advanced mode, else fallback."""
            return config.get(key, fallback) if self._advanced_mode else fallback

        # Master entity
        self._master_entity_id = _get_adv(CONF_MASTER_ENTITY)
        self._temp_use_master = _get_adv(CONF_TEMP_USE_MASTER, False)
        self._humidity_use_master = _get_adv(CONF_HUMIDITY_USE_MASTER, False)
        # Temperature calculation options
        self._temp_current_avg_calc = CALC_TYPES[config.get(CONF_TEMP_CURRENT_AVG, AverageOption.MEAN)]
        self._temp_target_avg_calc = CALC_TYPES[config.get(CONF_TEMP_TARGET_AVG, AverageOption.MEAN)]
        self._temp_round = config.get(CONF_TEMP_TARGET_ROUND, RoundOption.NONE)
        # Humidity calculation options
        self._humidity_current_avg_calc = CALC_TYPES[config.get(CONF_HUMIDITY_CURRENT_AVG, AverageOption.MEAN)]
        self._humidity_target_avg_calc = CALC_TYPES[config.get(CONF_HUMIDITY_TARGET_AVG, AverageOption.MEAN)]
        self._humidity_round = config.get(CONF_HUMIDITY_TARGET_ROUND, RoundOption.NONE)
        # HVAC mode strategy
        self._hvac_mode_strategy = config.get(CONF_HVAC_MODE_STRATEGY, HvacModeStrategy.NORMAL)
        self._feature_strategy = config.get(CONF_FEATURE_STRATEGY, FeatureStrategy.INTERSECTION)
        self.debounce_delay = config.get(CONF_DEBOUNCE_DELAY, DEFAULT_DEBOUNCE_DELAY)
        self.retry_attempts = int(config.get(CONF_RETRY_ATTEMPTS, 0))
        self.retry_delay = config.get(CONF_RETRY_DELAY, 2.5)
        self.temp_sensor_entity_ids = _get_adv(CONF_TEMP_SENSORS, [])
        self.temp_update_target_entity_ids = _get_adv(CONF_TEMP_UPDATE_TARGETS, [])
        self.humidity_sensor_entity_ids = _get_adv(CONF_HUMIDITY_SENSORS, [])
        self.humidity_update_target_entity_ids = _get_adv(CONF_HUMIDITY_UPDATE_TARGETS, [])
        self._expose_member_entities: bool = _get_adv(CONF_EXPOSE_MEMBER_ENTITIES, False)
        self.min_temp_off = config.get(CONF_MIN_TEMP_OFF, False)
        self._window_adopt_manual_changes = config.get(CONF_WINDOW_ADOPT_MANUAL_CHANGES, AdoptManualChanges.OFF)
        self._temp_offset_map: dict[str, float] = config.get(CONF_MEMBER_TEMP_OFFSETS, {})
        self._member_offset_correction: bool = config.get(CONF_MEMBER_OFFSET_CORRECTION, True)
        self._ignore_off_members_temperature: bool = config.get(CONF_IGNORE_OFF_MEMBERS_TEMPERATURE, False)
        self._member_temp_avg = None

        # Range Template (Member Template Pattern)
        deadband_action = None
        if _get_adv(CONF_RANGE_TEMPLATE_ENABLED, False):
            deadband_action = config.get(CONF_RANGE_TEMPLATE_DEADBAND_ACTION, RangeTemplateDeadbandAction.NONE)
        humidity_enabled = _get_adv(CONF_RANGE_TEMPLATE_HUMIDITY_ENABLED, False) and deadband_action is not None
        self.member_template_manager = MemberTemplateManager(
            group=self,
            deadband_action=deadband_action,
            heat_entities=set(config.get(CONF_RANGE_TEMPLATE_HEAT_ENTITIES, [])),
            cool_entities=set(config.get(CONF_RANGE_TEMPLATE_COOL_ENTITIES, [])),
            humidity_enabled=humidity_enabled,
            humidity_action=config.get(CONF_RANGE_TEMPLATE_HUMIDITY_ACTION, DEFAULT_RANGE_TEMPLATE_HUMIDITY_ACTION),
            humidity_hysteresis=float(config.get(CONF_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS, DEFAULT_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS)),
            humidity_deactivation_delay=float(config.get(CONF_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY, DEFAULT_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY)),
        )

        # Aggregator first: CalibrationHandler reads member states through it.
        self.aggregator = Aggregator(self)
        self.calibration_handler = CalibrationHandler(self)

        # State variables
        self.shared_target_state = TargetState()
        self.current_group_state = CurrentState()
        self.change_state: ChangeState | None = None
        self.master_state: State | None = None
        self.current_master_state = CurrentState()
        self.run_state = RunState()
        self._startup_initialized = False
        self._grace_period = float(config.get(CONF_GRACE_PERIOD, DEFAULT_GRACE_PERIOD))

        # State managers
        self.climate_state_manager = ClimateStateManager(self)
        self.follow_state_manager = FollowStateManager(self)
        self.schedule_state_manager = ScheduleStateManager(self)
        self.sync_mode_state_manager = SyncModeStateManager(self)
        self.window_control_state_manager = WindowControlStateManager(self)

        # Call handlers
        self.climate_call_handler = ClimateCallHandler(self)
        self.offset_entity_id: str | None = None
        self.offset_set_callback: Callable[[float], Awaitable[None]] | None = None
        # Registered by ControlSwitch so external block changes (e.g. schedule
        # meta-key turn_off) are written to the switch entity's HA state.
        self.switch_state_callback: Callable[[], None] | None = None
        self.slot_meta_processor = SlotMetaProcessor(self)
        self.override_call_handler = OverrideCallHandler(self)
        self.presence_call_handler = PresenceCallHandler(self)
        self.schedule_call_handler = ScheduleCallHandler(self)
        self.switch_call_handler = SwitchCallHandler(self)
        self.switch_enforce_call_handler = SwitchEnforceCallHandler(self)
        self.sync_mode_call_handler = SyncCallHandler(self)
        self.template_call_handler = TemplateCallHandler(self)
        self.window_control_call_handler = WindowControlCallHandler(self)

        # Modules
        self.boost_override_manager = BoostOverrideManager(self)
        # Only the rules up to CONF_ISOLATION_RULES_COUNT are instantiated:
        # rules beyond the chosen count are hidden (kept in the config so the
        # options flow can reveal them again) and must NOT act on the group.
        # Entries without an explicit count default to all rules active.
        isolation_rules = self.config.get(CONF_ISOLATION_RULES, [])
        try:
            isolation_rule_count = max(1, int(self.config.get(CONF_ISOLATION_RULES_COUNT, len(isolation_rules))))
        except (TypeError, ValueError):
            isolation_rule_count = len(isolation_rules)
        # Preset each device carried before the FIRST isolation rule touched it
        # (PRESET_MODE pre-action only). Owned by the group, not by a rule: a
        # device has exactly one original preset, while several rules may cover
        # it — every rule after the first only ever sees a pre-action value.
        # Written by the rule that isolates a free device, consumed by the rule
        # that performs the final release. See isolation.py.
        self.isolation_pre_action_presets: dict[str, str | None] = {}
        # Selected by slot number, not by list position: a rule deleted in a
        # visible slot shortens the list, and a positional slice would then pull
        # a hidden rule into the active range. Rules without the field fall back
        # to their list position — what it meant before the migration filled it
        # in, so an un-migrated entry behaves exactly as it did before.
        self.member_isolation_handlers: list[MemberIsolationHandler] = (
            [
                MemberIsolationHandler(self, rule, index)
                for index, rule in enumerate(isolation_rules, start=1)
                if rule.get(CONF_ISOLATION_SLOT, index) <= isolation_rule_count
            ]
            if self.advanced_mode else []
        )
        self.override_handler = OverrideHandler(self)
        self.presence_handler = PresenceHandler(self)
        self.presence_override_manager = PresenceOverrideManager(self)
        self.slot_transition_lock = asyncio.Lock()
        self.schedule_handler = ScheduleHandler(self)
        self.schedule_bypass_handler = ScheduleBypassHandler(self)
        self.switch_override_manager = SwitchOverrideManager(self)
        self.sync_mode_handler = SyncModeHandler(self)
        self.preset_manager = PresetManager(self)
        self.preset_manager.update_config(self.config.get(CONF_GROUP_PRESETS))
        self.window_control_handler = WindowControlHandler(self)
        self.window_override_manager = WindowOverrideManager(self)

        # Attributes
        self._attr_supported_features = DEFAULT_SUPPORTED_FEATURES
        self._attr_temperature_unit = hass.config.units.temperature_unit

        self._attr_available = False
        self._attr_assumed_state = True

        self._current_hvac_modes: list[str] = []

        self._attr_current_temperature = None
        self._attr_target_temperature = None
        self._attr_target_temperature_step = None
        self._attr_target_temperature_low = None
        self._attr_target_temperature_high = None
        self._attr_min_temp = DEFAULT_MIN_TEMP
        self._attr_max_temp = DEFAULT_MAX_TEMP
        self._attr_current_humidity = None
        self._attr_target_humidity = None
        self._attr_min_humidity = DEFAULT_MIN_HUMIDITY
        self._attr_max_humidity = DEFAULT_MAX_HUMIDITY
        self._attr_target_humidity_step = None

        self._attr_hvac_modes = [HVACMode.OFF]
        self._attr_hvac_mode = None

        self._attr_hvac_action = None

        self._attr_fan_modes = None
        self._attr_fan_mode = None

        self._attr_preset_modes = None
        self._attr_preset_mode = None

        self._attr_swing_modes = None
        self._attr_swing_mode = None

        self._attr_swing_horizontal_modes = None
        self._attr_swing_horizontal_mode = None

        self._attr_translation_key = "climate_group_helper"

    @property
    def device_info(self) -> dict[str, Any]:  # type: ignore[override]
        """Return the device info."""
        return {
            "identifiers": {(DOMAIN, self._attr_unique_id)},
            "name": self._attr_name,
            "manufacturer": "Climate Group Helper",
        }

    @property
    def advanced_mode(self) -> bool:
        """Return True if the group is in advanced mode."""
        return self._advanced_mode

    @property
    def log_id(self) -> str:
        """Identity for log messages: entity id once assigned, else the configured name.

        Several handlers log during `__init__`, which runs before HA assigns
        `entity_id` — a bare '[None]' prefix would make the messages
        untraceable. All init-phase logging goes through this property.
        """
        return self.entity_id or str(self.config.get(CONF_NAME, DOMAIN))

    @property
    def preset_mode(self) -> str | None:
        """Return the current preset mode."""
        if self.run_state.active_virtual_preset and self.preset_manager.is_virtual(
            self.run_state.active_virtual_preset
        ):
            return self.run_state.active_virtual_preset
        return self._attr_preset_mode

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return entity specific state attributes."""
        return build_extra_state_attributes(self)

    async def async_added_to_hass(self) -> None:
        """Restore states before registering listeners."""
        if self.platform:
            self.entry = self.platform.config_entry

        # startup_time only gates the short sync-suppression window (sync_mode.py);
        # it must be armed at setup regardless of member readiness — otherwise a
        # permanently unavailable member (empty battery, unpaired device) would
        # leave it unset forever and block ALL sync/enforcement indefinitely.
        if self.run_state.startup_time is None:
            self.run_state = replace(self.run_state, startup_time=time.monotonic())

        # Must run before restore_state(): the restored full-isolation invariant
        # check counts climate_entity_ids, so it must not see the self-reference.
        strip_self_reference(self)

        # Some integrations, such as HomeKit, Google Home, and Alexa
        # require final property lists during the initialization process e.g. hvac_modes.
        # Therefore, we restore some of the last known states before registering the listeners.
        if (last_state := await self.async_get_last_state()) is not None:
            restore_state(self, last_state)

        filter_sensor_entities(self)
        warn_missing_entities(self.hass, self.config, self.entity_id)

        _LOGGER.debug(
            "[%s] Registering core listeners: members=%s, temp_sensors=%s, humidity_sensors=%s",
            self.entity_id,
            self.climate_entity_ids,
            self.temp_sensor_entity_ids,
            self.humidity_sensor_entity_ids,
        )

        # Register listeners
        self.async_on_remove(
            async_track_state_change_event(
                self.hass, self._entity_ids, self._state_change_listener  # type: ignore[arg-type]
            )
        )

        if self.advanced_mode:
            # Setup calibration handler first (builds target→member mapping, starts
            # heartbeat) — side-effect-free (no service calls), safe to run before
            # the Cold-Start-Init update below so the mapping exists once the
            # startup force-sync fires.
            await self.calibration_handler.async_setup()

        # Cold Start: populate shared_target_state from current (pre-override) member
        # values *before* any handler below can send a blocking call (Presence-Away,
        # Window Control OFF, ...). Otherwise a handler that activates immediately
        # during its own async_setup() (e.g. PresenceOverrideManager with an absent
        # sensor at startup) forces members OFF first, and Cold-Start-Init would
        # seed shared_target_state from that already-overridden physical state
        # instead of the real prior state, so the group could never recover to
        # the previous mode once the sensor returned.
        self.async_defer_or_update_ha_state()

        if self.advanced_mode:
            # Setup window control (subscribes to sensor events)
            await self.window_control_handler.async_setup()

            # Setup override handler (registers call triggers for boost abort)
            self.override_handler.async_setup()

            # Setup presence handler (subscribes to sensor events)
            await self.presence_handler.async_setup()

            # Setup schedule handler (subscribes to schedule entity and execution hooks)
            await self.schedule_handler.async_setup()
            await self.schedule_bypass_handler.async_setup()

            # Setup member isolation handlers (subscribe to isolation sensor events)
            for handler in self.member_isolation_handlers:
                await handler.async_setup()

        # Update state again to reflect any blocking source activated above.
        self.async_defer_or_update_ha_state()

        async_register_services(self)

    async def async_service_set_schedule_entity(self, schedule_entity: str | None = None) -> None:
        """Handle set_schedule_entity service."""
        await self.schedule_handler.update_schedule_entity(schedule_entity)

    async def async_service_set_schedule_bypass_entity(self, schedule_bypass_entity: str | None = None) -> None:
        """Handle set_schedule_bypass_entity service."""
        await self.schedule_bypass_handler.update_bypass_entity(schedule_bypass_entity)

    async def async_service_set_schedule_fallback_payload(self, fallback_payload: Any = None) -> None:
        """Handle set_schedule_fallback_payload service."""
        await self.schedule_handler.update_fallback_payload(fallback_payload)

    async def async_service_set_group_preset(self, payload: Any = None) -> None:
        """Handle set_group_preset service."""
        await self.preset_manager.async_update_runtime_presets(payload)

    async def async_service_boost(self, **options: Any) -> None:
        """Handle boost service call."""
        await async_boost(self, **options)

    async def async_service_reset(self, **options: bool) -> None:
        """Handle reset service call."""
        await async_reset_group(self, **options)

    async def async_service_apply_config(self, **options: Any) -> None:
        """Handle apply_config service call."""
        await async_apply_config(self, **options)

    async def async_will_remove_from_hass(self) -> None:
        """Handle removal."""
        self.aggregator._cancel_grace_period_timer()
        await self.climate_call_handler.async_shutdown()
        await self.override_call_handler.async_shutdown()
        await self.presence_call_handler.async_shutdown()
        await self.schedule_call_handler.async_shutdown()
        await self.switch_call_handler.async_shutdown()
        await self.switch_enforce_call_handler.async_shutdown()
        await self.sync_mode_call_handler.async_shutdown()
        await self.template_call_handler.async_shutdown()
        await self.window_control_call_handler.async_shutdown()
        self.member_template_manager.async_cancel_timers()
        self.sync_mode_handler.async_teardown()

        if self.advanced_mode:
            self.calibration_handler.async_teardown()
            for handler in self.member_isolation_handlers:
                handler.async_teardown()
            self.override_handler.async_teardown()
            self.presence_handler.async_teardown()
            self.schedule_handler.async_teardown()
            self.schedule_bypass_handler.async_teardown()
            self.window_control_handler.async_teardown()

        await super().async_will_remove_from_hass()

    @callback
    def _state_change_listener(self, event: Event | None = None) -> None:
        """Handle a member `state_changed` event.

        For active Member Templates (e.g. Range Template), the event is
        reconstructed at the source with rendered `new_state`/`old_state` so
        all downstream consumers (`ChangeState.from_event`, `SyncModeHandler`,
        …) see a template-rendered event transparently. A new object is built
        rather than the original edited: the event's `data` dict is shared with
        every other listener, so rendering into it would rewrite the states they
        see. `context`, `origin` and `time_fired_timestamp` are carried over —
        losing any of them would break echo suppression and origin analysis.
        """
        if event is not None:
            # Template coverage must be current BEFORE the event is rendered:
            # `read_member_event` → `apply_state` decides per entity_id whether to
            # wrap, and that decision travels with the event through the whole
            # downstream chain. `async_update_group_state()` recomputes coverage
            # too, but only after this listener returns — an event rendered here
            # would carry the *previous* cycle's snapshot. That gap is what let a
            # covered member reconnecting as physically `off` (the normal deadband
            # state) be adopted as a group OFF.
            self.member_template_manager.update_members()
            new_wrapped, old_wrapped = self.aggregator.read_member_event(event)
            event = Event(
                event_type=event.event_type,
                data={
                    **event.data,
                    "new_state": new_wrapped,
                    "old_state": old_wrapped,
                },
                origin=event.origin,
                time_fired_timestamp=event.time_fired_timestamp,
                context=event.context,
            )
        self.event = event
        self.async_defer_or_update_ha_state()

    @callback
    def _trigger_template_changeover(self) -> None:
        """Schedule a TemplateCallHandler enforcement for covered members.

        Called from the member-event path, a sync `@callback`: `call_debounced` is
        a coroutine, hence the background task.
        """
        self.hass.async_create_background_task(
            self.template_call_handler.call_debounced(),
            name="climate_group_template_changeover",
        )

    @callback
    def async_update_group_state(self) -> None:
        """Query all members and determine the climate group state."""
        self.aggregator.async_update_group_state()

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Forward the set_hvac_mode command to all climate in the climate group."""
        self.climate_state_manager.update(hvac_mode=hvac_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_HVAC_MODE: hvac_mode})

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Forward the set_temperature command to all climate in the climate group."""
        self.climate_state_manager.update(**kwargs)
        await self.climate_call_handler.call_debounced(data=kwargs)

    async def async_set_humidity(self, humidity: int) -> None:
        """Forward the set_humidity command to all climate in the climate group."""
        self.climate_state_manager.update(humidity=humidity)
        await self.climate_call_handler.call_debounced(data={ATTR_HUMIDITY: humidity})

    async def async_set_fan_mode(self, fan_mode: str) -> None:
        """Forward the set_fan_mode to all climate in the climate group."""
        self.climate_state_manager.update(fan_mode=fan_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_FAN_MODE: fan_mode})

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        """Forward the set_preset_mode to all climate in the climate group."""
        self.climate_state_manager.update(preset_mode=preset_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_PRESET_MODE: preset_mode})

    async def async_set_swing_mode(self, swing_mode: str) -> None:
        """Forward the set_swing_mode to all climate in the climate group."""
        self.climate_state_manager.update(swing_mode=swing_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_SWING_MODE: swing_mode})

    async def async_set_swing_horizontal_mode(self, swing_horizontal_mode: str) -> None:
        """Set new target horizontal swing operation."""
        self.climate_state_manager.update(swing_horizontal_mode=swing_horizontal_mode)
        await self.climate_call_handler.call_debounced(data={ATTR_SWING_HORIZONTAL_MODE: swing_horizontal_mode})

    async def async_turn_on(self) -> None:
        """Forward the turn_on command to all climate in the climate group."""

        # Set to the last active HVAC mode if available — but only when the group
        # still supports it. A valid mode no member supports (e.g. cool after a
        # TRV swap) produces zero calls via the capability filter, so returning
        # here without the membership check would leave the group stuck OFF.
        last_mode: HVACMode | None = None
        if self.run_state.last_active_hvac_mode is not None:
            try:
                last_mode = HVACMode(self.run_state.last_active_hvac_mode)
            except ValueError:
                _LOGGER.warning(
                    "[%s] Restored last_active_hvac_mode '%s' is not a valid HVACMode, falling back",
                    self.entity_id, self.run_state.last_active_hvac_mode,
                )
        if last_mode is not None and last_mode != HVACMode.OFF and last_mode in self._attr_hvac_modes:
            _LOGGER.debug("[%s] Turn on with the last active HVAC mode: %s", self.entity_id, last_mode)
            await self.async_set_hvac_mode(last_mode)
            return

        # Fall back to the first available non-OFF mode
        for mode in self._attr_hvac_modes:
            if mode != HVACMode.OFF:
                _LOGGER.debug("[%s] Turn on with first available HVAC mode: %s", self.entity_id, mode)
                await self.async_set_hvac_mode(mode)
                return

        _LOGGER.debug("[%s] Can't turn on: No HVAC modes available", self.entity_id)

    async def async_turn_off(self) -> None:
        """Forward the turn_off command to all climate in the climate group."""

        # Only turn off if HVACMode.OFF is supported
        if HVACMode.OFF in self._attr_hvac_modes:
            _LOGGER.debug("[%s] Turn off with HVAC mode 'off'", self.entity_id)
            await self.async_set_hvac_mode(HVACMode.OFF)

        # HVACMode.OFF not supported
        else:
            _LOGGER.debug("[%s] Can't turn off: HVAC mode 'off' not available", self.entity_id)

    async def async_toggle(self) -> None:
        """Toggle the entity."""

        if self._attr_hvac_mode == HVACMode.OFF:
            await self.async_turn_on()
        else:
            await self.async_turn_off()
