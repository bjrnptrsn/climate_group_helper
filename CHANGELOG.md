# Changelog

## 0.24.0 - 2026-04-15

### 🌟 New Features

*   **Main Switch**: A dedicated `switch` entity is now created alongside each Climate Group Helper. Turning it off immediately turns all members off and blocks any further commands — useful for heating-free periods, extended absences, or driving the group from external conditions via automation. Turning it back on restores all members to the current target state.

*   **Override End Time**: A new `active_override_end` attribute exposes the exact expiry time (ISO timestamp) of any active override (Boost or schedule override). Use it in your dashboard to display how long a boost has left.

### 🔧 Fixes

*   **Override Enforcement**: When a blocking source (e.g. window) is active and a member deviates, the configured override action (off or window temperature) is now reliably re-applied to the deviating member.

## 0.23.1 - 2026-04-13

### 🔧 Fixes

*   **Config Flow**: Clearing an optional entity (Schedule Entity, Room Sensor, Zone Sensor) now correctly removes the value — previously the old value was silently retained.

## 0.23.0 - 2026-04-11

### 🌟 New Features

*   **Boost**: A new `climate_group_helper.boost` service temporarily sets the group to a target temperature for a fixed duration. When the time is up, the group automatically returns to the active schedule slot — or, if no schedule is configured, to the state it was in before the boost started.

### 🔧 Fixes

*   **Master Lock — Unavailable Master**: When the Master entity becomes unavailable in `MASTER_LOCK` mode, sync enforcement is now automatically paused and the group falls back to aggregating the remaining members. Enforcement resumes as soon as the Master comes back. A new `master_fallback_active` attribute reflects this state.

*   **Schedule**: Slot transitions now send only the attributes defined in the active slot to member devices. Previously, the full group state was forwarded, which could cause unintended side effects on certain devices (e.g. an implicit mode change triggered by a temperature command).

## 0.22.1 - 2026-04-08

### ✨ Improvements

*   **Schedule Reset via Service**: Calling `set_schedule_entity` with no arguments now always resets to the configured schedule and immediately applies the current slot — even if the same entity was already active. This also cancels any running override timer, making it a reliable "return to schedule" command for automations.

*   **Active Schedule always visible**: The `active_schedule_entity` attribute is now always shown when a schedule entity is configured.

*   **Schedule Override Status**: A new `schedule_override_active` attribute appears while a manual override is active.

## 0.22.0 - 2026-04-06

### ✨ New Features

*   **Member Isolation — Member Off Trigger**: A group member is now automatically isolated when it turns off manually (e.g. via the physical device or a local automation). While isolated, it is excluded from all group commands and calculations. As soon as it turns back on, isolation is released and the group's target state is restored.

### ⚙️ Configuration Changes

*   **"Respect Member Off State" split into two independent options**: You can now configure this separately for **Sync/Lock enforcement** and **Schedule automation**. Previously, a single toggle controlled both.

### 🔧 Fixes

*   **State Restore on Startup**: Fixed a crash (`ValueError`) that could occur after an ungraceful shutdown if a member reported `unavailable` or `unknown` as its HVAC mode when Home Assistant restarted.

## 0.21.1 - 2026-04-03

### 🔧 Fixes

*   **Offline Device Resilience**: Fixed several edge cases where offline devices (`unavailable` / `unknown`) could bypass capability checks due to stale attribute caches, receive unnecessary calibration updates (Battery Saver), or trigger incorrect partial-sync logic. Service calls are now securely prevented from reaching unreachable members.

## 0.21.0 - 2026-04-02

### ✨ New Features

*   **Member Offsets**: Define an individual temperature offset (±20°C, 0.5°C steps) per group member to permanently balance temperature differences between rooms.

### 🔧 Fixes

*   **Out-of-Bounds Sync Lockout**: Members were permanently excluded from sync/schedule updates even after the target temperature moved back into their valid range.
*   **Min Temp Off**: Each device now receives its own minimum temperature when the group turns off, rather than the group's aggregated minimum.

## 0.20.4 - 2026-03-24

### 🔧 Fixes

*   **Calibration**: Calculated values are now clamped to the target entity's `min`/`max` range to prevent out-of-range errors. Especially relevant for Offset mode, where large temperature differences can exceed a device's hardware limits. A warning is logged when clamping occurs.

## 0.20.3 - 2026-03-14

### ✨ New Features

*   **Member Isolation — HVAC Mode Trigger**: Isolation can now optionally be triggered by the group's HVAC mode. When the group's target mode matches one of the configured trigger modes (e.g. `cool`), the isolated members are turned off and excluded from all group calculations. They are automatically restored when the mode changes away from the trigger set.

### 🔧 Fixes

*   **Sensor Selectors**: The **Isolation Sensor**, **Room Sensor**, and **Zone Sensor** fields now also accept `input_boolean` entities in addition to `binary_sensor`. This allows automations or manual helpers to be used directly as triggers without an additional template sensor.

