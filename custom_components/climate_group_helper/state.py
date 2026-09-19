"""Immutable state representation for Climate Group."""
from __future__ import annotations

import logging
import time
from dataclasses import asdict, dataclass, field, fields, replace
from datetime import datetime
from types import MappingProxyType
from typing import Any, Self, TYPE_CHECKING

from homeassistant.core import Event, State

from homeassistant.components.climate import ATTR_HVAC_MODE, PRESET_NONE, HVACMode
from .const import (
    FLOAT_TOLERANCE,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    TRANSIENT_STATES,
    AdoptManualChanges,
)
from .meta_processor import SOURCE_PRESET

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


def available_state(state: State | None) -> State | None:
    """Return `state` if it carries a usable value, else None.

    `unavailable` and `unknown` both mean "nothing to read here": an entity that
    exists but has not reported yet is as unusable as one that is gone.

    Returning the state rather than a verdict is what lets the read and the
    check collapse into one statement — and it narrows the type, so the
    attribute reads that follow are no longer working on an `Optional`:

        if (state := available_state(hass.states.get(x))) is None:
            return
        state.attributes.get(...)

    Where only the verdict is wanted, `is_available()` says so directly.
    """
    if state is None:
        return None
    # Read through `.state` by attribute, not by `isinstance(state, State)`:
    # state-like stand-ins (the test mocks among them) must be read the same
    # way, or they are compared as objects and silently count as available.
    return state if getattr(state, "state", state) not in TRANSIENT_STATES else None


def is_available(state: State | str | None) -> bool:
    """Return True if this state carries a usable value.

    The predicate half of `available_state()`, for filters and condition
    chains. It also takes a bare state string, which that one cannot: event
    handlers frequently hold `new_state.state` where the object itself is no
    longer in reach, and a string has no useful falsy form to return.
    """
    if isinstance(state, str):
        return state not in TRANSIENT_STATES
    return available_state(state) is not None


def other_active_members(group: ClimateGroupHelper, entity_id: str | None) -> list[str]:
    """Members other than `entity_id` that are still running.

    Isolated members are excluded — they don't participate in group state —
    as are unavailable ones: an offline device must not keep the group from
    going off.
    """
    return [
        entity for entity in group.climate_entity_ids
        if entity != entity_id
        and entity not in group.run_state.isolated_members
        and (state := available_state(group.aggregator.read_member_state(entity)))
        and state.state != HVACMode.OFF
    ]


@dataclass(frozen=True)
class RunState:
    """Immutable operational status for the climate group.

    Centralises all factors that restrict controllability and runtime markers:
    - blocking_sources: set of active blocking reasons (e.g. "window", "switch")
    - blocked: derived property — True if any blocking source is active
    - isolated_members: per-member isolation (e.g. curtain closed)
    - oob_members: members currently out-of-bounds (union strategy)
    - startup_time: monotonic timestamp of initialisation completion (only ever
      used as an interval, so it must not be affected by wall-clock jumps)
    - last_active_hvac_mode: cache of last mode other than OFF
    - schedule_hold_until: absolute deadline of a manual schedule hold; while it
      is set the main schedule's climate payload is not applied to the members

    Updates are performed via dataclasses.replace(), consistent with TargetState.
    """

    active_slot_title: str | None = None
    active_virtual_preset: str | None = None
    blocking_sources: frozenset[str] = field(default_factory=frozenset)
    boost_temperature: float | None = None
    boost_until: datetime | None = None
    schedule_hold_until: datetime | None = None
    schedule_bypass_claims: MappingProxyType[str, tuple[Any, Any]] = field(default_factory=lambda: MappingProxyType({}))
    config_overrides: MappingProxyType[str, Any] = field(default_factory=lambda: MappingProxyType({}))
    group_offset: float = 0.0
    isolated_members: frozenset[str] = field(default_factory=frozenset)
    last_active_hvac_mode: str | None = None
    master_fallback_active: bool = False
    oob_members: frozenset[str] = field(default_factory=frozenset)
    startup_time: float | None = None

    @property
    def blocked(self) -> bool:
        """True if any blocking source is active."""
        return bool(self.blocking_sources)

    @property
    def temporary_state_active(self) -> bool:
        """True if any temporary state (blocking source or boost) is active."""
        return bool(self.blocking_sources) or self.boost_temperature is not None

    def set_config_override(self, key: str, value: Any) -> RunState:
        """Return a new RunState with a config override added/updated."""
        new_overrides = dict(self.config_overrides)
        new_overrides[key] = value
        return replace(self, config_overrides=MappingProxyType(new_overrides))

    def clear_config_overrides(self, keys: set[str]) -> RunState:
        """Return a new RunState with specific config overrides removed."""
        new_overrides = dict(self.config_overrides)
        for key in keys:
            new_overrides.pop(key, None)
        return replace(self, config_overrides=MappingProxyType(new_overrides))

    def set_bypass_claims(self, claims: dict[str, tuple[Any, Any]]) -> RunState:
        """Return a new RunState with updated schedule bypass claims."""
        return replace(self, schedule_bypass_claims=MappingProxyType(dict(claims)))

    def clear_bypass_claims(self) -> RunState:
        """Return a new RunState with cleared schedule bypass claims."""
        return replace(self, schedule_bypass_claims=MappingProxyType({}))


