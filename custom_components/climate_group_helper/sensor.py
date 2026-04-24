"""Support for Climate Group sensors."""
from __future__ import annotations

from typing import Any
import json
import logging

from homeassistant.components.climate import ATTR_CURRENT_HUMIDITY, ATTR_CURRENT_TEMPERATURE
from homeassistant.components.sensor import (
    EntityCategory,
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.entity_registry import async_get as async_get_entity_registry
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    ATTR_SETTINGS_JSON,
    CONF_EXPOSE_CONFIG,
    CONF_EXPOSE_SMART_SENSORS,
    DOMAIN,
    ENTITY_SELECTOR_KEYS,
    IDENTITY_KEYS,
    MEMBER_LIST_KEYS,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up climate group sensors based on climate group state."""
    entity_registry = async_get_entity_registry(hass)
    climate_group_entity_id = entity_registry.async_get_entity_id("climate", DOMAIN, config_entry.unique_id)

    if not climate_group_entity_id:
        _LOGGER.warning("[%s] Climate group entity not found for config entry", config_entry.title)
        return

    # Initial entities to add
    new_entities = []

    # Handle Smart Sensors lifecycle
    if not config_entry.options.get(CONF_EXPOSE_SMART_SENSORS, False):
        # Clean up existing entities if they were previously enabled
        for sensor_type in ["temperature", "humidity"]:
            entity_id = entity_registry.async_get_entity_id("sensor", DOMAIN, f"{config_entry.unique_id}_{sensor_type}")
            if entity_id:
                entity_registry.async_remove(entity_id)
                _LOGGER.debug("[%s] Removed disabled sensor %s", config_entry.title, entity_id)
    else:
        # Keep track of already added sensors
        added_sensors = set()

        @callback
        def async_add_sensors(state):
            """Check climate group state and add sensors if not added yet."""
            if not state:
                return

            dynamic_sensors = []

            # Add temperature sensor
            if ("temperature" not in added_sensors and state.attributes.get(ATTR_CURRENT_TEMPERATURE) is not None):
                dynamic_sensors.append(ClimateGroupTemperatureSensor(hass, config_entry, climate_group_entity_id))
                added_sensors.add("temperature")
                _LOGGER.debug("[%s] Adding temperature sensor", config_entry.title)

            # Add humidity sensor
            if ("humidity" not in added_sensors and state.attributes.get(ATTR_CURRENT_HUMIDITY) is not None):
                dynamic_sensors.append(ClimateGroupHumiditySensor(hass, config_entry, climate_group_entity_id))
                added_sensors.add("humidity")
                _LOGGER.debug("[%s] Adding humidity sensor", config_entry.title)

            if dynamic_sensors:
                async_add_entities(dynamic_sensors)

        # Initial check
        async_add_sensors(hass.states.get(climate_group_entity_id))

        # Listen for state changes to add sensors later
        config_entry.async_on_unload(
            async_track_state_change_event(
                hass,
                climate_group_entity_id,
                lambda event: async_add_sensors(event.data.get("new_state")),
            )
        )

    # Handle Configuration Sensor lifecycle
    if config_entry.options.get(CONF_EXPOSE_CONFIG, False):
        new_entities.append(ClimateGroupConfigurationSensor(hass, config_entry))
        _LOGGER.debug("[%s] Adding configuration sensor", config_entry.title)
    else:
        # Clean up existing entity if it was previously enabled
        entity_id = entity_registry.async_get_entity_id("sensor", DOMAIN, f"{config_entry.unique_id}_configuration")
        if entity_id:
            entity_registry.async_remove(entity_id)
            _LOGGER.debug("[%s] Removed disabled configuration sensor %s", config_entry.title, entity_id)

    if new_entities:
        async_add_entities(new_entities)


class ClimateGroupBaseSensor(SensorEntity):
    """Base class for a climate group sensor."""

    _attr_has_entity_name = True

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        climate_group_entity_id: str,
    ):
        """Initialize the sensor."""
        self.hass = hass
        self.config_entry = config_entry
        self._attr_has_entity_name = True
        self._attr_should_poll = False
        self._climate_group_entity_id = climate_group_entity_id
        self._climate_group_state = None

    async def async_added_to_hass(self) -> None:
        """Register callbacks."""
        await super().async_added_to_hass()

        self._climate_group_state = self.hass.states.get(self._climate_group_entity_id)

        @callback
        def state_changed_listener(event):
            """Handle state changes."""
            if (new_state := event.data.get("new_state")) is None:
                return
            self._climate_group_state = new_state
            self.async_write_ha_state()

        self.async_on_remove(
            async_track_state_change_event(
                self.hass, [self._climate_group_entity_id], state_changed_listener
            )
        )

    @property
    def device_info(self) -> dict[str, Any]:
        """Return the device info."""
        return {
            "identifiers": {(DOMAIN, self.config_entry.unique_id)},
            "name": self.config_entry.title,
            "manufacturer": "Climate Group Helper",
        }


class ClimateGroupTemperatureSensor(ClimateGroupBaseSensor):
    """Representation of a climate group temperature sensor."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        climate_group_entity_id: str,
    ):
        """Initialize the sensor."""
        super().__init__(hass, config_entry, climate_group_entity_id)
        self._attr_translation_key = "temperature"
        self._attr_unique_id = f"{config_entry.unique_id}_temperature"
        self._attr_native_unit_of_measurement = hass.config.units.temperature_unit

    @property
    def native_value(self):
        """Return the state of the sensor."""
        if not self._climate_group_state:
            return None
        
        value = self._climate_group_state.attributes.get(ATTR_CURRENT_TEMPERATURE)
        
        if value is not None and not isinstance(value, (int, float)):
            _LOGGER.debug("[%s] Invalid temperature value for %s: %s", self.entity_id, self.entity_id, value)
            return None
        
        return value


