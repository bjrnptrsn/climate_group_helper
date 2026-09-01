"""Entity services the group exposes — registration and the logic behind them.

The counterpart to `service_call.py`: that module sends commands *out* to the
member devices, this one handles what comes *in* from the user.

The `async_service_*` methods themselves stay on `ClimateGroupHelper` — HA
resolves them by attribute name from the strings passed at registration — and
delegate here.
"""

from __future__ import annotations

import json
import logging
from enum import StrEnum
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.const import CONF_ENTITIES
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import (
    ATTR_FALLBACK_PAYLOAD,
    ATTR_INCLUDE_ENTITY_SELECTORS,
    ATTR_INCLUDE_MEMBER_LIST,
    ATTR_PAYLOAD,
    ATTR_RESET_ALL,
    ATTR_RESET_BOOST,
    ATTR_RESET_BYPASS,
    ATTR_RESET_FALLBACK,
    ATTR_RESET_OFFSET,
    ATTR_RESET_PRESETS,
    ATTR_RESET_SCHEDULE,
    ATTR_SCHEDULE_BYPASS_ENTITY,
    ATTR_SCHEDULE_ENTITY,
    ATTR_SETTINGS,
    CONF_DEBOUNCE_DELAY,
    CONF_GRACE_PERIOD,
    CONF_HUMIDITY_CURRENT_AVG,
    CONF_HUMIDITY_SENSORS,
    CONF_HUMIDITY_TARGET_AVG,
    CONF_HUMIDITY_UPDATE_TARGETS,
    CONF_ISOLATION_ACTION_TYPE,
    CONF_ISOLATION_ENTITIES,
    CONF_ISOLATION_RULES,
    CONF_ISOLATION_SENSOR,
    CONF_ISOLATION_TRIGGER,
    CONF_MASTER_ENTITY,
    CONF_MEMBER_TEMP_OFFSETS,
    CONF_PRESENCE_ACTION,
    CONF_PRESENCE_MODE,
    CONF_PRESENCE_SENSOR,
    CONF_PRESENCE_ZONE,
    CONF_RANGE_TEMPLATE_COOL_ENTITIES,
    CONF_RANGE_TEMPLATE_HEAT_ENTITIES,
    CONF_RETRY_ATTEMPTS,
    CONF_RETRY_DELAY,
    CONF_STAGGERED_CALL_DELAY,
    CONF_SYNC_MODE,
    CONF_TEMP_CALIBRATION_MODE,
    CONF_TEMP_CURRENT_AVG,
    CONF_TEMP_SENSORS,
    CONF_TEMP_TARGET_AVG,
    CONF_TEMP_UPDATE_TARGETS,
    CONF_WINDOW_ACTION,
    CONF_WINDOW_ADOPT_MANUAL_CHANGES,
    CONF_WINDOW_MODE,
    ENTITY_SELECTOR_KEYS,
    IDENTITY_KEYS,
    MEMBER_LIST_KEYS,
    SERVICE_APPLY_CONFIG,
    SERVICE_BOOST,
    SERVICE_RESET,
    SERVICE_SET_GROUP_PRESET,
    SERVICE_SET_SCHEDULE_BYPASS_ENTITY,
    SERVICE_SET_SCHEDULE_ENTITY,
    SERVICE_SET_SCHEDULE_FALLBACK_PAYLOAD,
    AdoptManualChanges,
    AverageOption,
    CalibrationMode,
    IsolationActionType,
    IsolationTrigger,
    PresenceAction,
    PresenceMode,
    SyncMode,
    WindowControlAction,
    WindowControlMode,
)

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