@dataclass(frozen=True)
class ClimateState:
    """Base class for climate state representations."""
    # Core Attributes
    hvac_mode: str | None = None
    temperature: float | None = None
    target_temp_low: float | None = None
    target_temp_high: float | None = None
    humidity: float | None = None
    preset_mode: str | None = None
    fan_mode: str | None = None
    swing_mode: str | None = None
    swing_horizontal_mode: str | None = None

    def update(self, **kwargs: Any) -> Self:
        """Return a new state with updated values.

        Unknown keys are dropped rather than raising: callers pass whole
        attribute dicts (schedule payloads, member states) that legitimately
        carry keys this state does not model. A typo at a `StateManager.update()`
        call site looks the same from here, so log what was discarded.
        """
        valid_fields = {f.name for f in fields(self)}
        filtered_kwargs = {key: value for key, value in kwargs.items() if key in valid_fields}
        if _LOGGER.isEnabledFor(logging.DEBUG) and (dropped := set(kwargs) - valid_fields):
            _LOGGER.debug("%s.update() ignored unknown keys: %s", type(self).__name__, sorted(dropped))
        return replace(self, **filtered_kwargs)

    def to_dict(self, attributes: list[str] | None = None) -> dict[str, Any]:
        """Convert state to dictionary. Excludes None values."""
        full = asdict(self)
        if attributes is None:
            return {key: value for key, value in full.items() if value is not None}
        return {key: value for key, value in full.items() if key in attributes and value is not None}

    def __repr__(self) -> str:
        """Only show attributes that are present."""
        data = asdict(self)
        filtered = {key: value for key, value in data.items() if value is not None and value != ""}
        attrs = ", ".join(f"{key}={repr(value)}" for key, value in filtered.items())
        return f"{self.__class__.__name__}({attrs})"


@dataclass(frozen=True)
class TargetState(ClimateState):
    """Current target state of the group with source metadata."""
    last_source: str | None = None
    last_entity: str | None = None
    last_timestamp: float | None = None


@dataclass(frozen=True)
class CurrentState(ClimateState):
    """Actual current state of the group (aggregated)."""
    pass


@dataclass(frozen=True)
class FilterState(ClimateState):
    """Masking state for attribute access control."""
    hvac_mode: bool = True  # type: ignore[assignment]
    temperature: bool = True
    target_temp_low: bool = True
    target_temp_high: bool = True
    humidity: bool = True
    fan_mode: bool = True  # type: ignore[assignment]
    preset_mode: bool = True  # type: ignore[assignment]
    swing_mode: bool = True  # type: ignore[assignment]
    swing_horizontal_mode: bool = True  # type: ignore[assignment]

    @classmethod
    def from_keys(cls, attributes: list[str]) -> FilterState:
        """Create a FilterState with values set to True for the given attributes."""
        data = {f.name: False for f in fields(cls)}
        for attr in attributes:
            if attr in data:
                data[attr] = True
        return cls(**data)


