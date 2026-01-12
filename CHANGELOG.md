# Changelog

## 0.14.0 - 2026-01-12

> **⚠️ Major Architecture Update:** This release introduces a fundamental upgrade to the internal "Target State" engine. While the interface remains the same, the brain of the integration is now significantly more robust.

### ♻️ Core Refactoring

*   **Improved Stability**: Completely rewritten how the group tracks its desired state. It now uses a strict "Single Source of Truth" model, which effectively eliminates "ghost" synchronization bugs where the group and devices could drift apart silently.
*   **Robust Synchronization**: The logic for filtering attributes (Selective Sync) has been restructured to be much more robust.

### 🔧 Fixes

*   **Reliability**: Improved handling of rapid-fire command updates to prevent conflicts and race conditions.
*   **Selective Sync**: Fixed an issue where attributes excluded from synchronization might still be enforced in rare "Cold Start" scenarios.
*   **Migration Safe-Mode**: The configuration migration now performs a "Soft Reset" to automatically clean up any legacy data from older versions, ensuring a fresh start for the new engine.

## 0.13.3 - 2026-01-03

### 🔧 Fixes

*   **Sync Mode: Robust Echo Detection (Bounceback Fix)**: Implemented a new history-based mechanism to reliably detect when a device reports back a state change that was originated by the group itself. This solves the "bounceback" loop where the group would mistake its own command echo for a manual user intervention and revert it back.
*   **Sync Stability (Race Conditions)**: The new logic uses a history buffer to correctly identify echoes even if they arrive out of order or interleaved with other events.
*   **Configuration Migration**: Automatically removes deprecated `target_temp_high` and `target_temp_low` attributes from existing configurations to prevent issues in the options menu.

## 0.13.2 - 2026-01-03

### 🔧 Fixes

*   **Sync Mode: Robust Echo Detection (Bounceback Fix)**: Implemented a new history-based mechanism to reliably detect when a device reports back a state change that was originated by the group itself. This solves the "bounceback" loop where the group would mistake its own command echo for a manual user intervention and revert it back.
*   **Sync Stability (Race Conditions)**: The new logic uses a history buffer to correctly identify echoes even if they arrive out of order or interleaved with other events.

## 0.13.1 - 2026-01-01

### 🔧 Fixes

*   **Debounce Logic**: Fixed an issue where new changes occurring during the configured debounce delay did not correctly restart the waiting time. Now, the delay resets with each change, ensuring only the final value is applied after the full debounce time.
*   **Debounce Limit**: Increased the maximum configurable `Debounce Delay` from 3s to 10s to support devices that require longer settling times.

## 0.13.0 - 2025-12-29

### ✨ Configuration 2.0

*   **Menu-Based Configuration**: The overwhelming list of settings is gone! The configuration is now organized into logical categories: **Members**, **Temperature**, **Humidity**, **Timings**, **Sync Mode** and **Other Settings**.

### 🚀 Major Features

*   **Calibration Sync (Write Targets)**: A powerful new feature! The group can now write the calculated external sensor value back to specific number entities (e.g. `number.thermostat_external_input`). This keeps your physical devices aware of the *real* room temperature measured by your external sensors.
*   **Multi-Sensor Support**: Select multiple external sensors for both Temperature and Humidity. The group will calculate the average of all valid sensors to get the perfect room reading.
*   **Selective Attribute Sync**: Power users can now choose *exactly* which attributes should be synchronized in Lock/Mirror modes. Want to sync Temperature but let users set the Fan Mode individually on each device? Now you can.
*   **Split Temperature & Humidity Settings**: You can now configure averaging (Mean, Median, Min, Max) and rounding options separately for Temperature and Humidity.

### ⚡ Improvements & Fixes

*   **Sync-after-Debounce**: Synchronization actions are now strictly subject to the centralized `Debounce Delay`. The group intelligently waits for the system (and your fingers) to settle before enforcing states, preventing network flapping and Zigbee congestion.
*   **Smarter Sync Logic**: The Sync Mode (Lock/Mirror) is now smarter about "User Intent". It prioritizes what you *wanted* to set (Target) over what the group calculated, solving conflicts where the group might have fought against your command.
*   **Simplified Setup**: The initial setup screen now asks only for the Name and Members to get you started quickly. Advanced settings are available via "Configure" after creation.
*   **Unified Timings**: The separate `Sync Retry` and `Sync Delay` settings have been removed. The synchronization logic now uses the robust global `Retry Attempts`, `Retry Delay` and `Debounce` settings, simplifying configuration.

### ⚠️ Breaking Changes

