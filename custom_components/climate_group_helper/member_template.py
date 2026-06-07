"""Member Templates — virtual capability transformation for climate group members.

A *Member Template* presents a physical member with a different capability
profile than it natively has. Conceptually similar to `hass-template-climate`,
but specialised and automated for specific transformation patterns.

The pattern has two halves:

* **Input gateway** — `ClimateGroupHelper.read_member_state()` /
  `read_member_event()` call `MemberTemplateManager.apply_state()` to wrap a
  real `State` into a template-specific proxy. Consumers (`SyncModeHandler`,
  `ChangeState`, service-call filters) see a transparent virtual entity and
  no longer need to know about the underlying physical device.
* **Output pipeline** — a stage in `BaseServiceCallHandler._generate_calls_from_dict`
  translates outgoing commands back into the physical capability profile, using
  `MemberTemplateManager.resolve_range()` and `MemberTemplateManager.expected_mode_for()`.

Currently implemented:

* **Range Template** — renders a single-setpoint device as a native `heat_cool`
  range entity by switching the physical mode (`heat` / `cool` / deadband
  action) based on the device's `current_temperature` relative to the
  commanded `target_temp_low` / `target_temp_high` band.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import Any, TYPE_CHECKING

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

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


@dataclass
class RangeTemplate:
    """Per-group configuration and runtime state for the Range Template.

    `low`/`high` cache the most recently commanded range so a follow-up
    `hvac_mode=heat_cool` without explicit setpoints can still resolve a band.
    `last_physical_mode` is used as a fallback when `current_temperature` is
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
    `__getattr__`. Only `state` and `attributes` are overridden.
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


class MemberTemplateManager:
    """Manages all Member Template instances for a climate group.

    Owned by `ClimateGroupHelper`. Central entry point for both the input
    gateway (apply_state) and output pipeline (resolve_range / expected_mode_for).
    """

    def __init__(self, group: ClimateGroupHelper, deadband_action: str | None) -> None:
        self._group = group
        self._range_template: RangeTemplate | None = (
            RangeTemplate(entity_ids=frozenset(), deadband_action=deadband_action)
            if deadband_action is not None
            else None
        )

    @property
    def range_template(self) -> RangeTemplate | None:
        """Return the active RangeTemplate, or None when disabled."""
        return self._range_template

    # ------------------------------------------------------------------
    # Input gateway
    # ------------------------------------------------------------------

    def apply_state(self, entity_id: str, state: State) -> State | RangeTemplateState:
        """Wrap a member State into a RangeTemplateState, or pass through unchanged."""
        template = self._range_template
        if template is None or not template.covers(entity_id):
            return state

        if self._group.shared_target_state.hvac_mode != HVACMode.HEAT_COOL:
            return state

        low, high = self.resolve_range()
        if low is None or high is None:
            expected_mode = state.state
            expected_temp = state.attributes.get(ATTR_TEMPERATURE)
            return RangeTemplateState(state, None, None, expected_mode, expected_temp)

        current_temp = self._read_current_temp(state)
        supported_modes = state.attributes.get(ATTR_HVAC_MODES)
        expected_mode, expected_temp = self.expected_mode_for(entity_id, low, high, current_temp, supported_modes)
        return RangeTemplateState(state, low, high, expected_mode, expected_temp)

    # ------------------------------------------------------------------
    # Output pipeline helpers
    # ------------------------------------------------------------------

    def resolve_range(self) -> tuple[float | None, float | None]:
        """Resolve the active range band from shared_target_state + cached template values."""
        low = self._group.shared_target_state.target_temp_low
        high = self._group.shared_target_state.target_temp_high

        template = self._range_template
        if template is not None:
            if low is None and template.low is not None:
                low = template.low
            if high is None and template.high is not None:
                high = template.high

        return low, high

    def expected_mode_for(
        self,
        entity_id: str,
        low: float,
        high: float,
        current_temp: float | None,
        supported_modes: list[str] | None = None,
    ) -> tuple[str, float | None]:
        """Compute the expected physical (mode, setpoint) for one member."""
        template = self._range_template
        assert template is not None

        if current_temp is None:
            mode = template.last_physical_mode.get(entity_id, template.deadband_action)
            return mode, None

        if current_temp < low:
            if supported_modes is None or HVACMode.HEAT in supported_modes:
                return HVACMode.HEAT, low
            return template.deadband_action, None
        elif current_temp > high:
            if supported_modes is None or HVACMode.COOL in supported_modes:
                return HVACMode.COOL, high
            return template.deadband_action, None
        else:
            return template.deadband_action, None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def update_members(self) -> list:
        """Recompute Range Template entity_ids. Returns the new list (empty when disabled)."""
        template = self._range_template
        if template is None:
            return []

        template.entity_ids = frozenset(
            eid for eid in self._group.climate_entity_ids
            if HVACMode.HEAT_COOL not in (
                (s := self._group.hass.states.get(eid)) and s.attributes.get(ATTR_HVAC_MODES, []) or []
            )
        )
        return list(template.entity_ids)

    def initialize_last_modes(self) -> None:
        """Seed last_physical_mode from current HA states after RestoreEntity has run."""
        template = self._range_template
        if template is None:
            return
        for entity_id in template.entity_ids:
            real_state = self._group.hass.states.get(entity_id)
            if real_state and real_state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
                template.last_physical_mode[entity_id] = real_state.state

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _read_current_temp(state: State) -> float | None:
        """Read current_temperature from a raw state, tolerating missing or non-numeric values."""
        temp = state.attributes.get(ATTR_CURRENT_TEMPERATURE)
        if temp is not None:
            try:
                return float(temp)
            except (ValueError, TypeError):
                pass
        return None
