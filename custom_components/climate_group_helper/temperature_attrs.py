"""Names of the group's climate temperature attributes, old and new scheme.

From Home Assistant 2026.11 the climate base class reads the temperatures from
`_attr_native_*` and logs a notice on every use of the old names; before that, the
`native_*` names do not exist and a value set on them is never read. The integration
supports both, so the names are resolved once here by asking the base class which scheme
it has (not by version number), and every other module goes through `read()` and `write()`
with the constants below. Nothing else writes any of these names as a literal.

The values are the same in both schemes: they come from the members' states and are
already in the unit of the user's system, which is also what the unit attribute reports.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.climate import ClimateEntity

_NATIVE = hasattr(ClimateEntity, "native_current_temperature")


def _attr(name: str) -> str:
    return f"_attr_native_{name}" if _NATIVE else f"_attr_{name}"


CURRENT_TEMPERATURE = _attr("current_temperature")
TARGET_TEMPERATURE = _attr("target_temperature")
TARGET_TEMPERATURE_LOW = _attr("target_temperature_low")
TARGET_TEMPERATURE_HIGH = _attr("target_temperature_high")
TEMPERATURE_UNIT = _attr("temperature_unit")


def read(entity: ClimateEntity, attr: str) -> Any:
    """Return one of the temperature attributes of the entity."""
    return getattr(entity, attr)


def write(entity: ClimateEntity, attr: str, value: Any) -> None:
    """Set one of the temperature attributes of the entity."""
    setattr(entity, attr, value)