*   **Configuration Migration (v4)**: Your settings will be automatically migrated.
    *   Global averaging/rounding settings are copied to both Temperature and Humidity options.
    *   Legacy sync timing options are removed.
    *   **Note:** Downgrading to previous versions is not supported without restoring a backup.

## 0.12.0 - 2025-12-11

### ✨ Features

*   **External Control Detection**: Introduced the `external_controlled` attribute. This boolean attribute helps automations distinguish between two types of updates:
    *   `true`: The group was updated because a member device was physically changed (Mirror Mode propagation).
    *   `false`: The group was controlled directly by the user (e.g. via Dashboard).
*   **Integration Icons**: Added official integration icons, improving visual consistency within Home Assistant.

### 🔧 Fixes

*   **Improved HomeKit Compatibility**: Enhanced HomeKit integration by implementing `RestoreEntity`. This ensures that `hvac_modes`, `fan_modes`, `preset_modes`, and `supported_features` are restored on startup, preventing issues where HomeKit accessories might incorrectly display limited functionalities (e.g. only "Off" mode).

### 🔀 Changes

*   **Internal Cleanup & Streamlining**: Several outdated or unused internal attributes were removed, and the overall attribute exposure logic was refactored for better clarity and maintainability.

## 0.11.1 - 2025-12-01

### 🔧 Improvements & Refactoring

*   **Sync Mode Optimization**: Refactored the synchronization logic to use a streamlined "Snapshot-on-Demand" strategy. This significantly reduces code complexity and technical debt while maintaining the established reliability of `Lock` and `Mirror` modes.
*   **Clean Shutdown**: Enhanced task management to explicitly cancel background processes when the component stops. This ensures a clean exit and resolves potential "task was destroyed but it is pending" warnings in Home Assistant logs.
*   **Internal Cleanup**: General refactoring of service call handling to improve maintainability.

## 0.11.0 - 2025-11-29

### ⚠️ Important Changes

*   **Refined Retry Logic & Migration**: The configuration for retrying failed commands has been updated.
    *   **Renamed**: "Repeat" is now "Retry" (`Retry Attempts`, `Retry Delay`) to better reflect its purpose.
    *   **Logic Change**: Previously, a value of `2` meant 2 cycles "Execute once + Repeat once". Now, `Retry Attempts: 2` means "Execute once + Retry twice if failed". A value of `0` means "Execute once, no retries".
    *   **Auto-Migration**: Your existing configuration will be automatically migrated. Old "Repeat" values will be decremented by 1 (e.g. old `2` -> new `1`) to preserve the original behavior.

### ✨ Features

*   **Active Sync Enforcement**: The `Lock` and `Mirror` sync modes are now more robust. The group actively monitors member devices and fights deviations for a configured number of attempts (`Sync Retry Attempts`). If a device stubbornly refuses to change (e.g. due to a physical lock or connection loss), the group will eventually "capitulate" and accept the new state to prevent infinite loops and log spam.

*   **Sync Retry Configuration**: You can now specifically configure how many times the group should try to enforce synchronization before giving up (`Sync Retry Attempts`).

*   **Localization**: Updated all translations to reflect the new "Retry" terminology and added descriptions for the new sync settings.

### 🔧 Fixes

*   **Internal Change Handling**: Fixed a bug in `Lock` and `Mirror` modes where user-initiated changes to the group were sometimes mistakenly fought by the sync logic. The group now intelligently waits for members to synchronize before enforcing the new state.

## 0.10.0 - 2025-11-26

> **⚠️ NOTE:** This release involves a comprehensive refactoring of the core logic to implement the new "Sync Mode" features. While extensive testing has been conducted, there might be edge cases or bugs in real-world usage. Please report any issues on GitHub.

### ✨ Features

*   **Advanced Sync Modes**: You can now choose how the group interacts with its members:
    *   **Standard**: The classic behavior. The group aggregates state but doesn't actively interfere with members.
    *   **Lock**: Enforces the group's state. If a member is changed externally (e.g. manually), the group immediately reverts it.
    *   **Mirror**: Adapts to members. If a member is changed externally, the group adopts that change and propagates it to all other members.

*   **Configurable Sync Delay**: A new `Sync Delay` option (0-30s) helps prevent "fighting" between the group and devices. It adds a pause before the group corrects a deviation, giving devices time to settle.

*   **Infinite Loop Prevention**: A safety mechanism detects if a device is permanently refusing commands (e.g. due to connection loss) and stops the group from retrying endlessly to prevent network flooding.

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
    *   **Auto:** A smart strategy that uses 'Off Priority' logic when an active mode (e.g. `heat`) is targeted and 'Normal' logic when `off` is targeted.

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