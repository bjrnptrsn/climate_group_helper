"""Off Template — gives heaters without an `off` mode one: heat on their own `min_temp`.

Both directions use the same definition. Outgoing, the pipeline stage
`_process_off_template` sends an OFF to such a device as `heat` + `min_temp`
("parking"). Incoming, `OffOverlay` reads a parked device as `off`. Detection is
stateless: whoever put the device on heat + `min_temp` — the group, a slot, a
block temperature, the user — it reads as `off`.

Heaters only: on a cooling device `min_temp` would mean "cool as hard as
possible", so a device offering `cool` or `heat_cool` is never parked.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.components.climate import (
    ATTR_HVAC_MODES,
    ATTR_MIN_TEMP,
    HVACMode,
)
from homeassistant.const import ATTR_TEMPERATURE
from homeassistant.core import State

from .member_template import (
    MemberTemplateManager,
    TemplatedState,
    TemplateOverlay,
    physical_state,
    setpoint_reaches,
)
from .state import is_available

_NOT_PARKABLE_MODES = (HVACMode.OFF, HVACMode.COOL, HVACMode.HEAT_COOL)


@dataclass(frozen=True)
class OffOverlay(TemplateOverlay):
    """Off Template overlay on one parkable member."""

    parked: bool

    def template_mode(self, physical: State) -> str | None:
        return HVACMode.OFF if self.parked else None

    def patch_attributes(self, attrs: dict[str, Any], physical: State) -> None:
        # Bound to the overlay's existence, not to `parked`: the capability must
        # not flicker with the device's setpoint.
        hvac_modes = list(attrs.get(ATTR_HVAC_MODES, []))
        if HVACMode.OFF not in hvac_modes:
            hvac_modes.append(HVACMode.OFF)
        attrs[ATTR_HVAC_MODES] = hvac_modes


class OffTemplateManager(MemberTemplateManager):
    """Manages the Off Template for a climate group.

    Every check reads the physical state; a rendered state passed in is
    unwrapped first.
    """

    def __init__(self, enabled: bool) -> None:
        self._enabled = enabled

    @property
    def enabled(self) -> bool:
        """Return True if the template is switched on."""
        return self._enabled

    def is_parkable(self, state: State | TemplatedState | None) -> bool:
        """Return True if the member is a heater without `off` that can be parked."""
        if not self._enabled or (physical := physical_state(state)) is None or not is_available(physical):
            return False
        attrs = physical.attributes
        if ATTR_TEMPERATURE not in attrs:
            return False
        # Without `min_temp` there is no park setpoint; a guessed default is not one.
        if attrs.get(ATTR_MIN_TEMP) is None:
            return False
        modes = attrs.get(ATTR_HVAC_MODES)
        if not modes or HVACMode.HEAT not in modes:
            return False
        return not any(mode in modes for mode in _NOT_PARKABLE_MODES)

    def is_parked(self, state: State | TemplatedState | None) -> bool:
        """Return True if a parkable member stands on heat + its own `min_temp`.

        Same reach rule as the Range Template: a device rounds its setpoint to
        its own step, so an exact comparison would flicker.
        """
        if not self.is_parkable(state):
            return False
        physical = physical_state(state)
        attrs = physical.attributes
        return physical.state == HVACMode.HEAT and setpoint_reaches(
            attrs, attrs.get(ATTR_TEMPERATURE), attrs[ATTR_MIN_TEMP]
        )

    @staticmethod
    def park_setpoint(state: State | TemplatedState) -> float:
        """The setpoint a parkable member is parked on — its own `min_temp`."""
        return float(physical_state(state).attributes[ATTR_MIN_TEMP])

    def overlay(self, entity_id: str, physical: State) -> OffOverlay | None:  # noqa: ARG002
        if not self.is_parkable(physical):
            return None
        return OffOverlay(parked=self.is_parked(physical))

