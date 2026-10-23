"""Member Templates — virtual capability transformation for climate group members.

A *Member Template* presents a physical member with a different capability
profile than it natively has. Conceptually similar to `hass-template-climate`,
but specialised and automated for specific transformation patterns.

The pattern has two halves:

* **Input gateway** — `Aggregator.read_member_state()` /
  `read_member_event()` ask every manager in `group.member_templates` for its
  overlay on the physical state and wrap state and overlays into one
  `TemplatedState`. Consumers (`SyncModeHandler`, `ChangeState`,
  service-call filters) see a transparent virtual entity and no longer need to
  know about the underlying physical device.
* **Output pipeline** — each template translates outgoing commands back into
  the physical capability profile with its own stage in
  `BaseServiceCallHandler._run_pipeline()`.

Every overlay is computed from the **physical** state alone; no template reads the
result of another. `TemplatedState` decides in one place what a member
reads, with the order of `group.member_templates` as precedence.

Templates: `range_template.py` (Range Template), `off_template.py` (Off Template).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Mapping
from types import MappingProxyType
from typing import Any

from homeassistant.components.climate import (
    ATTR_MAX_TEMP,
    ATTR_MIN_TEMP,
    ATTR_TARGET_TEMP_STEP,
    HVACMode,
)
from homeassistant.core import State

from .const import FLOAT_TOLERANCE
from .state import is_available


def setpoint_reaches(attrs: Mapping[str, Any], actual: Any, target: Any) -> bool:
    """Return True if a device's `actual` setpoint is the closest to `target` it can take.

    A device rounds a setpoint to its own `target_temp_step` and clamps it to
    its limits, so it may never report the exact value. Without a reported
    step only the clamp applies: an assumed step would swallow a genuine
    half-degree move.
    """
    try:
        actual = float(actual)
        reachable = float(target)
        if attrs.get(ATTR_MIN_TEMP) is not None:
            reachable = max(reachable, float(attrs[ATTR_MIN_TEMP]))
        if attrs.get(ATTR_MAX_TEMP) is not None:
            reachable = min(reachable, float(attrs[ATTR_MAX_TEMP]))
        step = float(attrs.get(ATTR_TARGET_TEMP_STEP) or 0.0)
    except (TypeError, ValueError):
        return False
    if step:
        return abs(actual - reachable) <= step / 2
    return abs(actual - reachable) < FLOAT_TOLERANCE


def physical_state(state: State | TemplatedState | None) -> State | None:
    """Return the unrendered state behind `state` (the state itself if not rendered)."""
    return state.physical if isinstance(state, TemplatedState) else state


def is_off_template_or_physical(state: State | TemplatedState | None) -> bool:
    """Return True if a member is off as rendered or physically.

    The two differ in both directions: a parked heater is physically on and
    reads off; a Range member the deadband action switched off is physically
    off and reads `heat_cool`. A "do not wake it" check needs both.
    """
    return state is not None and HVACMode.OFF in (state.state, physical_state(state).state)


class TemplateOverlay:
    """One template's immutable overlay on one member's physical state, computed from it.

    Both hooks read only the physical state passed in — never another overlay's
    result.
    """

    def template_mode(self, physical: State) -> str | None:  # noqa: ARG002
        """Return the hvac mode this overlay claims for the member, or None for no opinion."""
        return None

    def patch_attributes(self, attrs: dict[str, Any], physical: State) -> None:  # noqa: ARG002
        """Modify the accumulated attribute dict in place.

        Never rebuild it from the physical state: that would discard what the
        overlays of lower precedence already wrote.
        """
        return None


class MemberTemplateManager(ABC):
    """Base of the per-group template managers listed in `group.member_templates`."""

    @abstractmethod
    def overlay(self, entity_id: str, physical: State) -> TemplateOverlay | None:
        """Return this template's overlay for the member, or None when it does not apply."""

    def update_members(self) -> None:
        """Recompute which members the template covers. No-op by default."""
        return None

    def async_cancel_timers(self) -> None:
        """Cancel any running timer. No-op by default."""
        return None


class TemplatedState:
    """`State`-shaped proxy combining a member's physical state with its template overlays.

    Not a subclass of HA's `State` (which has `__slots__` and is internally
    mutated by HA); attribute access is delegated to the physical state via
    `__getattr__`. Only `state` and `attributes` are overridden. `overlays` is in
    precedence order: `state` asks forward (the first claim wins), `attributes`
    patches backward (the highest precedence writes last).
    """

    def __init__(self, physical: State, overlays: tuple[TemplateOverlay, ...]) -> None:
        self._physical = physical
        self._overlays = overlays

    def __getattr__(self, name: str) -> Any:
        return getattr(self._physical, name)

    @property
    def physical(self) -> State:
        """The unrendered member state."""
        return self._physical

    def overlay_of(self, overlay_type: type[TemplateOverlay]) -> TemplateOverlay | None:
        """Return the overlay of the given type, or None if that template does not apply."""
        return next((overlay for overlay in self._overlays if isinstance(overlay, overlay_type)), None)

    @property
    def state(self) -> str:
        if not is_available(self._physical):
            return self._physical.state
        for overlay in self._overlays:
            if (mode := overlay.template_mode(self._physical)) is not None:
                return mode
        return self._physical.state

    @property
    def attributes(self) -> MappingProxyType[str, Any]:
        attrs = dict(self._physical.attributes)
        for overlay in reversed(self._overlays):
            overlay.patch_attributes(attrs, self._physical)
        return MappingProxyType(attrs)
