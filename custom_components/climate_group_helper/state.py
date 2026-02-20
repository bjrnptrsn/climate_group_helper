"""Immutable state representation for Climate Group."""
from __future__ import annotations

import logging
import time
from dataclasses import asdict, dataclass, fields, replace
from typing import Any, TYPE_CHECKING

from homeassistant.core import Event

from homeassistant.components.climate import HVACMode
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from .const import (
    FLOAT_TOLERANCE,
    CONF_IGNORE_OFF_MEMBERS,
    CONF_SYNC_ATTRS,
    SYNC_TARGET_ATTRS,
    AdoptManualChanges,
)

if TYPE_CHECKING:
    from .climate import ClimateGroup

_LOGGER = logging.getLogger(__name__)


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


@dataclass(frozen=True)
class ChangeState(ClimateState):
    """Represents a state deviation delta from a TargetState."""
    entity_id: str | None = None

    @classmethod
    def from_event(cls, event: Event, target_state: ClimateState) -> ChangeState:
        """Calculates difference between Event and TargetState."""
        new_state = event.data.get("new_state")
        if new_state is None:
            return cls(entity_id=event.data.get("entity_id"))

        def within_tolerance(val1: float, val2: float, tolerance: float = FLOAT_TOLERANCE) -> bool:
            try:
                return abs(float(val1) - float(val2)) < tolerance
            except (ValueError, TypeError):
                return False

        deviations: dict[str, Any] = {}
        # We iterate over the fields of the base ClimateState to ignore metadata
        for field in fields(ClimateState):
            key = field.name
            target_val = getattr(target_state, key, None)
            
            if key == "hvac_mode":
                member_val = new_state.state
            else:
                member_val = new_state.attributes.get(key, None)

            if target_val is None or member_val is None or member_val == target_val:
                continue
                
            if (key == "temperature" or key == "humidity") and within_tolerance(target_val, member_val):
                continue
                
            deviations[key] = member_val

        return cls(entity_id=event.data.get("entity_id"), **deviations)

    def attributes(self) -> dict[str, Any]:
        """Returns the state attributes excluding metadata."""
        data = self.to_dict()
        data.pop("entity_id", None)
        return data


class BaseStateManager:
    """Base state management without filter logic.
    
    This class provides centralized state management with a Template Method pattern.
    Derived classes can override `_pre_update_filter()` to implement custom filtering.
    
    Architecture:
    - All managers share the same TargetState via _group.shared_target_state
    - Source-based access control via `update()`
    - Immutable state updates via TargetState.update()
    
    Shared State Pattern:
    - target_state is a property that reads from _group.shared_target_state
    - update() writes to _group.shared_target_state
    - All managers automatically see the same state
    
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
        
        This method implements the Template Method pattern:
        1. Check `pre_update_filter` if update is not blocked
        2. Adds metadata (source, entity_id, timestamp)
        3. Updates the central shared_target_state
        
        Args:
            entity_id: The specific entity that caused the update (optional)
            **kwargs: Attributes to update (hvac_mode, temperature, etc.)
            
        Returns:
            True if update was allowed, False if blocked by filter
        """
        # Template Method: Allow derived classes to filter/modify kwargs
        if not self._pre_update_filter(entity_id, kwargs):
            return False

        # Add Metadata
        context = self._group._context
        if self.SOURCE == "group" and bool(context and context.user_id and not context.parent_id):
            kwargs["last_source"] = "ui"
        else:
            kwargs["last_source"] = self.SOURCE
            
        last_entity = entity_id or self._group.entity_id
        kwargs["last_entity"] = last_entity[0] if isinstance(last_entity, list) and last_entity else last_entity
        kwargs["last_timestamp"] = time.time()

        # Update the CENTRAL shared target state
        self._group.shared_target_state = self._group.shared_target_state.update(**kwargs)
        _LOGGER.debug("[%s] TargetState updated (source=%s): %s", self._group.entity_id, kwargs["last_source"], kwargs)
        return True

    def _pre_update_filter(self, entity_id: str | None, kwargs: dict) -> bool:
        """Hook for derived classes to filter updates.
        Args:
            entity_id: Entity causing the update
            kwargs: Mutable dict of attributes to update
        Returns:
            True to allow update, False to block
        """
        return True

    def _blocking_mode(self) -> bool:
        """Check if blocking mode is active."""
        if self._group.blocking_mode:
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
        # Only if CONF_IGNORE_OFF_MEMBERS is enabled
        if not self._group.config.get(CONF_IGNORE_OFF_MEMBERS):
            return True

        # Only if setting hvac_mode to OFF
        if HVACMode.OFF not in kwargs.get("hvac_mode", ""):
            return True

        # Last Man Standing Check logic
        # If all other members are OFF, allow update
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

    def _pre_update_filter(self, entity_id: str | None, kwargs: dict) -> bool:
        """Filter user updates based on blocking mode."""
        if self._blocking_mode():
            if not self._check_adopt_manual_changes(entity_id):
                return False
        return True


class SyncModeStateManager(BaseStateManager):
    """State Manager with Sync Mode specific filters."""

    SOURCE = "sync_mode"

    def __init__(self, group: ClimateGroup):
        """Initialize the sync mode state manager."""
        super().__init__(group)
        self._filter_state = FilterState.from_keys(group.config.get(CONF_SYNC_ATTRS, SYNC_TARGET_ATTRS))

    def _pre_update_filter(self, entity_id: str | None, kwargs: dict) -> bool:
        """Apply sync-mode specific filters."""

        # 1. Blocking Mode Filter
        if self._blocking_mode():
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

    def _pre_update_filter(self, entity_id: str | None, kwargs: dict) -> bool:
        """Block all updates - Window Control is read-only."""
        _LOGGER.debug("[%s] TargetState update blocked for WindowControl", self._group.entity_id)
        return False


class ScheduleStateManager(BaseStateManager):
    """State Manager for Schedule updates."""

    SOURCE = "schedule"

    def __init__(self, group: ClimateGroup):
        """Initialize the schedule state manager."""
        super().__init__(group)
