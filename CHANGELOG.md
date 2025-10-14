# Changelog

## 0.8.0 - 2025-10-15

### ✨ Features

*   **Expose Attributes as Sensors**: You can now enable a new option to create separate `sensor` entities for the group's aggregated temperature and humidity.
    *   This is especially useful for history tracking and for using these values in automations, even when an external temperature sensor is configured for the group.

### 🔧 Improvement

*   **Consistent UI Order**: The various modes (fan, preset, swing) for the group entity are now sorted alphabetically, providing a more predictable user interface.

## 0.7.3 - 2025-10-09

### 🔧 Fixes

*   Initialize entity with default `min/max_temp` and
     `min/max_humidity` values to prevent a race condition at startup.

## 0.7.2 - 2025-10-08

### 🔧 Fixes

*   Fix a bug where preset modes, fan modes, and swing modes could be wiped out by the HVAC mode sorting logic.

## 0.7.1 - 2025-10-06

### 🔧 Fixes

*   Fix a variable assignment issue in the options flow to prevent potential errors during configuration.
*   Correctly sort HVAC modes to ensure consistent order.

## 0.7.0 - 2025-10-02

### ✨ Features

*   **Split Averaging Methods**: The single temperature averaging option has been split into two separate settings, providing more granular control over how the group calculates its values:
    *   **Averaging for Current Values**: Determines how the group's *current* temperature and humidity are calculated from its members.
    *   **Averaging for Target Values**: Independently determines how the group's *target* temperature and humidity are calculated.

*   Configuration for existing users is automatically migrated to the new settings.

## 0.6.1 - 2025-09-24

### 🔧 Fixes
*   Improved reliability of service calls

*   `climate.set_temperature` now targets precisely the entities that should receive a command, which is essential for groups with mixed capabilities. Calls are separated by:
    * `temperature`
    * `target_temp_high` / `target_temp_low`
    * `hvac_mode`


## 0.6.0 - 2025-09-22

### ✨ Features

*   **External Temperature Sensor**: It is now possible to select an external temperature sensor to override the group's current temperature. The sensor can be added or removed at any time via the group's options.

*   **Feature Grouping Strategy**: A new option has been added to control how features (like fan modes, swing modes, presets) are combined from member devices. You can now choose between:
    *   `Intersection`: Only features supported by *all* devices are exposed.
    *   `Union`: All features supported by *any* device are exposed. Service calls are now intelligently routed only to the members that support the specific command.

## 0.5.1 - 2025-09-12

### 🔧 Fixes

*   Correctly determine climate group sync status.

### 🔀 Changes

*   Renamed the `current_member_hvac_modes` attribute to `current_hvac_modes` for consistency.

## 0.5.0 - 2025-09-09

### ✨ Features

*   **New HVAC Mode Strategy**: Replaces the "Prioritize 'Off' Mode" toggle with a new selector to provide more control over the group's HVAC mode. This is designed to make automations more reliable. The available strategies are:
    *   **Normal (Default):** The group's mode is the most frequent mode among its active members.
    *   **Off Priority:** The group's mode will be `off` if any member is `off`. This matches the behavior of the old "Prioritize 'Off' Mode" setting.
    *   **Auto:** A smart strategy that uses 'Off Priority' logic when an active mode (e.g., `heat`) is targeted and 'Normal' logic when `off` is targeted.

*   Configuration for existing users is automatically migrated to the new setting.

### 🔧 Fixes

*   Corrected a bug in the calculation for the "most common" HVAC mode and HVAC action

*   Repaired syntax errors in some translations.

## 0.4.0 - 2025-09-08

*   Add new state attributes to provide more insights into the group's state:
    *   `group_in_sync`: Indicates if all member entities are in sync with the target HVAC mode.
    *   `current_member_hvac_modes`: A list of current HVAC modes of the member entities.
    *   `target_hvac_mode`: The last HVAC mode that was requested for the group entity.

## 0.3.0 - 2025-09-07

### ✨ Features

*   Add option to prioritize 'Off' HVAC Mode.

## 0.2.0 - 2025-09-06

### ✨ Features

*   Add option to expose member entities as a state attribute.

*   Add translations for German, Spanish, French, Italian, Dutch, Polish, Portuguese, Ukrainian and simplified Chinese.

## 0.1.0 - 2025-09-05

Initial Release of the Climate Group Helper for Home Assistant.

This integration allows you to group multiple climate entities into a single, controllable entity.
It's designed to simplify climate control across multiple rooms or devices by synchronizing HVAC modes and target temperatures. The integration is fully configurable through the Home Assistant UI.

### ✨ Features

*   Group Climate Entities: Combine any number of climate entities into one group.

*   Synchronized Control: Change the HVAC mode and target temperature for all devices in the group simultaneously.

*   Aggregated Temperature: The group's current temperature is calculated as an average of the member temperatures.

*   Flexible Averaging: Choose between Mean, Median, Minimum, or Maximum for temperature averaging.

*   Temperature Rounding: Configure temperature precision to Exact, Half Degree (0.5°), or Whole Numbers (1°).

*   UI Configuration: Fully configured via the "Helpers" menu in Home Assistant. No YAML required.

*   Dynamic Updates: Modify group members and options without restarting Home Assistant.