def async_register_services(group: ClimateGroupHelper) -> None:
    """Register the entity services this group exposes."""
    if not group.platform:
        return

    if group.advanced_mode:
        group.platform.async_register_entity_service(
            SERVICE_SET_SCHEDULE_ENTITY,
            {vol.Optional(ATTR_SCHEDULE_ENTITY): vol.Any(cv.entity_id, None)},
            "async_service_set_schedule_entity",
        )
        group.platform.async_register_entity_service(
            SERVICE_SET_SCHEDULE_BYPASS_ENTITY,
            {vol.Optional(ATTR_SCHEDULE_BYPASS_ENTITY): vol.Any(cv.entity_id, None)},
            "async_service_set_schedule_bypass_entity",
        )
        group.platform.async_register_entity_service(
            SERVICE_SET_SCHEDULE_FALLBACK_PAYLOAD,
            {vol.Optional(ATTR_FALLBACK_PAYLOAD): vol.Any(cv.string, dict, None)},
            "async_service_set_schedule_fallback_payload",
        )
        group.platform.async_register_entity_service(
            SERVICE_SET_GROUP_PRESET,
            {
                vol.Optional(ATTR_PAYLOAD): vol.Any(cv.string, dict, None),
            },
            "async_service_set_group_preset",
        )
        group.platform.async_register_entity_service(
            SERVICE_BOOST,
            {
                vol.Optional("temperature"): vol.Coerce(float),
                vol.Optional("temperature_offset"): vol.Coerce(float),
                vol.Required("duration"): vol.All(vol.Coerce(int), vol.Range(min=1)),
            },
            "async_service_boost",
        )
        group.platform.async_register_entity_service(
            SERVICE_RESET,
            {
                vol.Optional(ATTR_RESET_ALL, default=False): cv.boolean,
                vol.Optional(ATTR_RESET_BOOST, default=False): cv.boolean,
                vol.Optional(ATTR_RESET_OFFSET, default=False): cv.boolean,
                vol.Optional(ATTR_RESET_SCHEDULE, default=False): cv.boolean,
                vol.Optional(ATTR_RESET_BYPASS, default=False): cv.boolean,
                vol.Optional(ATTR_RESET_FALLBACK, default=False): cv.boolean,
                vol.Optional(ATTR_RESET_PRESETS, default=False): cv.boolean,
            },
            "async_service_reset",
        )

    # Config management service (available in all modes)
    group.platform.async_register_entity_service(
        SERVICE_APPLY_CONFIG,
        {
            vol.Required(ATTR_SETTINGS): cv.string,
            vol.Optional(ATTR_INCLUDE_MEMBER_LIST, default=False): cv.boolean,
            vol.Optional(ATTR_INCLUDE_ENTITY_SELECTORS, default=False): cv.boolean,
        },
        "async_service_apply_config",
    )


async def async_boost(
    group: ClimateGroupHelper,
    duration: int,
    temperature: float | None = None,
    temperature_offset: float | None = None,
) -> None:
    """Start a boost override from an absolute temperature or a relative offset."""
    if duration <= 0:
        raise ServiceValidationError("Boost duration must be a positive number of minutes.")
    if (temperature is None) == (temperature_offset is None):
        raise ServiceValidationError("Exactly one of 'temperature' or 'temperature_offset' must be provided.")
    if temperature is None:
        current = group.shared_target_state.temperature
        if current is None:
            raise ServiceValidationError("Cannot use 'temperature_offset': group has no current target temperature.")
        temperature = current + temperature_offset  # type: ignore[operator]
    started = await group.boost_override_manager.activate(temperature=temperature, duration=duration * 60)
    if not started:
        raise ServiceValidationError(
            f"Boost rejected: a blocking source is active ({', '.join(sorted(group.run_state.blocking_sources))})."
        )


