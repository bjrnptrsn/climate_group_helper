"""Diagnostics support for Climate Group Helper."""
from __future__ import annotations

from dataclasses import fields
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .state import TargetState


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> dict[str, Any]:
    """Return diagnostics for a config entry.

    Includes configuration, runtime state, target state, and member snapshots.
    No sensitive data is present — entity IDs are intentionally included for
    diagnostic purposes.
    """
    diag: dict[str, Any] = {
        "config_entry": {
            "entry_id": entry.entry_id,
            "version": entry.version,
            "title": entry.title,
            "options": dict(entry.options),
        },
    }

    # Try to get the group entity for runtime diagnostics
    entry_data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
    group = entry_data.get("group")

    if not group:
        diag["error"] = "Climate group entity not found in hass.data"
        return diag

    # RunState — serialise frozen dataclass, converting frozensets to sorted lists
    run = group.run_state
    run_dict: dict[str, Any] = {}
    for f in fields(run):
        val = getattr(run, f.name)
        if isinstance(val, frozenset):
            val = sorted(val)
        elif hasattr(val, "isoformat"):
            val = val.isoformat()
        elif isinstance(val, TargetState):
            val = _state_to_dict(val) if val else None
        run_dict[f.name] = val
    # config_overrides is a MappingProxyType — convert to plain dict
    if "config_overrides" in run_dict:
        run_dict["config_overrides"] = dict(run.config_overrides)
    # target_state_snapshot is a TargetState — convert to dict
    if run.target_state_snapshot:
        run_dict["target_state_snapshot"] = _state_to_dict(run.target_state_snapshot)
    diag["run_state"] = run_dict

    # TargetState — only non-None fields
    diag["target_state"] = _state_to_dict(group.shared_target_state)

    # Member snapshots
    members: list[dict[str, Any]] = []
    for entity_id in group.climate_entity_ids:
        state = hass.states.get(entity_id)
        if state is None:
            members.append({"entity_id": entity_id, "state": None})
            continue
        member: dict[str, Any] = {
            "entity_id": entity_id,
            "state": state.state,
            "available": state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN),
            "isolated": entity_id in run.isolated_members,
            "oob": entity_id in run.oob_members,
        }
        # Include relevant climate attributes
        for attr in ("temperature", "target_temp_low", "target_temp_high",
                      "current_temperature", "hvac_modes", "preset_mode",
                      "fan_mode", "swing_mode", "humidity"):
            if (val := state.attributes.get(attr)) is not None:
                member[attr] = val
        members.append(member)
    diag["members"] = members

    # Handler status
    handlers: dict[str, Any] = {}
    handlers["sync_mode"] = str(group.sync_mode_handler.sync_mode)
    handlers["schedule_entity"] = group.schedule_handler.schedule_entity_id
    handlers["bypass_entity"] = group.schedule_bypass_handler.bypass_entity_id
    handlers["window_force_off"] = group.window_control_handler.force_off if hasattr(group, "window_control_handler") else None
    handlers["advanced_mode"] = group.advanced_mode
    diag["handlers"] = handlers

    return diag


def _state_to_dict(state: Any) -> dict[str, Any]:
    """Convert a frozen dataclass to a dict, excluding None values."""
    result: dict[str, Any] = {}
    for f in fields(state):
        val = getattr(state, f.name)
        if val is not None:
            if isinstance(val, frozenset):
                val = sorted(val)
            elif hasattr(val, "isoformat"):
                val = val.isoformat()
            result[f.name] = val
    return result
