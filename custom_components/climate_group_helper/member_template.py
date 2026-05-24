"""Member Templates — virtual capability transformation for climate group members.

A *Member Template* presents a physical member with a different capability
profile than it natively has. Conceptually similar to `hass-template-climate`,
but specialised and automated for specific transformation patterns.

The pattern has two halves:

* **Input gateway** — `ClimateGroupHelper.read_member_state()` /
  `read_member_event()` call the template's apply-function to wrap a real
  `State` into a template-specific proxy. Consumers (`SyncModeHandler`,
  `ChangeState`, service-call filters) see a transparent virtual entity and
  no longer need to know about the underlying physical device.
* **Output pipeline** — a stage in `BaseServiceCallHandler._generate_calls_from_dict`
  translates outgoing commands back into the physical capability profile.

This module is pure data + pure functions. Configuration and the small amount
of runtime state live in template dataclasses; behaviour lives in the two
integration points above.

Currently implemented:

* **Range Template** — renders a single-setpoint device as a native `heat_cool`
  range entity by switching the physical mode (`heat` / `cool` / deadband
  action) based on the device's `current_temperature` relative to the
  commanded `target_temp_low` / `target_temp_high` band.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import Any

from homeassistant.components.climate import (
    ATTR_CURRENT_TEMPERATURE,
    ATTR_HVAC_MODES,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    HVACMode,
    ClimateEntityFeature,
)
from homeassistant.const import (
    ATTR_SUPPORTED_FEATURES,
    ATTR_TEMPERATURE,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import State
from types import MappingProxyType

_LOGGER = logging.getLogger(__name__)


@dataclass
class RangeTemplate:
    """Per-group configuration and runtime state for the Range Template.

    Lives on `ClimateGroupHelper.range_template` (or `None` when no member is
    configured for range templating). `low`/`high` cache the most recently
    commanded range so a follow-up `hvac_mode=heat_cool` without explicit
    setpoints can still resolve a band. `last_physical_mode` is used as a
    fallback in `_expected_mode_for()` when `current_temperature` is
    unavailable.
    """

    entity_ids: frozenset[str]
    deadband_action: str  # "off" | "fan_only"
    low: float | None = None
    high: float | None = None
    last_physical_mode: dict[str, str] = field(default_factory=dict)

    def covers(self, entity_id: str | None) -> bool:
        """Return True if the template applies to `entity_id`."""
        return entity_id is not None and entity_id in self.entity_ids


class RangeTemplateState:
    """`State`-shaped proxy that renders a single-setpoint device as `heat_cool`.

    Not a subclass of HA's `State` (which has `__slots__` and is internally
    mutated by HA); attribute access is delegated to the wrapped real state via
    `__getattr__`. Only `state` and `attributes` are overridden:

    * `state` returns `heat_cool` while the physical mode matches the *expected*
      mode for the current band, and falls through to the real physical mode
      otherwise. That mismatch is how `SyncModeHandler` natively detects
      deviations (LOCK reverts, MIRROR adopts) without needing template-aware
      code paths.
    * `attributes` advertises `TARGET_TEMPERATURE_RANGE` (and drops
      `TARGET_TEMPERATURE`), injects `heat_cool` into `hvac_modes`, exposes
      `target_temp_low`/`target_temp_high` from the template, and suppresses
      `temperature`. All other attributes pass through unchanged — including
      `current_temperature`, `hvac_action`, `min_temp`, `max_temp`.
    """

    def __init__(
        self,
        real_state: State,
        low: float | None,
        high: float | None,
        expected_mode: str,
        expected_temp: float | None,
    ) -> None:
        self._real = real_state
        self._low = low
        self._high = high
        self._expected_mode = expected_mode
        self._expected_temp = expected_temp

    def __getattr__(self, name: str) -> Any:
        return getattr(self._real, name)

    @property
    def state(self) -> str:
        if self._real.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return self._real.state
        # Mismatch surfaces the real physical mode so SyncModeHandler can
        # detect the deviation and correct it via the output pipeline.
        return HVACMode.HEAT_COOL if self._real.state == self._expected_mode else self._real.state

    @property
    def attributes(self) -> MappingProxyType[str, Any]:
        attrs = dict(self._real.attributes)

        features = attrs.get(ATTR_SUPPORTED_FEATURES, 0)
        features |= ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
        features &= ~ClimateEntityFeature.TARGET_TEMPERATURE
        attrs[ATTR_SUPPORTED_FEATURES] = features

        hvac_modes = list(attrs.get(ATTR_HVAC_MODES, []))
        if HVACMode.HEAT_COOL not in hvac_modes:
            hvac_modes.append(HVACMode.HEAT_COOL)
        attrs[ATTR_HVAC_MODES] = hvac_modes

        attrs[ATTR_TARGET_TEMP_LOW] = self._low
        attrs[ATTR_TARGET_TEMP_HIGH] = self._high
        if ATTR_TEMPERATURE in attrs:
            del attrs[ATTR_TEMPERATURE]

        return MappingProxyType(attrs)


def _read_current_temp(state: State) -> float | None:
    """Read `current_temperature` from a raw state, tolerating missing or non-numeric values."""
    temp = state.attributes.get(ATTR_CURRENT_TEMPERATURE)
    if temp is not None:
        try:
            return float(temp)
        except (ValueError, TypeError):
            pass
    return None


def _resolve_range(group) -> tuple[float | None, float | None]:
    """Resolve the active range band.

    Prefers `shared_target_state` (the authoritative source, restored by
    `RestoreEntity`) and falls back to the template's cached `low`/`high` from
    the most recent command. Either side may be `None` before the group has
    ever received a range command.
    """
    low = group.shared_target_state.target_temp_low
    high = group.shared_target_state.target_temp_high

    template = group.range_template
    if template is not None:
        if low is None and template.low is not None:
            low = template.low
        if high is None and template.high is not None:
            high = template.high

    return low, high


def _expected_mode_for(
    template: RangeTemplate,
    entity_id: str,
    low: float,
    high: float,
    current_temp: float | None,
) -> tuple[str, float | None]:
    """Compute the expected physical (mode, setpoint) for one member.

    Below the band -> heat at low, above -> cool at high, inside -> the
    configured deadband action with no setpoint. When `current_temperature` is
    unknown, fall back to the last observed physical mode so a member that is
    actively heating or cooling stays in that mode until a real reading
    arrives.
    """
    if current_temp is None:
        mode = template.last_physical_mode.get(entity_id, template.deadband_action)
        return mode, None

    if current_temp < low:
        return HVACMode.HEAT, low
    elif current_temp > high:
        return HVACMode.COOL, high
    else:
        return template.deadband_action, None


def _apply_range_template(group, entity_id: str, state: State) -> State | RangeTemplateState:
    """Wrap a member `State` into a `RangeTemplateState`, or pass through unchanged.

    Pass-through (no wrapping) when the template is inactive, the entity is
    not covered, or the group is not in `heat_cool` mode — in those cases the
    real state already matches what consumers expect. When the band cannot be
    resolved yet (group has never received a range command), the wrapper is
    built with `low=high=None` and the expected mode/temp are taken from the
    raw state; consumers then see the device exactly as it physically is.
    """
    template = group.range_template
    if template is None or not template.covers(entity_id):
        return state

    if group.shared_target_state.hvac_mode != HVACMode.HEAT_COOL:
        return state

    low, high = _resolve_range(group)
    if low is None or high is None:
        expected_mode = state.state
        expected_temp = state.attributes.get(ATTR_TEMPERATURE)
        return RangeTemplateState(state, None, None, expected_mode, expected_temp)

    current_temp = _read_current_temp(state)
    expected_mode, expected_temp = _expected_mode_for(template, entity_id, low, high, current_temp)
    return RangeTemplateState(state, low, high, expected_mode, expected_temp)


def initialize_last_modes(group) -> None:
    """Seed `last_physical_mode` from current HA states.

    Must run *after* `async_get_last_state()` has restored
    `shared_target_state.target_temp_low/high`, so that the deviation fallback
    in `_expected_mode_for()` is not blind at first start. Unavailable or
    unknown members are skipped — they will be picked up on the next real
    state event.
    """
    template = group.range_template
    if template is None:
        return
    for entity_id in template.entity_ids:
        real_state = group.hass.states.get(entity_id)
        if real_state and real_state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            template.last_physical_mode[entity_id] = real_state.state