@dataclass(frozen=True)
class ChangeState(ClimateState):
    """Delta between a member's current state and the group's TargetState.

    Only attributes that deviate from the target are populated — all others are None.
    Float attributes (temperature, humidity) use FLOAT_TOLERANCE to suppress noise.
    Per-member offsets are applied before comparison so the delta reflects logical values.
    """
    entity_id: str | None = None

    @classmethod
    def from_event(
        cls,
        event: Event,
        target_state: ClimateState,
        offset_map: dict[str, float] | None = None,
    ) -> ChangeState:
        """Build a ChangeState from a state_changed event vs. the current TargetState."""
        entity_id = event.data.get("entity_id")
        new_state = event.data.get("new_state")
        if new_state is None or target_state is None:
            return cls(entity_id=entity_id)

        def within_tolerance(val1: float, val2: float, tolerance: float = FLOAT_TOLERANCE) -> bool:
            try:
                return abs(float(val1) - float(val2)) < tolerance
            except (ValueError, TypeError):
                return False

        deviations: dict[str, Any] = {}
        # Iterate over ClimateState fields only — ignores ChangeState metadata (entity_id)
        for f in fields(ClimateState):
            key = f.name
            target_val = getattr(target_state, key, None)

            # Apply per-member offset for temperature fields
            if key in ("temperature", "target_temp_low", "target_temp_high"):
                if offset_map and entity_id and entity_id in offset_map and target_val is not None:
                    target_val = target_val + offset_map[entity_id]

            if key == "hvac_mode":
                member_val = new_state.state
            else:
                member_val = new_state.attributes.get(key, None)

            if target_val is None or member_val is None or member_val == target_val:
                continue

            if key in ("temperature", "humidity", "target_temp_low", "target_temp_high") and within_tolerance(target_val, member_val):
                continue

            deviations[key] = member_val

        return cls(entity_id=entity_id, **deviations)

    def attributes(self) -> dict[str, Any]:
        """Return deviated attributes, excluding entity_id metadata."""
        data = self.to_dict()
        data.pop("entity_id", None)
        return data


