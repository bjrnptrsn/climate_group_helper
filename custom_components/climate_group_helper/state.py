"""Immutable state representation for Climate Group."""
from __future__ import annotations

import logging
import time
from dataclasses import asdict, dataclass, field, fields, replace
from typing import Any, TYPE_CHECKING

from homeassistant.core import Event

from homeassistant.components.climate import ATTR_HVAC_MODE, HVACMode
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from .const import (
    FLOAT_TOLERANCE,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    AdoptManualChanges,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class RunState:
    """Immutable operational status for the climate group.

    Centralises all factors that restrict controllability and runtime markers:
    - blocked: global block (e.g. window open via WindowControl)
    - isolated_members: per-member isolation (e.g. curtain closed)
    - oob_members: members currently out-of-bounds (union strategy)
    - blocking_reason: human-readable reason for the global block
    - startup_time: unix timestamp of initialisation completion
    - last_active_hvac_mode: cache of last mode other than OFF

    Updates are performed via dataclasses.replace(), consistent with TargetState.
    """

    blocked: bool = False
    blocking_reason: str | None = None
    isolated_members: frozenset[str] = field(default_factory=frozenset)
    oob_members: frozenset[str] = field(default_factory=frozenset)
    startup_time: float | None = None
    last_active_hvac_mode: str | None = None


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

    def update(self, **kwargs: Any) -> ClimateState:
        """Return a new state with updated values."""
        valid_fields = {f.name for f in fields(self)}
        filtered_kwargs = {k: v for k, v in kwargs.items() if k in valid_fields}
        return replace(self, **filtered_kwargs)

    def to_dict(self, attributes: list[str] | None = None) -> dict[str, Any]:
        """Convert state to dictionary. Excludes None values."""
        full = asdict(self)
        if attributes is None:
            return {k: v for k, v in full.items() if v is not None}
        return {k: v for k, v in full.items() if k in attributes and v is not None}

    def __repr__(self) -> str:
        """Only show attributes that are present."""
        data = asdict(self)
        filtered = {key: value for key, value in data.items() if value is not None and value != ""}
        attrs = ", ".join(f"{key}={repr(value)}" for key, value in filtered.items())
        return f"{self.__class__.__name__}({attrs})"


@dataclass(frozen=True)
class TargetState(ClimateState):
    """Current target state of the group with provenance metadata."""
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
    hvac_mode: bool = True
    temperature: bool = True
    target_temp_low: bool = True
    target_temp_high: bool = True
    humidity: bool = True
    fan_mode: bool = True
    preset_mode: bool = True
    swing_mode: bool = True
    swing_horizontal_mode: bool = True

    @classmethod
    def from_keys(cls, attributes: list[str]) -> FilterState:
        """Create a FilterState with values set to True for the given attributes."""
        data = {f.name: False for f in fields(cls)}
        for attr in attributes:
            if attr in data:
                data[attr] = True
        return cls(**data)


_TRUSTED_CONTEXT_IDS = frozenset({"service_call", "group", "sync_mode", "schedule", "isolation"})


def is_own_echo(event: Event) -> bool:
    """Return True if the event was caused by one of our own service calls.

    Checks the origin_event context against the set of trusted context IDs
    that the group uses when dispatching commands to members.
    """
    origin_event = getattr(event.context, "origin_event", None)
    if not origin_event:
        return False
    if origin_event.event_type != "call_service" or origin_event.data.get("domain") != "climate":
        return False
    return origin_event.context.id in _TRUSTED_CONTEXT_IDS


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

    def __init__(self, group: ClimateGroup):
        """Initialize the state manager."""
        self._group = group

    @property
    def target_state(self) -> TargetState:
        """Return the current target state from central source."""
        return self._group.shared_target_state

    def update(self, entity_id: str | None = None, **kwargs) -> bool:
        """Update target_state with source tracking.
        
        Template Method workflow:
        1. Filter via `_filter_update()` (hook)
        2. Add metadata (source, entity_id, timestamp)
        3. Update the central shared_target_state
        
        Args:
            entity_id: The specific entity that caused the update (optional)
            **kwargs: Attributes to update (hvac_mode, temperature, etc.)
            
        Returns:
            True if update was allowed, False if blocked by filter
        """
        # HA may pass entity_id as a list (e.g. from async_set_temperature kwargs) — normalize to str
        if isinstance(entity_id, list):
            entity_id = entity_id[0] if entity_id else None

        if not self._filter_update(entity_id, kwargs):
            return False

        # Inject provenance metadata (source, entity, timestamp)
        context = self._group._context
        if self.SOURCE == "group" and bool(context and context.user_id and not context.parent_id):
            kwargs["last_source"] = "ui"
        else:
            kwargs["last_source"] = self.SOURCE
            
        last_entity = entity_id or self._group.entity_id
        kwargs["last_entity"] = last_entity
        kwargs["last_timestamp"] = time.time()

        self._group.shared_target_state = self._group.shared_target_state.update(**kwargs)
        _LOGGER.debug("[%s] TargetState updated (source=%s): %s", self._group.entity_id, kwargs["last_source"], kwargs)

        # Notify isolation handler if hvac_mode changed (for HVAC_MODE trigger)
        if "hvac_mode" in kwargs:
            self._group.member_isolation_handler.on_target_hvac_mode_changed(kwargs["hvac_mode"])

        return True

    def _filter_update(self, entity_id: str | None, kwargs: dict) -> bool:
        """Filter hook - return False to block this update.

        Args:
            entity_id: Entity causing the update
            kwargs: Mutable dict of attributes to update
        Returns:
            True to allow update, False to block
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

    def _check_partial_sync(self, entity_id: str | None, kwargs: dict) -> bool:
        """Check Partial Sync / Last Man Standing logic.

        Blocks updating TargetState HVACMode.OFF unless this is the last active member.
        Args:
            entity_id: Entity causing the update
            kwargs: Attributes being updated
        Returns:
            True to allow, False to block
        """
        # Only if CONF_IGNORE_OFF_MEMBERS_SYNC is enabled
        if not self._group.config.get(CONF_IGNORE_OFF_MEMBERS_SYNC):
            return True

        # Only if setting hvac_mode to OFF
        if kwargs.get("hvac_mode") != HVACMode.OFF:
            return True

        # Allow if no other members are still ON (Last Man Standing)
        other_active_members = [
            entity for entity in self._group.climate_entity_ids
            if entity != entity_id 
            and (state := self._group.hass.states.get(entity)) 
            and state.state != HVACMode.OFF 
            and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
        ]

        if other_active_members:
            _LOGGER.debug("[%s] Blocking sync_mode OFF update due to partial sync (Active members: %s)", self._group.entity_id, other_active_members)
            return False

        _LOGGER.debug("[%s] Allowing sync_mode OFF update (Last Man Standing logic)", self._group.entity_id)
        return True


class ClimateStateManager(BaseStateManager):
    """State Manager for ClimateGroup operations."""

    SOURCE = "group"

    def __init__(self, group: ClimateGroup):
        """Initialize the climate state manager."""
        super().__init__(group)

    def _filter_update(self, entity_id: str | None, kwargs: dict) -> bool:
        """Filter user updates based on blocking mode."""
        if entity_id and entity_id in self._group.run_state.isolated_members:
            _LOGGER.debug("[%s] TargetState update blocked: %s is isolated", self._group.entity_id, entity_id)
            return False

        if self._check_blocking_mode():
            # Allow explicit off command
            if kwargs.get(ATTR_HVAC_MODE) == HVACMode.OFF:
                _LOGGER.debug("[%s] Blocking mode active, but allowing adopt off command", self._group.entity_id)
                return True
            if not self._check_adopt_manual_changes(entity_id):
                return False
        return True


class SyncModeStateManager(BaseStateManager):
    """State Manager with Sync Mode specific filters."""

    SOURCE = "sync_mode"

    def __init__(self, group: ClimateGroup):
        """Initialize the sync mode state manager."""
        super().__init__(group)

    def _filter_update(self, entity_id: str | None, kwargs: dict) -> bool:
        """Apply sync-mode specific filters."""
        if entity_id and entity_id in self._group.run_state.isolated_members:
            _LOGGER.debug("[%s] TargetState update blocked: %s is isolated", self._group.entity_id, entity_id)
            return False

        # 1. Blocking Mode Filter
        if self._check_blocking_mode():
            if not self._check_adopt_manual_changes(entity_id):
                return False

        # 2. Partial Sync Filter (Last Man Standing)
        if not self._check_partial_sync(entity_id, kwargs):
            return False

        return True


class WindowControlStateManager(BaseStateManager):
    """State Manager for Window Control.
    
    Window Control does NOT modify target_state at all.
    This manager blocks ALL updates - it's effectively read-only.
    Window Control uses call_immediate() directly.
    """

    SOURCE = "window_control"

    def __init__(self, group: ClimateGroup):
        """Initialize the window control state manager."""
        super().__init__(group)

    def _filter_update(self, entity_id: str | None, kwargs: dict) -> bool:
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

    def __init__(self, group: ClimateGroup):
        """Initialize the schedule state manager."""
        super().__init__(group)
