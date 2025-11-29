# Changelog

## 0.10.0 - 2025-11-26

> **⚠️ NOTE:** This release involves a comprehensive refactoring of the core logic to implement the new "Sync Mode" features. While extensive testing has been conducted, there might be edge cases or bugs in real-world usage. Please report any issues on GitHub.

### ✨ Features

*   **Advanced Sync Modes**: You can now choose how the group interacts with its members:
    *   **Standard**: The classic behavior. The group aggregates state but doesn't actively interfere with members.
    *   **Lock**: Enforces the group's state. If a member is changed externally (e.g., manually), the group immediately reverts it.
    *   **Mirror**: Adapts to members. If a member is changed externally, the group adopts that change and propagates it to all other members.

*   **Configurable Sync Delay**: A new `Sync Delay` option (0-30s) helps prevent "fighting" between the group and devices. It adds a pause before the group corrects a deviation, giving devices time to settle.

*   **Infinite Loop Prevention**: A safety mechanism detects if a device is permanently refusing commands (e.g., due to connection loss) and stops the group from retrying endlessly to prevent network flooding.

*   **Localization**: Added and updated translations for all supported languages (Czech, Danish, German, Spanish, French, Italian, Dutch, Polish, Portuguese, Swedish, Ukrainian, Chinese).

## 0.9.0 - 2025-11-12

### ✨ Features

*   **Reliable Service Calls (Debounce and Retry)**: Introduced a new mechanism to make controlling your climate devices more robust and reliable.
    *   **Debounce**: Prevents overwhelming your devices with rapid commands. When you make quick changes in the UI, the integration now waits for a brief, configurable moment for the changes to stop before sending the final command.
    *   **Intelligent Retry**: Ensures commands are received by your climate device. If the device doesn't update its state after a command is sent, the integration will automatically retry sending it a configurable number of times. This is "intelligent" because it stops retrying as soon as it confirms the state has changed, saving unnecessary network traffic.
    *   **Configuration**: These features can be fine-tuned via the group's options with three new settings: `Debounce Delay`, `Retry Attempts`, and `Retry Delay`.

## 0.8.1 - 2025-10-18

### 🔧 Improvement

*   **Improve HVAC *Action* Logic**: The logic for determining the group's `hvac_action` has been improved to be more robust and predictable. It now follows a clear 4-tier priority system:
    1.  **Active**: The most common active state (`heating`, `cooling`, etc), but not idle or off.
    2.  **Idle**: If no members are active, but at least one is idle.
    3.  **Off**: If no members are active or idle, but at least one is off.
    4.  **None**: As a fallback.

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