class BaseStateManager:
    """Base state management with Template Method pattern.
    
    Architecture:
    - All managers share the same TargetState via _group.shared_target_state
    - Source-based access control via `update()`
    - Immutable state updates via TargetState.update()
    
    Hooks (override in derived classes):
    - `_filter_update()`: Block or allow an update (return bool)
    
    Helpers (shared logic, used by hooks):
    - `_check_blocking_mode()`: Check if blocking mode is active
    - `_check_adopt_manual_changes()`: Check if passive tracking allows update
    - `_check_partial_sync()`: Check Last Man Standing logic
    
    Derived classes should override SOURCE to set their identity.
    """

    SOURCE: str = "state_manager"  # Default source, override in derived classes

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the state manager."""
        self._group = group

    @property
    def target_state(self) -> TargetState:
        """Return the current target state from central source."""
        return self._group.shared_target_state

    def _resolve_group_preset(self, kwargs: dict[str, Any]) -> dict[str, Any]:
        """Merge a virtual group preset's payload and track activation/exit on run_state.

        This is the sole owner of `run_state.active_virtual_preset`. It sits
        behind `_filter_update()` on purpose: a preset that never reaches
        `target_state` (blocked window/switch, partial sync) must not be
        reported as active either — the name and the setpoints have to stay in
        step.

        Display and execution are separate: the virtual name lives only in
        `run_state.active_virtual_preset`; `target_state.preset_mode` carries the
        native expectation (a native name or `PRESET_NONE`). The preset is exited
        when a native preset replaces it, or when kwargs touches one of its
        attributes.
        """
        # `kwargs` is always a dict here (update() passes **kwargs), so the
        # empty-payload pass-through in resolve_preset() cannot return None.
        kwargs = self._group.preset_manager.resolve_preset(kwargs) or kwargs
        preset_mode = kwargs.get("preset_mode")
        is_virtual = self._group.preset_manager.is_virtual(preset_mode)
        was_active = self._group.run_state.active_virtual_preset

        if is_virtual:
            # Switching between virtual presets.
            if was_active != preset_mode:
                self._group.run_state = replace(self._group.run_state, active_virtual_preset=preset_mode)
            # The target keeps the native expectation, not the virtual name.
            kwargs["preset_mode"] = PRESET_NONE
        elif was_active:
            if preset_mode is not None:
                # A native preset replaces the virtual one — it owns preset_mode now.
                self._group.run_state = replace(self._group.run_state, active_virtual_preset=None)
            else:
                active_payload = self._group.preset_manager.get_payload(was_active)
                if active_payload and set(kwargs.keys()) & set(active_payload.keys()):
                    self._group.run_state = replace(self._group.run_state, active_virtual_preset=None)
                    kwargs["preset_mode"] = PRESET_NONE

        # Re-selecting the preset that is already active counts as a fresh
        # instruction, not a repeat: the user asked for its values again, and a
        # takeover (reset, manual slider) may have withdrawn some in between.
        # Dropping the claims first makes the sync below re-apply them — the
        # registry never has to know why it is being called.
        if is_virtual and preset_mode == was_active:
            self._group.slot_meta_processor.ownership.release_all(SOURCE_PRESET)
            self._group.preset_manager.sync_meta_claims()
        elif self._group.run_state.active_virtual_preset != was_active:
            self._group.preset_manager.sync_meta_claims()

        return kwargs

    def update(self, entity_id: str | None = None, *, source: str | None = None, **kwargs: Any) -> bool:
        """Update target_state with source tracking.

        Template Method workflow:
        1. Filter via `_filter_update()` (hook)
        2. Resolve virtual group presets (`_resolve_group_preset()`)
        3. Add metadata (source, entity_id, timestamp)
        4. Update the central shared_target_state
        
        Args:
            entity_id: The specific entity that caused the update (optional)
            source: Explicit source attribution override. Used by restore paths
                    that must not leave the manager's own SOURCE behind (e.g. a
                    boost restore attributed as "schedule" so the sticky-override
                    guard releases the schedule again — a restore means the user
                    is NOT in control).
            **kwargs: Attributes to update (hvac_mode, temperature, etc.)
            
        Returns:
            True if update was allowed, False if blocked by filter
        """
        # HA may pass entity_id as a list (e.g. from async_set_temperature kwargs) — normalize to str
        if isinstance(entity_id, list):
            entity_id = entity_id[0] if entity_id else None

        if not self._filter_update(entity_id, kwargs):
            return False

        kwargs = self._resolve_group_preset(kwargs)

        # Inject source metadata (source, entity, timestamp)
        context = self._group._context
        if source is not None:
            kwargs["last_source"] = source
        elif self.SOURCE == "group" and bool(context and context.user_id and not context.parent_id):
            kwargs["last_source"] = "ui"
        else:
            kwargs["last_source"] = self.SOURCE
            
        last_entity = entity_id or self._group.entity_id
        kwargs["last_entity"] = last_entity
        kwargs["last_timestamp"] = time.time()

        self._group.shared_target_state = self._group.shared_target_state.update(**kwargs)
        _LOGGER.debug("[%s] TargetState updated (source=%s): %s", self._group.entity_id, kwargs["last_source"], kwargs)

        # Notify isolation handlers if hvac_mode changed (for HVAC_MODE trigger)
        if "hvac_mode" in kwargs:
            for handler in self._group.member_isolation_handlers:
                handler.on_target_hvac_mode_changed(kwargs["hvac_mode"])

        # Unlike every other target attribute, this one is never echoed back by
        # a device, so no member event follows to drive the aggregation — the
        # only other place the humidity condition is evaluated.
        if "humidity" in kwargs:
            self._group.member_template_manager.check_humidity(
                self._group._attr_current_humidity, kwargs["humidity"]
            )

        # A manual write (user command or MIRROR adoption) starts/renews the
        # hold that defers the schedule's climate payload; the schedule's own
        # writes and restores pass through the source filter.
        self._group.schedule_hold_manager.on_target_state_write(kwargs["last_source"])

        return True

    def _filter_update(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Filter hook — return False to block this update.

        `kwargs` is mutable: an override may drop or rewrite single attributes
        instead of blocking the whole update.
        """
        return True

    def _check_blocking_mode(self) -> bool:
        """Return True if global blocking is active (e.g. window open)."""
        if self._group.run_state.blocked:
            _LOGGER.debug("[%s] TargetState update check (source=%s), blocking_mode=True", self._group.entity_id, self.SOURCE)
            return True
        return False

    def _check_adopt_manual_changes(self, entity_id: str | None) -> bool:
        """Check if updates should be allowed during blocking mode.

        Returns:
            True to allow update, False to block.
        """
        adopt = self._group._window_adopt_manual_changes
        if adopt == AdoptManualChanges.ALL:
            _LOGGER.debug("[%s] Blocking mode active, adopting change (Passive Tracking, source=%s)", self._group.entity_id, self.SOURCE)
            return True
        if adopt == AdoptManualChanges.MASTER_ONLY:
            if entity_id != self._group._master_entity_id:
                _LOGGER.debug("[%s] Blocking mode: rejecting non-master change from %s (source=%s)", self._group.entity_id, entity_id, self.SOURCE)
                return False
            _LOGGER.debug("[%s] Blocking mode active, adopting master change (Passive Tracking, source=%s)", self._group.entity_id, self.SOURCE)
            return True
        return False

    def _check_partial_sync(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Check Partial Sync / Last Man Standing logic.

        Blocks updating TargetState HVACMode.OFF unless this is the last active member.
        """
        if not self._group.config.get(CONF_IGNORE_OFF_MEMBERS_SYNC):
            return True

        if kwargs.get(ATTR_HVAC_MODE) != HVACMode.OFF:
            return True

        if active_members := other_active_members(self._group, entity_id):
            _LOGGER.debug("[%s] Blocking sync_mode OFF update due to partial sync (Active members: %s)", self._group.entity_id, active_members)
            return False

        _LOGGER.debug("[%s] Allowing sync_mode OFF update (Last Man Standing logic)", self._group.entity_id)
        return True


class ClimateStateManager(BaseStateManager):
    """State Manager for ClimateGroupHelper operations."""

    SOURCE = "group"

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the climate state manager."""
        super().__init__(group)

    def _filter_update(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Filter user updates based on blocking mode."""
        if entity_id and entity_id in self._group.run_state.isolated_members:
            _LOGGER.debug("[%s] TargetState update blocked: %s is isolated", self._group.entity_id, entity_id)
            return False

        if self._check_blocking_mode():
            if kwargs.get(ATTR_HVAC_MODE) == HVACMode.OFF:
                _LOGGER.debug("[%s] Blocking mode active, allowing adopt off command", self._group.entity_id)
                return True
            if not self._check_adopt_manual_changes(entity_id):
                return False
        return True


class SyncModeStateManager(BaseStateManager):
    """State Manager with Sync Mode specific filters."""

    SOURCE = "sync_mode"

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the sync mode state manager."""
        super().__init__(group)

    def _filter_update(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Apply sync-mode specific filters."""
        if entity_id and entity_id in self._group.run_state.isolated_members:
            _LOGGER.debug(
                "[%s] TargetState update blocked: %s is isolated. Current set: %s",
                self._group.entity_id, entity_id, list(self._group.run_state.isolated_members)
            )
            return False

        # 1. Blocking Mode Filter
        if self._check_blocking_mode():
            if not self._check_adopt_manual_changes(entity_id):
                return False

        # 2. Partial Sync Filter (Last Man Standing)
        if not self._check_partial_sync(entity_id, kwargs):
            return False

        return True


class AdoptStateManager(SyncModeStateManager):
    """State Manager for the adopt_only sync mode.

    Adoption is identical to MIRROR — the mode differs only in not pushing the
    result at the members, which is decided in `resync()`, not here. So every
    filter of the sync-mode manager applies unchanged, Last Man Standing
    included: it *is* the "is anything still running?" threshold this mode is
    built around.

    Only two things are its own:
    - `SOURCE`, so `last_source` tells this adoption from the mirroring one.
    - The boost filter. MIRROR aborts a running boost when it adopts and then
      pushes the new target; without a push the boost would keep the members on
      its own setpoint while the target silently moved underneath it.
    """

    SOURCE = "adopt_only"

    def _filter_update(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Apply the sync-mode filters, plus a boost guard."""
        if self._group.run_state.boost_temperature is not None:
            _LOGGER.debug("[%s] AdoptState update blocked (boost active)", self._group.entity_id)
            return False

        return super()._filter_update(entity_id, kwargs)

    def _check_partial_sync(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Last Man Standing, independent of the "respect member off state" option.

        For the other sync modes that option answers "should an off member be
        left alone by the enforcement", and gating the target update on it is
        consistent there: a mode that pushes can correct a target it took too
        eagerly. This mode never pushes, so a premature OFF just stands — and
        the group would report itself off while members keep heating, with the
        next restore turning them off for real.

        The threshold is what this mode is: the group is off once nothing runs
        any more, not as soon as one device does.
        """
        if kwargs.get(ATTR_HVAC_MODE) != HVACMode.OFF:
            return True

        if active_members := other_active_members(self._group, entity_id):
            _LOGGER.debug(
                "[%s] Blocking adopt_only OFF update — still active: %s",
                self._group.entity_id, active_members,
            )
            return False

        return True


class WindowControlStateManager(BaseStateManager):
    """State Manager for Window Control.
    
    Window Control does NOT modify target_state at all.
    This manager blocks ALL updates - it's effectively read-only.
    Window Control uses call_immediate() directly.
    """

    SOURCE = "window_control"

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the window control state manager."""
        super().__init__(group)

    def _filter_update(self, entity_id: str | None, kwargs: dict[str, Any]) -> bool:
        """Block all updates - Window Control is read-only."""
        _LOGGER.debug("[%s] TargetState update blocked for WindowControl", self._group.entity_id)
        return False


class ScheduleStateManager(BaseStateManager):
    """State Manager for Schedule updates.

    No filter overrides - Schedule updates are ALWAYS allowed.
    This is intentional: the schedule must be able to prepare target_state
    even when blocking_mode is active (background prep for window close).
    """

    SOURCE = "schedule"

    def __init__(self, group: ClimateGroupHelper) -> None:
        """Initialize the schedule state manager."""
        super().__init__(group)
