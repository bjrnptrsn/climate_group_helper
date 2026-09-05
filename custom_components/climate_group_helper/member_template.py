"""Member Templates — virtual capability transformation for climate group members.

A *Member Template* presents a physical member with a different capability
profile than it natively has. Conceptually similar to `hass-template-climate`,
but specialised and automated for specific transformation patterns.

The pattern has two halves:

* **Input gateway** — `Aggregator.read_member_state()` /
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
)
from homeassistant.core import CALLBACK_TYPE, State, callback
from homeassistant.helpers.event import async_call_later
from types import MappingProxyType

from .const import (
    DEFAULT_RANGE_TEMPLATE_HUMIDITY_ACTION,
    DEFAULT_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY,
    DEFAULT_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS,
    RangeTemplateDeadbandAction,
    RangeTemplateHumidityAction,
)
from .state import available_state, is_available

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


@dataclass
class RangeTemplate:
    """Per-group configuration and runtime state for the Range Template.

    `low`/`high` cache the most recently commanded range so a follow-up
    `hvac_mode=heat_cool` without explicit setpoints can still resolve a band.
    `last_physical_mode` is used as a fallback when `current_temperature` is
    unavailable. `heat_entities`/`cool_entities` hold the explicit role
    assignment — members may be restricted to heating and/or cooling. A member
    in neither set is unrestricted ("auto": physical capability decides).
    """

    entity_ids: frozenset[str]
    deadband_action: str  # "none" | "off" | "fan_only"
    low: float | None = None
    high: float | None = None
    heat_entities: set[str] = field(default_factory=set)
    cool_entities: set[str] = field(default_factory=set)
    last_physical_mode: dict[str, str] = field(default_factory=dict)
    humidity_enabled: bool = False
    humidity_action: str = DEFAULT_RANGE_TEMPLATE_HUMIDITY_ACTION
    humidity_hysteresis: float = DEFAULT_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS
    humidity_deactivation_delay: float = DEFAULT_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY
    humidity_active: bool = False

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
        expected_mode: str | None,
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
        if not is_available(self._real):
            return self._real.state
        # No expected mode means no command is due — the member is left alone
        # deliberately and still reads as heat_cool. OFF is excluded: the
        # template never commands it, and isolation release / Last Man Standing
        # must keep seeing an off member.
        if self._expected_mode is None and self._real.state != HVACMode.OFF:
            return HVACMode.HEAT_COOL
        return HVACMode.HEAT_COOL if self._real.state == self._expected_mode else self._real.state

    @property
    def attributes(self) -> MappingProxyType[str, Any]:
        """Render the member's attributes as those of a `heat_cool` range entity."""
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

    def __init__(
        self,
        group: ClimateGroupHelper,
        deadband_action: str | None,
        heat_entities: set[str] | None = None,
        cool_entities: set[str] | None = None,
        humidity_enabled: bool = False,
        humidity_action: str = DEFAULT_RANGE_TEMPLATE_HUMIDITY_ACTION,
        humidity_hysteresis: float = DEFAULT_RANGE_TEMPLATE_HUMIDITY_HYSTERESIS,
        humidity_deactivation_delay: float = DEFAULT_RANGE_TEMPLATE_HUMIDITY_DEACTIVATION_DELAY,
    ) -> None:
        self._group = group
        self._range_template: RangeTemplate | None = (
            RangeTemplate(
                entity_ids=frozenset(),
                deadband_action=deadband_action,
                heat_entities=heat_entities or set(),
                cool_entities=cool_entities or set(),
                humidity_enabled=humidity_enabled,
                humidity_action=humidity_action,
                humidity_hysteresis=humidity_hysteresis,
                humidity_deactivation_delay=humidity_deactivation_delay,
            )
            if deadband_action is not None
            else None
        )
        self._deactivation_timer: CALLBACK_TYPE | None = None

    @property
    def range_template(self) -> RangeTemplate | None:
        """Return the active RangeTemplate, or None when disabled."""
        return self._range_template

    @staticmethod
    def is_covered_state(state: State | RangeTemplateState | None) -> bool:
        """Return True if `state` is a template-rendered (covered) member state.

        A `RangeTemplateState` instance exists exactly when `apply_state()` wrapped
        the member — i.e. template active AND member covered AND group in `heat_cool`.
        Single source of truth for "is this member owned by the template", used by
        the display aggregation, the SyncCallHandler enforcement exclusion, the sync
        adoption exclusion, and the changeover trigger.
        """
        return isinstance(state, RangeTemplateState)

    def display_mode(self, state: State | RangeTemplateState) -> str:
        """Aggregation-facing hvac_mode for one member state.

        Template-covered members are logically `heat_cool` regardless of their
        current physical mode (heat/cool/deadband). Used by the group's hvac_mode
        aggregation and assumed-state/temperature consumers — NOT by the sync path,
        which must keep seeing physical deviations (see RangeTemplateState.state).
        """
        return HVACMode.HEAT_COOL if self.is_covered_state(state) else state.state

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
            expected_mode: str | None = state.state
            expected_temp = state.attributes.get(ATTR_TEMPERATURE)
            return RangeTemplateState(state, None, None, expected_mode, expected_temp)

        current_temp = self._read_current_temp(state)
        supported_modes = state.attributes.get(ATTR_HVAC_MODES)
        # Offsets: the band is raw (target_state / cache carry no offsets), so
        # both halves of the template re-apply them before comparing. This input
        # side must add member + group offset UNCONDITIONALLY — it does not know
        # which handler consumes the wrapped state and cannot reproduce the
        # output side's conditional `_apply_group_offset()`. During temporary
        # state (boost/block) the output pushes offset-free, but the changeover
        # and sync are suppressed then anyway (`TemplateCallHandler._block_all_calls`,
        # no adoption of covered members) — the asymmetry is intentional.
        member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
        group_offset = self._group.run_state.group_offset
        offset = member_offset + group_offset
        expected_mode, expected_temp = self.expected_mode_for(
            entity_id, low + offset, high + offset, current_temp, supported_modes
        )
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
    ) -> tuple[str | None, float | None]:
        """Compute the expected physical (mode, setpoint) for one member."""
        template = self._range_template
        if template is None:
            # Every current caller guards on an active template; this keeps the
            # contract honest for future ones instead of raising on attribute access.
            return None, None
        # None also for a device that cannot perform the action: it would reject
        # the call, so sending nothing is the honest result. `_mode_allowed()`
        # does not catch this — it waves through everything but heat/cool.
        action = template.deadband_action
        deadband = (
            None
            if action == RangeTemplateDeadbandAction.NONE
            or (supported_modes is not None and action not in supported_modes)
            else action
        )

        if current_temp is None:
            last_mode = template.last_physical_mode.get(entity_id)
            if (
                last_mode in (HVACMode.HEAT, HVACMode.COOL)
                and not self._mode_allowed(last_mode, supported_modes, entity_id)
            ):
                return deadband, None
            return last_mode if last_mode is not None else deadband, None

        if current_temp < low:
            if self._mode_allowed(HVACMode.HEAT, supported_modes, entity_id):
                return HVACMode.HEAT, low
        elif current_temp > high:
            if self._mode_allowed(HVACMode.COOL, supported_modes, entity_id):
                return HVACMode.COOL, high
        else:
            # Deadband branch (low <= current_temp <= high)
            if template.humidity_enabled and template.humidity_active:
                hum_action = template.humidity_action
                if (
                    self._mode_allowed(hum_action, supported_modes, entity_id)
                    and (supported_modes is None or hum_action in supported_modes)
                ):
                    return hum_action, None

            # `deadband_action: none` sends nothing, which would leave the member
            # stuck in dry once the condition ends. Only for DRY: fan_only is also
            # a mode the user may have set by hand, so forcing a recovery off it
            # would override that.
            if (
                template.humidity_enabled
                and not template.humidity_active
                and deadband is None
                and template.humidity_action == RangeTemplateHumidityAction.DRY
            ):
                real_state = self._group.hass.states.get(entity_id)
                if real_state and real_state.state == template.humidity_action:
                    last_mode = template.last_physical_mode.get(entity_id)
                    if last_mode and (supported_modes is None or last_mode in supported_modes):
                        return last_mode, None
                    if supported_modes is None or HVACMode.OFF in supported_modes:
                        return HVACMode.OFF, None

        return deadband, None

    def _mode_allowed(
        self, mode: str, supported_modes: list[str] | None, entity_id: str
    ) -> bool:
        """Physical capability AND role assignment — role only restricts, never extends.

        A member without an entry in either role list behaves as before ("auto"):
        physical capability is authoritative. A role-assigned member may only use
        the modes its role grants. Modes other than `heat`/`cool`/`dry` are never
        governed by roles. `dry` cools the evaporator physically, so it is treated
        like `cool` (only allowed if cooling is allowed for this member).
        """
        if mode not in (HVACMode.HEAT, HVACMode.COOL, HVACMode.DRY):
            return True
        if supported_modes is not None and mode not in supported_modes:
            return False
        template = self._range_template
        if template is None:
            return True  # Template disabled — no role can restrict
        if (
            entity_id not in template.heat_entities
            and entity_id not in template.cool_entities
        ):
            return True  # Auto: no role assigned, capability check above is authoritative
        if mode == HVACMode.HEAT:
            return entity_id in template.heat_entities
        # Both COOL and DRY require cool role permission
        return entity_id in template.cool_entities

    @callback
    def check_humidity(
        self, current_humidity: float | None, target_humidity: float | None
    ) -> None:
        """Evaluate humidity threshold with Schmitt-trigger hysteresis and delays."""
        template = self._range_template
        if template is None or not template.humidity_enabled:
            return

        # End the action rather than freeze it: it only ends on a threshold, so
        # a missing sensor would keep `dry` (and its cooling) running forever.
        # Through the normal delay, so a brief dropout does not short-cycle.
        if target_humidity is None or current_humidity is None:
            self._deactivate_humidity(template)
            return

        half_hyst = template.humidity_hysteresis / 2.0
        high_threshold = target_humidity + half_hyst
        low_threshold = target_humidity - half_hyst

        if current_humidity > high_threshold:
            if self._deactivation_timer is not None:
                self._deactivation_timer()
                self._deactivation_timer = None

            # Activation is immediate — unlike deactivation, delaying it only
            # lets the humidity climb further while waiting (same reasoning as
            # heat/cool never delaying when the temperature band is left).
            if not template.humidity_active:
                self._set_humidity_active(True)
        elif current_humidity < low_threshold:
            self._deactivate_humidity(template)
        else:
            if self._deactivation_timer is not None:
                self._deactivation_timer()
                self._deactivation_timer = None

    @callback
    def _deactivate_humidity(self, template: RangeTemplate) -> None:
        """End the humidity action, honouring the configured deactivation delay."""
        if not template.humidity_active or self._deactivation_timer is not None:
            return
        if template.humidity_deactivation_delay <= 0.0:
            self._set_humidity_active(False)
            return
        self._deactivation_timer = async_call_later(
            self._group.hass,
            template.humidity_deactivation_delay,
            self._on_deactivation_timer,
        )

    @callback
    def _set_humidity_active(self, active: bool) -> None:
        """Flip the deadband humidity condition, driving a changeover on a change."""
        template = self._range_template
        if template is None or template.humidity_active == active:
            return
        template.humidity_active = active
        _LOGGER.debug(
            "[%s] Range template humidity condition changed to %s",
            self._group.entity_id,
            active,
        )
        self._group._trigger_template_changeover()

    @callback
    def _recheck_humidity_threshold(self) -> bool:
        """TOCTOU re-check of the humidity condition at timer fire time.

        The delay timer was armed from an earlier evaluation; re-read the
        current aggregated humidity and commanded target before acting, so a
        humidity that climbed back over the threshold while the timer was
        pending does not get deactivated anyway. Mirrors the presence handler's
        TOCTOU re-check in `_go_away`/`_go_restore`.

        A reading that is still missing confirms deactivation instead of
        aborting it — that is the same reason the timer may have been armed in
        the first place (see `check_humidity`).
        """
        template = self._range_template
        if template is None or not template.humidity_enabled:
            return False
        current = getattr(self._group, "_attr_current_humidity", None)
        target = self._group.shared_target_state.humidity
        if current is None or target is None:
            return True
        half_hyst = template.humidity_hysteresis / 2.0
        return current < target - half_hyst

    @callback
    def _on_deactivation_timer(self, _now: Any) -> None:
        self._deactivation_timer = None
        if not self._recheck_humidity_threshold():
            return
        self._set_humidity_active(False)

    def async_cancel_timers(self) -> None:
        """Cancel any running delay timer."""
        if self._deactivation_timer is not None:
            self._deactivation_timer()
            self._deactivation_timer = None

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
            if (s := available_state(self._group.hass.states.get(eid)))
            and HVACMode.HEAT_COOL not in s.attributes.get(ATTR_HVAC_MODES, [])
        )
        self.initialize_last_modes()
        return list(template.entity_ids)

    def initialize_last_modes(self) -> None:
        """Seed last_physical_mode for newly-covered members with no entry yet.

        Called from update_members() so it re-runs whenever entity_ids changes
        (e.g. a member becomes available after being unavailable at startup).
        setdefault-style: skips entities that already have an entry, so it
        never overwrites a value the TemplateCallHandler has since set.
        """
        template = self._range_template
        if template is None:
            return
        for entity_id in template.entity_ids:
            if entity_id in template.last_physical_mode:
                continue
            real_state = self._group.hass.states.get(entity_id)
            if is_available(real_state):
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
