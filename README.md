# Climate Group Helper

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/icon@2x.png" alt="Climate Group Helper Icon" width="192"/>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Default-orange.svg" alt="HACS"/></a>
  <a href="https://github.com/bjrnptrsn/climate_group_helper/releases"><img src="https://img.shields.io/github/v/release/bjrnptrsn/climate_group_helper" alt="Release"/></a>
</p>

A comprehensive climate management system for Home Assistant that combines multiple devices into a single, powerful entity. Simplify your dashboard, streamline automations, and ensure perfect comfort across entire rooms or zones.

> [!TIP]
> The features **Window Control**, **Scheduling**, and **Device Calibration** can also be used for **single devices**, providing significant added value even without a group.

## Table of Contents

- [Core Capabilities (Simple Mode)](#core-concept-the-unified-foundation)
- [Advanced Features](#power-user-advanced-features)
  - [Master Entity](#master-entity)
  - [External Sensors](#external-sensors)
  - [Device Calibration](#device-calibration)
  - [Sync Modes](#advanced-sync-modes)
  - [Window Control](#window-control)
  - [Presence Control](#presence-control)
  - [Schedule Automation](#schedule-automation)
  - [Member Offsets](#member-offsets)
  - [Member Isolation](#member-isolation)
  - [Main Switch](#main-switch)
  - [Group Offset](#group-offset)
- [Configuration Options](#configuration-options)
- [Services](#services)
- [Installation](#installation)
- [Setup](#setup)
- [Troubleshooting](#troubleshooting)

## Core Concept: The Unified Foundation

The Climate Group Helper provides a robust "Single Source of Truth" for your climate devices. It creates a unified management layer that ensures your devices work together as one cohesive system while maintaining accurate room states.

### Core Capabilities (Simple Mode)

These features are active by default and provide a streamlined "Plug & Play" experience:

*   **Unified Control:** Change settings on the group, and all member devices update to match. No more managing multiple thermostats individually.
*   **Smart State Aggregation:** The group calculates the **average** of member readings to represent the true room state (Mean, Median, Min, or Max).
*   **HVAC Strategy:** Intelligent logic to determine the group's state (Normal, Off Priority, or Auto).
*   **Precision & Rounding:** Round target temperatures to device-compatible steps (0.5° or 1°) to ensure compatibility with all hardware.

---

## Power User: Advanced Features

Unlock the full potential of your climate system. These specialized features are enabled by toggling **Advanced Features** in the group's configuration. Toggling back to Simple Mode hides these options and puts the features into **hibernation** — they stop running functionally, but your configuration remains intact and will be immediately restored when you switch back.

> [!NOTE]
> **New groups start in Simple Mode.** Existing groups upgraded from earlier versions keep **Advanced Features** active automatically so nothing breaks.

### Master Entity

Designate a single climate member as the **Reference Point** or **Leader** for the group. This is the first thing you configure in the setup wizard — and once set, it unlocks additional options in every subsequent step (Sync Mode, Window Control, and Temperature/Humidity averaging).

*   **Centralized Target State:** Use the Master's target settings (temperature, humidity) as the group's goal, rather than calculated averages across all members.
*   **Hierarchical Sync (Master/Lock):** Enables a "Follow the Leader" sync mode. Changes on the Master are mirrored to all members; manual changes on other members are automatically reverted.
*   **Intelligent Window Control:** If enabled, only manual adjustments on the Master update the target state while windows are open. Changes on other devices remain ignored.

### External Sensors

Use **multiple external sensors** for temperature and humidity to override member readings, and optionally write the values back to TRV calibration targets.

### Device Calibration

Write the external sensor value back to your TRVs to fix their internal temperature reading.

*   **Modes:** Absolute (Standard), Offset (Delta calculation), and Scaled (x100 for Danfoss Ally).
*   **Heartbeat:** Periodically re-sends the calibration value to prevent sensor timeouts on Zigbee devices.
*   **Battery Saver (Ignore Off):** Prevent sending constant calibration updates to wireless TRVs that are currently turned `off`.

### Advanced Sync Modes

Controls what happens when a member device is changed directly (e.g. via its own app or physical buttons) — not when you control the group itself.

*   **Disabled:** Member changes are ignored. Only direct group commands apply.
*   **Mirror:** A change on any member is applied to all other members.
*   **Lock:** Any manual change on a member is reverted back to the group target.
*   **Master/Lock:** *(Requires Master Entity)* "Follow the Leader" mode — changes on the Master are mirrored to all members, while manual changes on other members are reverted.
*   **Selective Attribute Sync:** Choose **exactly** which attributes to sync (e.g. sync temperature but allow individual fan control).
*   **Partial Sync (Respect Off):** Prevents the group from waking up members that are manually turned `off`.
    *   **Ignore Off Members:** If a member is turned `off`, the group will not force it back on during synchronization or scheduled changes (allows "Soft Off"). Configurable separately for Sync and Schedule.
    *   **Last Man Standing:** Only when the *last* active member is turned `off`, the Group accepts this change and updates its internal **Target State** to `off`.

### Window Control

Binary sensor support to automatically turn off heating when a window opens and restore it when it closes.

*   **Room + Zone Sensors:** Supports fast-reacting room sensors vs. slow-reacting zone sensors (e.g. for whole floors).
*   **Configurable Delays:** Set custom reaction times for opening and closing.
*   **Window Action:** Choose between full `off` or a configurable temperature setpoint.
*   **Blocking:** While windows are open, manual changes are blocked. Schedule changes are accepted internally and applied when windows close.
*   **Adopt Manual Changes:** Optionally allow passive tracking:
    *   **Off (Default):** All manual changes are blocked and discarded.
    *   **All:** Any manual change updates the target state. Applied when windows close.
    *   **Master Only:** *(Requires Master Entity)* Only changes on the Master update the target state.

### Presence Control

Manage climate settings based on room presence. Select one or more presence triggers (binary sensor, device tracker, or person), configure an away and a return delay, and specify the fallback action to perform when absence is detected. The group is considered occupied if **any** sensor reports presence.

*   **Turn Off:** Members are turned `off` while absence is detected (default).
*   **Away Offset** Target temperature is reduced by a fixed offset (e.g. −2°C). The offset is applied relative to the group's *current target temperature*. If a schedule is active, it automatically tracks schedule changes during absence.
*   **Away Temperature:** Members are set to a fixed absolute temperature.
*   **Away Preset:** A preset mode is sent to members that support it.

Optionally restrict presence detection to specific **zones** (e.g. ensuring a person is only counted as present when they are actually in the 'Home' zone, preventing triggers while they are at 'Work' or elsewhere). When presence is detected again, the group restores all members to the current target state. Window Control and the Main Switch always take priority — Presence Control defers to them if either is active at the same time.

### Schedule Automation

Integrate native HA `schedule` helpers to automate your climate settings per time slot.

*   **Time Slots:** Set temperature and HVAC mode directly in the schedule's data.
*   **Dynamic Control:** Switch schedules on the fly via service call (e.g. for "Vacation" or "Guest" modes). Calling the service with no arguments always resets to the configured default and re-applies the current slot — useful as a "return to schedule" command from automations.
*   **Manual Overrides:** Stay in control. Set an **Override Duration** to automatically return to the schedule after manual adjustments.
*   **Sticky Override (Persist Changes):** If enabled, schedule changes are ignored while the override is active.
*   **Periodic Resync:** Force-sync all members every X minutes to ensure they match the target state.
*   **Schedule Persistence:** Optionally retain a schedule switched via service call across Home Assistant restarts.
*   **Window Aware:** If a schedule changes while windows are open, the new target is applied immediately when windows close.
*   **Status Attributes:** `active_schedule_entity` always shows the currently active schedule. `active_override` shows the name of the active override (e.g. `boost` or `schedule_override`). `active_override_end` shows the ISO timestamp when the active override expires — useful for dashboard displays.
*   **Boost:** Temporarily override the group to a target temperature for a set duration. Restores automatically to the active schedule slot or the previous target state when the timer expires.

### Schedule Configuration Example

1. Create a **Schedule Helper** in Home Assistant (Settings > Devices & Services > Helpers).
2. Open the schedule and add your time slots.
3. **Crucial:** Each slot needs **additional data** to tell the group what to do.
   - Click on a time block to edit it.
   - Expand **Advanced settings**.
   - Enter your desired state in the **Additional data** field.

**Example (Additional data for a single slot):**
```yaml
hvac_mode: heat
temperature: 21.5
```

You can omit attributes you don't need — for example, use only `hvac_mode: "off"` for a slot that turns heating off.

**Supported climate attributes:**

| Attribute | Example value | Notes |
|---|---|---|
| `hvac_mode` | `heat`, `cool`, `off` | Depends on your devices |
| `temperature` | `21.5` | Single setpoint |
| `target_temp_low` | `19.0` | Lower bound (dual setpoint) |
| `target_temp_high` | `24.0` | Upper bound (dual setpoint) |
| `humidity` | `50` | Target humidity (%) |
| `preset_mode` | `eco`, `comfort` | Device-specific |
| `fan_mode` | `auto`, `high` | Device-specific |
| `swing_mode` | `on`, `off` | Device-specific |
| `swing_horizontal_mode` | `on`, `off` | Device-specific |

**Schedule Meta-Keys** — these control the group itself rather than its members, and are active for the entire duration of the slot:

| Key | Possible values | Example | Effect |
|---|---|---|---|
| `turn_off` | `true` | `turn_off: true` | Activates the Main Switch block — all members are turned off for the slot duration. Equivalent to toggling the Main Switch off. Members are restored automatically when the slot ends or a new slot without `turn_off` begins. |
| `sync_mode` | `disabled`, `lock`, `mirror`, `master_lock` | `sync_mode: disabled` | Temporarily overrides the configured Sync Mode for the slot duration. Useful for slots where you want members to be left alone (e.g. a "sleep" slot where manual adjustments are allowed). |
| `group_offset` | Float −5.0 … 5.0 | `group_offset: 1.5` | Temporarily sets the Group Offset for the slot duration. If you move the offset slider manually while this slot is active, your value takes over and the slot-end reset is skipped. |

**Example — night slot that turns everything off:**
```yaml
turn_off: true
```

**Example — comfort slot that boosts all rooms by 1.5 °C above the preset setpoint and allows local adjustments:**
```yaml
preset_mode: comfort
group_offset: 1.5
sync_mode: disabled
```
The group normally runs in Lock mode. During this slot, `sync_mode: disabled` lets occupants tweak their own device without being reverted — useful when comfort preferences vary.

### Member Offsets

Apply a permanent individual offset (±20°C, 0.5°C steps) to each group member, so rooms can run proportionately warmer or cooler than the group's target setting — without changing what you set on the group entity itself.

*   **Example:** Group target is 21°C. Bedroom has offset −1°C → receives 20°C. Living Room has offset +0.5°C → receives 21.5°C.
*   **Mirror / Master-Lock aware:** When a member change is adopted back into the group's target state, the offset is reversed so the global target stays consistent.
*   **Correct member offset (default: on):** The group subtracts each member's offset before averaging, so the displayed temperature reflects the logical setpoint rather than the hardware-adjusted member average.

### Member Isolation

Temporarily isolate specific group members based on a configurable trigger. Isolated members are turned `off` and excluded from all group calculations (temperature averaging, HVAC mode, sync).

**Trigger modes:**
*   **Binary Sensor:** Isolation activates when a binary sensor turns ON (e.g. a curtain sensor, an occupancy helper). Deactivates when the sensor turns OFF.
*   **HVAC Mode:** Isolation activates when the group's target mode matches a configured set (e.g. isolate radiators when the group switches to `cool`).
*   **Member Off:** A member is isolated automatically when it turns `off` manually. When it turns back on, isolation is released and the member is restored to the group's target state.

**Optional delays:** Configure an activate delay and a restore delay for Sensor and HVAC Mode triggers.

*   **Window Control Interaction:** Isolated members are never touched by Window Control — neither on open nor on close. If a window is open when isolation deactivates, the restore is deferred until the window closes.
*   **Constraints:** At least one member must remain active — you cannot isolate all members. The section is hidden when the group has only one member.

### Main Switch

A dedicated `switch` entity is created alongside each Climate Group Helper. It acts as a **master on/off switch** for the entire group.

*   **Switch OFF:** All members are immediately turned `off`. Any active Override is aborted. The group stays blocked until the switch is turned back on.
*   **Switch ON:** All members are restored to the group's current target state.

Useful for heating-free periods (e.g. summer months), extended absences, or any situation where you want the group completely disabled without touching your schedules or target settings. Combine with an automation to drive it from a calendar, a helper, or any other condition.

### Group Offset

A `number` entity (slider −5.0°C to +5.0°C, step 0.5°C) is created alongside each Climate Group Helper. Use it to make a room run a little warmer or cooler — without touching your schedule or target settings.

*   **Example:** Your schedule runs 20°C in the morning and 22°C in the evening. You slide the offset to +1.5°C — members now follow 21.5°C and 23.5°C respectively, all day long, without touching the schedule. Slide back to 0 when no longer needed.
*   **Non-destructive:** The schedule, target state, and Boost temperature are all unaffected. The offset is a layer on top.
*   **Auto-reset:** Setting a temperature directly on the group (via UI or service) resets the offset to 0 automatically.
*   **Persisted:** The offset survives Home Assistant restarts.

## Configuration Options

### Members & Group Behavior

| Option | Description |
|--------|-------------|
| **Master Entity** | Designate one member as the group's Leader. Enables Master/Lock sync mode, Master-aware window tracking, and centralized temperature/humidity target. |
| **HVAC Mode Strategy** | How the group reports its combined mode. See table below. |
| **Feature Strategy** | Which features the group exposes. See table below. |

### HVAC Mode Strategy

| Strategy | Behavior |
|----------|----------|
| **Normal** | Group shows most common mode. Only `off` when all are off. |
| **Off Priority** | Group shows `off` if *any* device is off. |
| **Auto** | Smart switching between Normal and Off Priority. |

### Feature Strategy

| Strategy | Behavior |
|----------|----------|
| **Intersection** | Features (e.g. Fan) supported by *all* devices. Safe mode. Temperature range is the narrowest common window across all members. |
| **Union** | Features supported by *any* device. Temperature range spans the full range across all members (widest min/max). When a target temperature falls outside a member's supported range, the configured **Out-of-Bounds Action** applies. |

### Out-of-Bounds Action *(Union only)*

| Action | Behavior |
|--------|----------|
| **Off (Default)** | Member is turned `off` when the target temperature is outside its supported range. Restored automatically when the target moves back in range. |
| **Clamp** | Member is set to its nearest supported limit (`min_temp` or `max_temp`). |

### Temperature & Humidity Settings

| Option | Description |
|--------|-------------|
| **External Sensors** | Select one or more sensors to override member readings. |
| **Use Master Temperature/Humidity** | *(Requires Master Entity)* Use the Master's target value instead of averaging across all members. |
| **Averaging Method** | Mean, Median, Min, or Max—separately for Current and Target values. |
| **Precision** | Round target values sent to devices (e.g. 0.5° or 1°). |
| **Calibration Targets** | Write calculated temperature to number entities. Supports **Absolute** (Standard), **Offset** (Delta), and **Scaled** (x100) modes. |
| **Calibration Heartbeat** | Periodically re-send calibration values (in minutes). Helps prevent timeouts on devices that expect frequent updates. |
| **Ignore Off Members (Calibration)** | Prevents sending calibration updates to devices that are currently `off`, preserving battery life on wireless sensors and TRVs. |
| **Device Mapping** | Automatically links external sensors to TRV internal sensors using HA Device Registry (for precise Offset calculation). |
| **Min Temp Off** | Enforce a minimum temperature (e.g. 5°C) even when the group is `off`. This ensures valves are fully closed for frost protection (essential for TRVs that don't close fully in `off` mode). |

### Sync Mode

| Option | Description |
|--------|-------------|
| **Sync Mode** | What to do when a member is changed outside the group. Disabled: ignore it. Mirror: apply the change to all members. Lock: revert the member back to the group target. Master/Lock *(requires Master Entity)*: only the master entity's changes are accepted. |
| **Selective Sync** | Attributes enforced in Lock/Mirror modes. Unselected attributes allow local control (e.g. sync temperature but let users change fan speed locally). |
| **Ignore Off Members (Sync)** | When enforcing Lock/Mirror, skip members that are currently off. Note: direct group commands always reach all capable members regardless of this setting. |
| **Last Man Standing** | When the *last* active member turns `off`, the group accepts this and updates its target state to `off` — even with Ignore Off Members enabled. |

### Window Control

| Option | Description |
|--------|-------------|
| **Window Action** | **Turn Off** (Default) or **Set Temperature**. Useful for frost protection. |
| **Adopt Manual Changes** | **Off** (block all), **All** (passive tracking for all members), or **Master Only** *(requires Master Entity)*. |
| **Window Temperature** | Target temperature to set when 'Set Temperature' action is selected. |
| **Room Sensor** | (Optional) Binary sensor for fast reaction (window in the same room). |
| **Zone Sensor** | (Optional) Binary sensor for slow reaction (e.g. apartment or floor). Room sensor should be part of zone sensor group. Active zone sensor prevents the group from being switched back on. |
| **Room/Zone Delay** | Time before turning off heating (default: 15s / 5min). |
| **Close Delay** | Time before restoring heating after windows close (default: 30s). |

### Presence Control

| Option | Description |
|--------|-------------|
| **Presence Control Mode** | **Disabled** (default) or **Enabled**. |
| **Presence Trigger** | One or more entities reporting room presence (binary_sensor, device_tracker, or person). Any 'on' or 'home' state is treated as present. The group is occupied if **any** sensor reports presence. |
| **Presence Zone** | *(Optional)* One or more `zone` entities. If configured, a person/device_tracker sensor only counts as present when located in one of the listed zones. Leave empty to treat any non-away state as present. |
| **Away Action** | The fallback action to perform when absence is detected: **Turn Off**, **Away Offset**, **Away Temperature**, or **Away Preset**. |
| **Away Offset** | *(Away Offset action)* Offset from current target when away (e.g. `−2.0°C` or `+2.0°C`). |
| **Away Temperature** | *(Away Temperature action)* Fixed temperature to set when away. |
| **Away Preset** | *(Away Preset action)* Preset mode to activate when away. |
| **Away Delay** | Wait time (seconds) after sensor reports absence before activating away mode. |
| **Return Delay** | Wait time (seconds) after sensor reports presence before restoring. |

### Schedule Automation

| Option | Description |
|--------|-------------|
| **Schedule Entity** | A Home Assistant `schedule` entity to control the group. |
| **Resync Interval** | Force-sync members to the desired group setting every X minutes (0 = disabled). |
| **Override Duration** | Delay before returning to schedule after manual changes (0 = disabled). |
| **Sticky Override** | Ignore schedule changes while a manual override is active. |
| **Ignore Off Members (Schedule)** | When running scheduled changes, skip members that are currently off. |
| **Retain Schedule Override** | Persist the active schedule entity across restarts when changed via `set_schedule_entity` service. Without this, the group always reverts to the configured default on restart. |

### Member Offsets

| Option | Description |
|--------|-------------|
| **Offset per Member** | Individual temperature offset (±20°C, 0.5°C steps) for each group member. Positive values make the room warmer, negative values cooler relative to the group's target. |
| **Correct member offset** | When enabled (default), each member's offset is subtracted before averaging so the group displays the logical setpoint. Disable to show the raw member average instead. |

### Group Offset

| Option | Description |
|--------|-------------|
| **Group Offset** | A `number` entity (slider −5.0°C to +5.0°C, step 0.5°C) that shifts all member temperatures by a fixed global amount. The offset is visible as a `group_offset` attribute and resets automatically when a temperature is set directly on the group. |

### Member Isolation

| Option | Description |
|--------|-------------|
| **Trigger Type** | **Binary Sensor** (activates when sensor is ON), **HVAC Mode** (activates when group mode matches), or **Member Off** (isolates each member individually when it turns off manually). |
| **Isolation Sensor** | *(Sensor trigger)* Binary sensor that triggers isolation when active. |
| **HVAC Mode Trigger** | *(HVAC Mode trigger)* The group modes that activate isolation. |
| **Isolated Members** | Which group members to isolate. For Member Off, defaults to all members. |
| **Activate Delay** | Time to wait after the trigger activates before isolating members. |
| **Restore Delay** | Time to wait after the trigger deactivates before restoring members. |

### Availability & Timings

| Option | Description |
|--------|-------------|
| **Debounce Delay** | Wait before sending commands. Higher values prevent 'rapid-fire' commands when sliding controls, but feel slower (default: 0.5s). |
| **Retry Attempts** | Number of retries if a command fails. |
| **Retry Delay** | Time between retries (e.g. 1.0s). |
| **Staggered Call Delay** | Time to wait between individual commands to group members (0–2s, default: 0). Staggering calls prevents radio flooding in large Zigbee/Matter networks. Also applies to calibration writes. |

## Services

### `climate_group_helper.boost`
Temporarily set the group to a target temperature for a fixed duration. When the timer expires, the group restores automatically — to the active schedule slot (if configured) or the state before the boost.

*   **Target:** The Climate Group entity.
*   **Fields:**
    *   `temperature` *(one of the two is required)*: Absolute target temperature during boost (e.g. `24.0`).
    *   `temperature_offset` *(one of the two is required)*: Relative offset added to the current target temperature (e.g. `+3.0` or `-2.0`).
    *   `duration` (Required): Duration in minutes (minimum 1).

A manual change during boost (direct group command or Mirror adoption) aborts the boost. Lock enforcement does not. Boost is ignored while a window is open.

**Example (absolute):**
```yaml
service: climate_group_helper.boost
target:
  entity_id: climate.my_group
data:
  temperature: 24.0
  duration: 30
```

**Example (offset):**
```yaml
service: climate_group_helper.boost
target:
  entity_id: climate.my_group
data:
  temperature_offset: 3.0
  duration: 30
```

### `climate_group_helper.set_schedule_entity`
Dynamically change the active schedule entity for a group.

*   **Target:** The Climate Group entity.
*   **Fields:**
    *   `schedule_entity` (Optional): The entity ID of the new schedule (e.g. `schedule.vacation_mode`). If omitted or set to `None`, reverts to the configured default entity, cancels any active override timer (including boost), and immediately re-applies the current slot.

**Example:**
```yaml
service: climate_group_helper.set_schedule_entity
target:
  entity_id: climate.my_group
data:
  schedule_entity: schedule.guest_mode
```

## Installation

### Via HACS (Recommended)

1. Open **HACS**
2. Search for **Climate Group Helper**
3. Click **Download**
4. **Restart Home Assistant**

### Manual

1. Download the [latest release](https://github.com/bjrnptrsn/climate_group_helper/releases)
2. Copy `custom_components/climate_group_helper` to your `custom_components` folder
3. **Restart Home Assistant**

## Setup

1. Go to **Settings** > **Devices & Services** > **Helpers**
2. Click **+ Create Helper**
3. Choose **Climate Group Helper**
4. Enter a name and select your climate entities

**To configure advanced options:**
1. Find the group in your dashboard or entity list
2. Click the **⚙️ Settings** icon → **Configure**
3. Enable **Advanced Mode** in General Settings to unlock all options
4. Select the configuration category (Members, Temperature, Sync Mode, etc.)

## Troubleshooting

### Issues after updating?
If you experience strange behavior after an update (e.g. settings not saving), try re-creating the group. This resolves potential migration issues.

### Debug Logging

To see more details, enable debug logging:

#### Option 1: Via UI (Recommended)
This method applies instantly and does not require a restart. However, if the issue occurs during startup (e.g. state restore, initialization), restart Home Assistant after enabling debug logging so the full startup sequence is captured.

1.  Go to **Settings > Devices & Services**.
2.  Select the **Devices** tab (at the top).
3.  Search for and select your configured **Climate Group Helper** device from the list.
4.  In the **Device info** panel, click on the **Climate Group Helper** link.
5.  On the integration page, click the menu (3 dots) on the left and select **Enable debug logging**.
6.  *(Optional but recommended for startup issues)* Restart Home Assistant now.
7.  Reproduce the issue.
8.  Disable debug logging via the same menu. The log file will be downloaded automatically.

#### Option 2: Via YAML (Manual)
Add the following to your `configuration.yaml` file (requires restart):

```yaml
logger:
  default: info
  logs:
    custom_components.climate_group_helper: debug
```

## Contributing

Found a bug or have an idea? [Open an issue](https://github.com/bjrnptrsn/climate_group_helper/issues) on GitHub.

## License

MIT License