## 0.20.2 - 2026-03-13

### 🔧 Fixes

*   **Setpoint Restoration**: Fixed an issue where thermostats would stay at the low "Frost Protection" temperature (e.g. 5°C) after turning the group back on. The target temperature is now correctly restored immediately upon activation.
*   **Startup Leak Prevention**: Sealed the initial synchronization block to strictly prevent unintended member updates during Home Assistant startup.
*   **State Restoration Hardening**: Improved the "Last Active HVAC Mode" memory to ensure the group correctly remembers its previous mode even if restarted while `off`.

## 0.20.1 - 2026-03-12

### 🔧 Fixes

*   **Member Isolation**: Fixed a crash (`TypeError: unhashable type: 'list'`) that occurred when controlling a group with Member Isolation configured.

## 0.20.0 - 2026-03-11

### 🌟 New Features

*   **Member Isolation**: Isolate specific group members when a binary sensor (e.g. a curtain sensor) is active. After an optional delay, isolated members are turned `off` and excluded from all group calculations. They are automatically restored (after an optional restore delay) when the sensor deactivates. Configure via the new **Member Isolation** section in the options flow.

*   **Union Temperature Limits**: The **Union** feature strategy now exposes the full temperature range across all members (widest min/max). When a target temperature falls outside a member's supported range, the new **Out-of-Bounds Action** determines what happens: **Off** (default) turns the member off, **Clamp** sets it to its nearest supported limit. Members are automatically restored when the temperature moves back into range.

## 0.19.5 - 2026-03-03

### ✨ New Features

*   **Schedule Persistence**: The active schedule entity set via the `set_schedule_entity` service can now optionally survive Home Assistant restarts. Enable the new **"Retain Schedule Override"** option in the Schedule section to persist the active schedule across restarts. When disabled (default), the group reverts to the configured default schedule on restart.

## 0.19.4 - 2026-02-25

### 🔧 Fixes

*   **Window Control**: Turning the group `OFF` (e.g. via dashboard or automation) is now always possible while a window is open, even if the "Adopt Manual Changes" option is disabled.
*   **Target Temperature**: Fixed an issue where minor, hardware-related temperature fluctuations on some thermostats could trigger unnecessary synchronization loops.
*   **Schedule**: Fixed a bug where a temporary user override could be prematurely cancelled under certain configurations.

## 0.19.3 - 2026-02-23

### 🎨 UI & UX Changes

*   **UI Menu Sections**: Reorganized the configuration menu into collapsible sections for better clarity.
*   **Expand Sections Option**: Option to expand all menu sections by default.

## 0.19.2 - 2026-02-21

### 🔧 Fixes

*   **Service Call Filtering**: Improved handling of groups with mixed hardware (e.g. ACs and simple TRVs).
    *   Commands for Presets, Fan, or Swing modes are now strictly filtered to only target members that support the specific feature and value. This resolves potential errors in Home Assistant logs when using the `Union` feature strategy.

## 0.19.1 - 2026-02-20

### ✨ New Features

*   **Calibration Battery Saver**: The group can now automatically pause calibration updates for member devices that are currently turned off. This reduces unnecessary radio traffic and conserves the battery life of sleeping devices (especially during the summer months when heating is off).
*   **Translations**: Added Slovak (`sk`) translation support.

### 🔧 Fixes

*   **UI Responsiveness & Flicker**: Resolved UI bouncing issues when rapidly clicking buttons. This was achieved through a two-layered defense:
    *   A new 3-second optimistic "Grace Period" instantly reflects your changes on the dashboard while integrations catch up.
    *   A robust safety mechanism that actively detects and aborts older, delayed commands in the background so they don't overwrite your newest inputs.
*   **Window Control Bypass**: Fix to ensure that open windows correctly block all manual changes except for explicit `OFF` commands.

### 🎨 UI Changes

*   **Config Flow Update**: Merged the "Timings" and "Other Settings" menus into a single **"Advanced Settings"** step.

## 0.19.0 - 2026-02-18

### 🌟 New Features

*   **Master Entity & Sync Logic**:
    *   **Master Entity Support**: Designate a single member as the **Leader**. The group follows this device's target state instead of calculating averages.
    *   **New Sync Mode `MASTER_LOCK`**: Changes on the Master are mirrored to the group, while changes on other members are reverted (Lock).

*   **Window Control**:
    *   **Adopt Manual Changes**: New option to adopt manual temperature changes made while a window is open.
    *   **Window Action "Set Temperature"**: Optionally set a specific temperature instead of turning `OFF` when a window opens.

*   **Dynamic Scheduling**:
    *   **Service `set_schedule_entity`**: Switch the active schedule entity at runtime via service call (e.g. for presence-based updates or vacation modes).

### 🚀 Optimizations

*   **Optimized Calibration**: Optimized logic with smart filtering, strict tolerance, and heartbeat to reduce Zigbee traffic.