class ClimateGroupHumiditySensor(ClimateGroupBaseSensor):
    """Representation of a climate group humidity sensor."""

    _attr_device_class = SensorDeviceClass.HUMIDITY
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        climate_group_entity_id: str,
    ):
        """Initialize the sensor."""
        super().__init__(hass, config_entry, climate_group_entity_id)
        self._attr_translation_key = "humidity"
        self._attr_unique_id = f"{config_entry.unique_id}_humidity"

    @property
    def native_value(self):
        """Return the state of the sensor."""
        if not self._climate_group_state:
            return None
        
        value = self._climate_group_state.attributes.get(ATTR_CURRENT_HUMIDITY)
        
        if value is not None and not isinstance(value, (int, float)):
            _LOGGER.debug("[%s] Invalid humidity value for %s: %s", self.entity_id, self.entity_id, value)
            return None
        
        return value


class ClimateGroupConfigurationSensor(SensorEntity):
    """Representation of a climate group configuration sensor."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
    ):
        """Initialize the sensor."""
        self.hass = hass
        self.config_entry = config_entry
        self._attr_translation_key = "configuration"
        self._attr_unique_id = f"{config_entry.unique_id}_configuration"

    @property
    def device_info(self) -> dict[str, Any]:
        """Return the device info."""
        return {
            "identifiers": {(DOMAIN, self.config_entry.unique_id)},
            "name": self.config_entry.title,
            "manufacturer": "Climate Group Helper",
        }

    @property
    def native_value(self) -> int:
        """Return the configuration version."""
        return self.config_entry.version

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the configuration as portable JSON."""
        excluded = IDENTITY_KEYS | MEMBER_LIST_KEYS | ENTITY_SELECTOR_KEYS
        portable_config = {
            key: value
            for key, value in self.config_entry.options.items()
            if key not in excluded
        }
        return {ATTR_SETTINGS_JSON: json.dumps(portable_config)}

