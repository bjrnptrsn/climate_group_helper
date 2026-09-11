"""Shared payload parsing and validation utilities for Climate Group Helper."""

from __future__ import annotations

import logging
from typing import Any
import yaml  # type: ignore[import-untyped]

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_PRESET_MODE,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_MODE,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
)
from homeassistant.const import ATTR_TEMPERATURE
from homeassistant.exceptions import ServiceValidationError

from .const import ATTR_SERVICE_MAP

_LOGGER = logging.getLogger(__name__)

CLIMATE_MODE_ATTRS: frozenset[str] = frozenset(
    {
        ATTR_HVAC_MODE,
        ATTR_FAN_MODE,
        ATTR_PRESET_MODE,
        ATTR_SWING_MODE,
        ATTR_SWING_HORIZONTAL_MODE,
    }
)
CLIMATE_NUMERIC_ATTRS: frozenset[str] = frozenset(
    {
        ATTR_TEMPERATURE,
        ATTR_TARGET_TEMP_LOW,
        ATTR_TARGET_TEMP_HIGH,
        ATTR_HUMIDITY,
    }
)


def normalize_yaml_bool_modes(payload: dict[str, Any]) -> dict[str, Any]:
    """Fix the YAML pitfall where unquoted 'on'/'off' is parsed as True/False.

    Only applied to mode attributes (hvac_mode, fan_mode, …) — numeric/other
    attributes must keep their native type.
    """
    return {
        attr: ("on" if value else "off") if attr in CLIMATE_MODE_ATTRS and isinstance(value, bool) else value
        for attr, value in payload.items()
    }


def parse_fallback_payload(
    raw: Any,
    entity_id: str = "",
    raise_on_error: bool = False,
    *,
    context: str,
) -> dict[str, Any]:
    """Parse a payload (dict or YAML string) into a validated mapping.

    Args:
        raw: A dict or YAML string to parse.
        entity_id: Logged as the source of the payload.
        raise_on_error: Raise `ServiceValidationError` instead of warning —
            used by the service path, where the caller sees the message.
        context: Names the payload's origin in the message (e.g. "Group
            presets", "Fallback schedule payload"). Required and keyword-only
            on purpose: this module is shared, and a default would silently
            attribute one feature's parse errors to another.
    """
    if not raw:
        return {}
    if isinstance(raw, dict):
        return normalize_yaml_bool_modes(raw)
    if isinstance(raw, str):
        cleaned = raw.strip()
        if not cleaned:
            return {}
        try:
            parsed = yaml.safe_load(cleaned)
            if isinstance(parsed, dict):
                return normalize_yaml_bool_modes(parsed)
            if parsed is None:
                return {}
            msg = f"{context} must be a mapping (got {type(parsed).__name__})."
            if raise_on_error:
                raise ServiceValidationError(msg)
            _LOGGER.warning("[%s] %s — ignored.", entity_id, msg)
            return {}
        except yaml.YAMLError as err:
            if raise_on_error:
                raise ServiceValidationError(f"{context} has invalid YAML: {err}") from err
            _LOGGER.warning("[%s] %s has invalid YAML: %s — ignored.", entity_id, context, err)
            return {}
    msg = f"{context} must be a dictionary or YAML string (got {type(raw).__name__})."
    if raise_on_error:
        raise ServiceValidationError(msg)
    _LOGGER.warning("[%s] %s — ignored.", entity_id, msg)
    return {}


def parse_entity_state(state: Any) -> dict[str, Any]:
    """Extract a slot data dict from a schedule or calendar entity.

    schedule.*: attributes are used directly.
    calendar.*: the 'description' attribute is YAML-parsed. Invalid or
                non-mapping YAML is discarded with a warning.
    """
    if not state:
        return {}
    if state.entity_id.split(".")[0] == "calendar":
        raw = state.attributes.get("description")
        if not raw:
            return {}
        try:
            data = yaml.safe_load(raw)
        except yaml.YAMLError:
            _LOGGER.warning(
                "[%s] Calendar description is not valid YAML — ignored. Content: %r",
                state.entity_id, raw,
            )
            return {}
        if not isinstance(data, dict):
            _LOGGER.warning(
                "[%s] Calendar description parsed as %s, expected a mapping — ignored.",
                state.entity_id, type(data).__name__,
            )
            return {}
        if title := state.attributes.get("message"):
            data["message"] = title
        return data
    return dict(state.attributes)


def validate_climate_payload(
    entity_id: str, payload: dict[str, Any], *, context: str
) -> dict[str, Any]:
    """Filter a climate payload, dropping invalid values with a warning.

    Mode attributes (hvac_mode, fan_mode, …) must be non-empty strings.
    Numeric attributes (temperature, humidity, …) must be float-convertible.

    Args:
        entity_id: Logged as the source of the payload.
        payload: The attributes to validate.
        context: Names the payload's origin in the warning (e.g. "Schedule
            slot", "Group preset 'party'"). Required and keyword-only on
            purpose: this module is shared, and a default would silently
            attribute one feature's validation errors to another.
    """
    valid = {}
    payload = normalize_yaml_bool_modes(payload)
    for attr, value in payload.items():
        if attr in CLIMATE_MODE_ATTRS:
            if not isinstance(value, str) or not value:
                _LOGGER.warning(
                    "[%s] %s: '%s' expects a non-empty string, got %r — ignored.",
                    entity_id, context, attr, value,
                )
                continue
        elif attr in CLIMATE_NUMERIC_ATTRS:
            try:
                value = float(value)
            except (TypeError, ValueError):
                _LOGGER.warning(
                    "[%s] %s: '%s' expects a numeric value, got %r — ignored.",
                    entity_id, context, attr, value,
                )
                continue
        valid[attr] = value
    return valid


def split_payload(data: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Split a payload into climate attributes and meta-keys."""
    climate_data = {}
    meta_data = {}
    for key, value in data.items():
        if key in ATTR_SERVICE_MAP:
            climate_data[key] = value
        else:
            meta_data[key] = value
    return climate_data, meta_data