async def async_apply_config(
    group: ClimateGroupHelper,
    settings: str,
    include_member_list: bool = False,
    include_entity_selectors: bool = False,
) -> None:
    """Overwrite group settings from a JSON configuration template."""
    # Imported here: `climate.py` imports this module, and VALID_CONFIG_KEYS
    # lives in the package __init__ that imports climate.py in turn.
    from . import VALID_CONFIG_KEYS

    if group.entry is None:
        _LOGGER.warning("[%s] apply_config: entry is None, skipping", group.entity_id)
        return
    try:
        new_settings = json.loads(settings)
    except json.JSONDecodeError as err:
        raise ServiceValidationError(f"Invalid JSON settings: {err}") from err

    if not isinstance(new_settings, dict):
        raise ServiceValidationError("Settings must be a JSON object.")

    # Whitelist filter: only valid keys pass
    filtered = {
        key: value
        for key, value in new_settings.items()
        if key in VALID_CONFIG_KEYS
    }

    # Validation below is scoped on purpose, and the scope is the point: this is
    # a service parameter — JSON typed by a user or produced by a template — not
    # the stored config, which only the integration writes and which is
    # deliberately never checked. A bad value here is an ordinary typo, so keys
    # are guarded where one would abort the entity setup on the next reload or
    # leave the options flow unable to save. Keys whose bad value merely goes
    # inert are left alone; this is not a second copy of the options-flow schema.
    #
    # Type guard: these keys are coerced to int/float during entry setup or in
    # retry/debounce arithmetic. A bad value (e.g. a string) would only surface
    # as a crash later — on reload or when the value is next used — instead of
    # being rejected here where the user can see it.
    numeric_keys: dict[str, Any] = {
        CONF_RETRY_ATTEMPTS: int,
        CONF_RETRY_DELAY: float,
        CONF_GRACE_PERIOD: float,
        CONF_DEBOUNCE_DELAY: float,
        CONF_STAGGERED_CALL_DELAY: float,
    }
    for key, caster in numeric_keys.items():
        if key not in filtered:
            continue
        try:
            filtered[key] = caster(filtered[key])
        except (TypeError, ValueError):
            raise ServiceValidationError(
                f"Invalid value for '{key}': {filtered[key]!r} is not a valid number."
            ) from None

    # Same reasoning for the enum-backed keys, in two groups. These abort the
    # entity setup on the next reload — far from the call that caused it — and
    # they do it in two different shapes: a constructor with no fallback
    # (SyncMode, CalibrationMode) and a dict lookup that raises KeyError
    # (CALC_TYPES[...] for the four averaging keys). Membership here is decided
    # per key, not by looking for a constructor — the lookup form has none:
    enum_keys: dict[str, type[StrEnum]] = {
        CONF_SYNC_MODE: SyncMode,
        CONF_TEMP_CALIBRATION_MODE: CalibrationMode,
        CONF_TEMP_CURRENT_AVG: AverageOption,
        CONF_TEMP_TARGET_AVG: AverageOption,
        CONF_HUMIDITY_CURRENT_AVG: AverageOption,
        CONF_HUMIDITY_TARGET_AVG: AverageOption,
    }
    # These reach no constructor, but the options flow renders their value as a
    # dropdown default. A value outside the rendered options makes HA refuse the
    # whole form on save, so the setting can no longer be corrected in the UI:
    enum_keys.update(
        {
            CONF_WINDOW_MODE: WindowControlMode,
            CONF_WINDOW_ACTION: WindowControlAction,
            CONF_WINDOW_ADOPT_MANUAL_CHANGES: AdoptManualChanges,
            CONF_PRESENCE_MODE: PresenceMode,
            CONF_PRESENCE_ACTION: PresenceAction,
        }
    )
    for key, enum_cls in enum_keys.items():
        if key not in filtered:
            continue
        try:
            filtered[key] = enum_cls(filtered[key]).value
        except ValueError:
            raise ServiceValidationError(
                f"Invalid value for '{key}': {filtered[key]!r} is not one of "
                f"{', '.join(sorted(member.value for member in enum_cls))}."
            ) from None

    # Protection: always remove identity keys
    for key in IDENTITY_KEYS:
        filtered.pop(key, None)

    # Optional: remove non-portable keys if not requested
    if not include_member_list:
        for key in MEMBER_LIST_KEYS:
            filtered.pop(key, None)

    if not include_entity_selectors:
        for key in ENTITY_SELECTOR_KEYS:
            filtered.pop(key, None)

    # Structured keys: read as a mapping / sequence downstream. A wrong container
    # type survives the whitelist and reaches the options — the offsets one then
    # crashes the options flow on open, so the user cannot undo it through the UI.
    # Checked after the strips above, so a key the caller's portability flags
    # discard anyway is not worth an error, and before the rule walk below, which
    # would otherwise iterate a string character by character.
    #
    # The list-shaped keys join them because entity setup reads each of them
    # without a usable fallback, so a stored null aborts the next reload far from
    # the call that caused it: CONF_ENTITIES is subscripted outright, the two
    # range-template lists go through `set(...)`, and the remaining four are
    # iterated as `for eid in config.get(key, [])` — which hands back the stored
    # None rather than the fallback.
    for key, expected in (
        (CONF_MEMBER_TEMP_OFFSETS, dict),
        (CONF_ISOLATION_RULES, list),
        (CONF_ENTITIES, list),
        (CONF_RANGE_TEMPLATE_HEAT_ENTITIES, list),
        (CONF_RANGE_TEMPLATE_COOL_ENTITIES, list),
        (CONF_TEMP_SENSORS, list),
        (CONF_HUMIDITY_SENSORS, list),
        (CONF_PRESENCE_SENSOR, list),
        (CONF_PRESENCE_ZONE, list),
        (CONF_TEMP_UPDATE_TARGETS, list),
        (CONF_HUMIDITY_UPDATE_TARGETS, list),
    ):
        if key in filtered and not isinstance(filtered[key], expected):
            raise ServiceValidationError(
                f"Invalid value for '{key}': expected a JSON "
                f"{'object' if expected is dict else 'array'}, got {filtered[key]!r}."
            )

    # Isolation rules nest their own enum-backed fields, out of reach of the
    # top-level guard above.
    for rule in filtered.get(CONF_ISOLATION_RULES) or []:
        if not isinstance(rule, dict):
            raise ServiceValidationError(
                f"Invalid isolation rule: expected a JSON object, got {rule!r}."
            )
        for key, enum_cls in (
            (CONF_ISOLATION_TRIGGER, IsolationTrigger),
            (CONF_ISOLATION_ACTION_TYPE, IsolationActionType),
        ):
            if key not in rule:
                continue
            try:
                rule[key] = enum_cls(rule[key]).value
            except ValueError:
                raise ServiceValidationError(
                    f"Invalid value for '{key}': {rule[key]!r} is not one of "
                    f"{', '.join(sorted(member.value for member in enum_cls))}."
                ) from None

    # Isolation rules nest their entity IDs inside a single whitelist key,
    # where neither filter above reaches them.
    if isinstance(rules := filtered.get(CONF_ISOLATION_RULES), list):
        drop = set()
        if not include_member_list:
            drop.add(CONF_ISOLATION_ENTITIES)
        if not include_entity_selectors:
            drop.add(CONF_ISOLATION_SENSOR)
        if drop:
            filtered[CONF_ISOLATION_RULES] = [
                {k: v for k, v in rule.items() if k not in drop}
                for rule in rules
                # MEMBER_OFF reads an empty watchlist as "watch every member",
                # so stripping a targeted rule would widen it instead of
                # neutralising it. Drop it; other triggers just go inert.
                if not (
                    CONF_ISOLATION_ENTITIES in drop
                    and rule.get(CONF_ISOLATION_TRIGGER) == IsolationTrigger.MEMBER_OFF
                    and rule.get(CONF_ISOLATION_ENTITIES)
                )
            ]

    if not filtered:
        _LOGGER.info("[%s] No valid settings to apply after filtering", group.entity_id)
        return

    # Merge with existing options
    merged_options = {**group.entry.options, **filtered}

    # Master-dependent downgrade, mirroring the options flow's own cleanup: both
    # settings below are rendered as a dropdown whose master-only choice is
    # dropped when there is no master. Left standing, the form's default sits
    # outside its options and HA refuses to save it — the group can then only be
    # repaired through another service call. Decided on the merged result, since
    # the master may equally have been cleared here or be absent already.
    if not merged_options.get(CONF_MASTER_ENTITY):
        merged_options.pop(CONF_MASTER_ENTITY, None)
        if merged_options.get(CONF_SYNC_MODE) == SyncMode.MASTER_LOCK:
            merged_options[CONF_SYNC_MODE] = SyncMode.LOCK.value
        if (
            merged_options.get(CONF_WINDOW_ADOPT_MANUAL_CHANGES)
            == AdoptManualChanges.MASTER_ONLY
        ):
            merged_options[CONF_WINDOW_ADOPT_MANUAL_CHANGES] = AdoptManualChanges.OFF.value

    _LOGGER.info("[%s] Applying new configuration via service call (reloading...)", group.entity_id)
    group.hass.config_entries.async_update_entry(group.entry, options=merged_options)