*   **State Attributes**: By default, only essential attributes are exposed. Use the new `expose_config` option if you want to see all settings for debugging.

## 0.18.2 - 2026-02-05

### 🔧 Device Compatibility Fixes
*   **Min Temp Off Option**: Fixed compatibility with devices that ignore temperature updates when off.
*   **Window Control**: Fixed state restoration for devices that do not report `off` (e.g. Danfoss Ally).

## 0.18.1 - 2026-02-04

### ✨ Improvements
*   **Window Control Visibility**: New `blocking_reason` state attribute shows `window_open` when window control is active.
*   **Config Flow Validation**: Prevents setting calibration targets without external sensors.
*   **Cleaner UI**: Shortened descriptions steps for better readability.

## 0.18.0 - 2026-01-31

### 🚀 Scheduler & Timers
*   **Resync Interval:** Periodically enforce the scheduled state to fix drifting devices.
*   **Override Duration:** Manual changes are temporary. The group automatically returns to the schedule after a configured duration (e.g. 60 min).
*   **Sticky Override:** Manual changes persist until the override expires, ignoring background schedule updates.

### 🌡️ Advanced Calibration
*   **New Modes:** Added `Offset` and `Scaled` (x100) support for better TRV compatibility.
*   **Heartbeat:** Periodically re-syncs calibration values to prevent timeouts (e.g. Aqara/Sonoff).

## 0.17.0 - 2026-01-23

### ✨ New Feature

*   **Better TRV Support**: New option to send the minimum temperature (e.g. 5°C) when turning the group off. This ensures valves (like Aqara) close completely.

### 🛡️ Improvements

*   **Stability and Reliability**: Comprehensive internal redesign to make integration more reliable and easier to maintain.
*   **Conflict Prevention**: Logic overhaul to prevent conflicts between Schedules, Window Control, and User Commands.
*   **Startup State**: Restored values are now correctly displayed immediately after a restart.

## 0.16.1 - 2026-01-19

### 🔧 Robustness & Sync Stability (Major Fixes)
This patch release focuses on fixing race conditions and sync-loops.

- **Sender Wins Strategy:** Now correctly identifies the "Origin" entity for every command to prevent passive members from overwriting the group state with old data.
- **Dirty Echo Protection:** Strictly ignores values from members that don't match the valid order, preventing feedback loops.
- **Split-Brain Fix:** Fixed an edge case where Side Effects (like a thermostat acting on its own logic) broke the enforcement loop.

### ✨ New Features
- **Partial Sync:**
  - **Ignore Off Members**: Allows turning off individual rooms without the Group forcing them back on.
  - **Last Man Standing:** If you turn off the *last* active room, the Group switch to off.

## 0.16.0 - 2026-01-16

### 🚀 New Features
- **Schedule Helper Integration**: Native support for Home Assistant `schedule` entities. Automate your climate group's temperature and mode directly via a schedule helper.

- **Window Control (Redesigned)**: Simplified and more robust logic. Opening a window now directly forces members off while maintaining the group's target state. Closing the window instantly restores the group's intended state.

- **Source-Aware State Management**: The group now distinguishes between changes from users, schedules, window control and sync mode to prevent conflicts and loops.

### 🧹 Improvements
- **Simplified Configuration**: Removed complex "Restore Source" and "Window Snapshot" options in favor of a "just works" standard behavior.

- **Robustness**: Significantly improved stability in complex scenarios (rapid changes, sync conflicts).

- **Migration**: Automatic migration to Config Version 6 ensures your settings are always valid and up-to-date.

> [!IMPORTANT]
> Please check your configuration after update, as some advanced options were removed/consolidated.

## 0.15.0 - 2026-01-14

> **✨ Window Control:** Automatically turn off heating when windows open and restore it when they close!

### 🚀 Major Features

*   **Window Control**: The group can now monitor window sensors and automatically shut down heating when windows are opened.
    *   **Dual Sensor Support**: Configure a "Room" sensor (fast reaction, 15s default) and/or a "Zone" sensor (slow reaction, 5min default).
    *   **Configurable Delays**: Set custom delays for window open and close events to avoid flickering.
    *   **State Restoration**: When all windows close, the group restores the previous state from a snapshot. You can configure which attributes to restore.
    *   **Default HVAC Mode**: Configure a fallback HVAC mode for restoration after restart (when no snapshot exists).
    *   **User Blocking**: Prevents manual heating activation while windows are open.

*   **Window Control + Sync Mode Stability**: Context-based echo suppression ensures that Window Control and Sync Mode (Lock/Mirror) work together without conflicts.

### 📝 Configuration

*   **New Steps**: Two new configuration steps in the options menu:
    *   **Window Control**: Configure sensors, delays, and enable/disable the feature.
    *   **Window Control Snapshot**: Select which attributes to restore and set a default HVAC mode.

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