"""Immutable state representation for Climate Group."""
from __future__ import annotations

from dataclasses import asdict, dataclass, fields, replace
from typing import Any

from homeassistant.core import Event
from .const import FLOAT_TOLERANCE


@dataclass(frozen=True)
class TargetState:
    """Current target state of the group.
    
    This state serves as the single source of truth for all group operations.
    It is persistent and represents the intended state, regardless of temporary
    deviations (like window open) or latency.

    Metadata fields allow tracking the provenance of the state (Optimistic Concurrency Control).
    """
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
    

    # Provenance Metadata (Not synced to devices)
    last_updated_by_entity: str | None = None
    last_updated_by_source: str | None = None
    last_updated_timestamp: float = 0.0

    def update(self, **kwargs: Any) -> TargetState:
        """Return a new TargetState with updated values.
        
        Args:
            **kwargs: Attributes to update. Can include metadata fields.
        """
        # Filter out fields that are not in the dataclass to prevent errors
        valid_fields = {f.name for f in fields(self)}
        filtered_kwargs = {k: v for k, v in kwargs.items() if k in valid_fields}
        
        return replace(self, **filtered_kwargs)

    def to_dict(self, attributes: list[str] | None = None) -> dict[str, Any]:
        """Convert state to dictionary.
        Args:
            attributes: provide only given attributes. None for all.
        Returns:
            Dictionary with attribute names as keys. None values are excluded.
        """
        full = asdict(self)
        
        if attributes is None:
            return {k: v for k, v in full.items() if v is not None}
        else:
            return {k: v for k, v in full.items() if k in attributes and v is not None}

    def __repr__(self) -> str:
        """Only show attributes that are present (not None or empty string)."""
        data = asdict(self)
        filtered = {key: value for key, value in data.items() if value is not None and value != ""}
        attrs = ", ".join(f"{key}={repr(value)}" for key, value in filtered.items())
        return f"{self.__class__.__name__}({attrs})"


@dataclass(frozen=True)
class FilterState(TargetState):
    """State that is used as a filter for masking.
    
    True: attribute is allowed.
    False: attribute is not allowed.
    """

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
        # Start with all False (overriding default True)
        data = {key: False for key in cls.__annotations__}
        for attr in attributes:
            if attr in TargetState.__annotations__:
                data[attr] = True
        return cls(**data)

    def to_dict(self, attributes: list[str] | None = None) -> dict[str, Any]:
        """Convert filter state to dictionary, excluding metadata."""
        data = super().to_dict(attributes)
        # Exclude metadata fields that leak from TargetState inheritance
        return {k: v for k, v in data.items() if not k.startswith("last_updated_")}


@dataclass(frozen=True)
class ChangeState(TargetState):
    """Represents a state deviation delta from a TargetState."""

    entity_id: str | None = None

    @classmethod
    def from_event(cls, event: Event, target_state: TargetState) -> ChangeState:
        """
        Calculates the difference between the Event's new state and the TargetState.
        Returns a ChangeState containing only the attributes that differ including entity_id.
        Unchanged or unrelated attributes are not included.
        """
        new_state = event.data.get("new_state")
        if new_state is None:
            return cls(entity_id=event.data.get("entity_id"))

        def within_tolerance(val1: float, val2: float, tolerance: float = FLOAT_TOLERANCE) -> bool:
            """Check if two values are within a given tolerance."""
            try:
                return abs(float(val1) - float(val2)) < tolerance
            except (ValueError, TypeError):
                return False

        deviations: dict[str, Any] = {}
        
        # Iterate over all fields defined in TargetState
        for key in TargetState.__annotations__:
            if key in ["entity_id"]:
                continue

            # Get target value
            target_val = getattr(target_state, key, None)
            
            # Get member value from new_state
            # Handle hvac_mode vs attributes
            if key == "hvac_mode":
                member_val = new_state.state
            else:
                member_val = new_state.attributes.get(key, None)

            # Skip if target not set or values match
            if target_val is None or member_val == target_val:
                continue

            # Float comparison tolerance for temperature and humidity
            if (key == "temperature" or key == "humidity") and within_tolerance(target_val, member_val):
                continue
                
            # Found deviation
            deviations[key] = member_val

        return cls(
            entity_id=event.data.get("entity_id"), 
            **deviations
        )

    def attributes(self) -> dict[str, Any]:
        """Returns the state attributes excluding metadata like entity_id."""
        data = self.to_dict()
        data.pop("entity_id", None)
        return data
