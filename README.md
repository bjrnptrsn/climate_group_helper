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

---

## Table of Contents

- [Core Features](#core-features-zero-config)
- [Advanced Features](#advanced-features-optional)
  - [Master Entity](#master-entity)
  - [External Sensors](#external-sensors)
  - [Device Calibration](#device-calibration)
  - [Sync Modes](#advanced-sync-modes)
  - [Window Control](#window-control)
  - [Member Offsets](#member-offsets)
  - [Member Isolation](#member-isolation)
  - [Schedule Automation](#schedule-automation)
- [Configuration Options](#configuration-options)
- [Services](#services)
- [Installation](#installation)
- [Setup](#setup)
- [Troubleshooting](#troubleshooting)

---

## Core Features (Zero Config)

The "Minimalist Mode": Add your entities, and it just works. No complex setup required.

### Unified Control

Change settings on the group, and all member devices update to match. No more managing 5 thermostats individually.

### Smart Averaging

The group calculates the **mean** of all member temperatures to represent the true room reading.
*   **Averaging Method:** Choose between Mean (default), Median, Min, or Max.
*   **Precision:** Round target temperatures to device-compatible steps (0.5° or 1°). *Default: No rounding.*

## Advanced Features

Everything below is **optional**. If you don't configure it, the logic remains inactive and efficient.

### Master Entity

Designate a single climate member as the **Reference Point** or **Leader** for the group. This is the first thing you configure in the setup wizard — and once set, it unlocks additional options in every subsequent step (Sync Mode, Window Control, and Temperature/Humidity averaging).

*   **Centralized Target State:** Use the Master's target settings (temperature, humidity) as the group's goal, rather than calculated averages across all members.
*   **Hierarchical Sync (Master/Lock):** Enables a "Follow the Leader" sync mode. Changes on the Master are mirrored to all members; manual changes on other members are automatically reverted.
*   **Intelligent Window Control:** If enabled, only manual adjustments on the Master update the target state while windows are open. Changes on other devices remain ignored.

### External Sensors

Use **multiple external sensors** for temperature and humidity to override the member readings.

### Device Calibration

Write the external sensor value back to your TRVs to fix their internal temperature reading.

*   **Modes:** Absolute (Standard), Offset (Delta calculation), and Scaled (x100 for Danfoss Ally).
*   **Heartbeat:** Periodically re-sends the calibration value to prevent sensor timeouts on Zigbee devices.
*   **Battery Saver (Ignore Off):** Prevent sending constant calibration updates to wireless TRVs that are currently turned `off`. Configured in the Temperature step.

### Advanced Sync Modes

Beyond basic group control, you can mirror changes bidirectionally, enforce strict settings, or designate a leader.

*   **Standard:** Classic one-way control (Group → Members).
*   **Mirror:** Two-way sync. Change one device, all others follow.
*   **Lock:** Enforce group settings. Automatically reverts manual changes on all members.
*   **Master/Lock:** *(Requires Master Entity)* "Follow the Leader" mode — changes on the Master are mirrored to all members, while manual changes on other members are reverted.

*   **Selective Attribute Sync:** Choose **exactly** which attributes to sync (e.g. sync temperature but allow individual fan control).
*   **Partial Sync (Respect Off):** Prevents the group from waking up members that are manually turned `off`.
    *   **Ignore Off Members:** If a member is turned `off`, the group will not force it back on during synchronization (allows "Soft Off").
    *   **Last Man Standing:** Only when the *last* active member is turned `off`, the Group accepts this change and updates its internal **Target State** to `off`.

### Window Control

Binary sensor support to automatically turn off heating when a window opens and restore it when it closes.

*   **Binary Sensors:** Use native HA binary sensors (or groups) for reaction.
*   **Room + Zone Sensors:** Supports fast-reacting room sensors vs. slow-reacting zone sensors (e.g. for whole floors).
*   **Configurable Delays:** Set custom reaction times for opening and closing.
*   **Window Action:** Choose between full `off` or a configurable temperature setpoint.
*   **Blocking:** While windows are open, manual changes are blocked. Schedule changes are accepted internally and applied when windows close.
*   **Adopt Manual Changes:** Optionally allow passive tracking:
    *   **Off (Default):** All manual changes are blocked and discarded.
    *   **All:** Any manual change updates the target state. Applied when windows close.
    *   **Master Only:** *(Requires Master Entity)* Only changes on the Master update the target state.

### Member Offsets

Apply a permanent individual offset (±20°C, 0.5°C steps) to each group member, so rooms can run proportionately warmer or cooler than the group's target setting — without changing what you set on the group entity itself.

*   **Example:** Group target is 21°C. Bedroom has offset −1°C → receives 20°C. Living Room has offset +0.5°C → receives 21.5°C.
*   **Mirror / Master-Lock aware:** When a member change is adopted back into the group's target state, the offset is reversed so the global target stays consistent.

### Member Isolation

Temporarily isolate specific group members when a binary sensor is active (e.g. a curtain closes, a room becomes unoccupied).

*   **Sensor ON:** After an optional activate delay, isolated members are turned `off` and excluded from all group calculations (temperature averaging, HVAC mode, sync).
*   **Sensor OFF:** After an optional restore delay, isolated members are restored to the group's current target state.
*   **Window Control Interaction:** Isolated members are never touched by Window Control — neither on open nor on close. If a window is open when isolation deactivates, the restore is deferred until the window closes.
*   **Constraints:** At least one member must remain active — you cannot isolate all members. The section is hidden when the group has only one member.

### Schedule Automation

Integrate native HA `schedule` helpers to automate your climate settings per time slot.

*   **Time Slots:** Set temperature and HVAC mode directly in the schedule's data.
*   **Dynamic Control:** Switch schedules on the fly via service call (e.g. for "Vacation" or "Guest" modes).
*   **Manual Overrides:** Stay in control. Set an **Override Duration** to automatically return to the schedule after manual adjustments.
*   **Sticky Override (Persist Changes):** If enabled, schedule changes are ignored while the override is active.
*   **Periodic Resync:** Force-sync all members every X minutes to ensure they match the target state.
*   **Schedule Persistence:** Optionally retain a schedule switched via service call across Home Assistant restarts.
*   **Window Aware:** If a schedule changes while windows are open, the new target is applied immediately when windows close.

### Schedule Configuration Example

1. Create a **Schedule Helper** in Home Assistant (Settings > Devices & Services > Helpers).
2. Open the schedule and add your time slots.
3. **Crucial:** You must add **variables** (data) to your schedule slots to tell the group what to do.

**Example (Edit Schedule as YAML):**
```yaml
monday:
  - from: "06:00:00"
    to: "08:30:00"
    data:
      hvac_mode: "heat"
      temperature: 21.5
  - from: "08:30:00"
    to: "16:00:00"
    data:
      hvac_mode: "heat"
      temperature: 19.0
```

---

## Configuration Options

The configuration is organized into a wizard-style flow. Use the **Configure** button on the helper to change these settings.

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

### Member Offsets

| Option | Description |
|--------|-------------|
| **Offset per Member** | Individual temperature offset (±20°C, 0.5°C steps) for each group member. Positive values make the room warmer, negative values cooler relative to the group's target. |

### Sync Mode

| Option | Description |
|--------|-------------|
| **Sync Mode** | Standard (One-way), Mirror (Two-way), Lock (Enforced), or Master/Lock *(requires Master Entity)*. |
| **Selective Sync** | Choose which attributes to enforce (e.g. sync temperature but allow local fan control). |
| **Ignore Off Members** | Prevent the group from forcing `off` members back on during sync. |

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

### Member Isolation

| Option | Description |
|--------|-------------|
| **Isolation Sensor** | Binary sensor that triggers isolation when active. |
| **Isolated Members** | Which group members to isolate. Must be a subset — at least one member must remain active. |
| **Activate Delay** | Time to wait after the sensor activates before isolating members. |
| **Restore Delay** | Time to wait after the sensor deactivates before restoring members. |

### Schedule Automation

| Option | Description |
|--------|-------------|
| **Schedule Entity** | A Home Assistant `schedule` entity to control the group. |
| **Resync Interval** | Force-sync members to the desired group setting every X minutes (0 = disabled). |
| **Override Duration** | Delay before returning to schedule after manual changes (0 = disabled). |
| **Sticky Override** | Ignore schedule changes while a manual override is active. |
| **Retain Schedule Override** | Persist the active schedule entity across restarts when changed via `set_schedule_entity` service. Without this, the group always reverts to the configured default on restart. |

### Availability & Timings

| Option | Description |
|--------|-------------|
| **Debounce Delay** | Wait before sending commands. Higher values prevent 'rapid-fire' commands when sliding controls, but feel slower (default: 0.5s). |
| **Retry Attempts** | Number of retries if a command fails. |
| **Retry Delay** | Time between retries (e.g. 1.0s). |

---

## Services

### `climate.set_schedule_entity`
Dynamically change the active schedule entity for a group.

*   **Target:** The Climate Group entity.
*   **Fields:**
    *   `schedule_entity` (Optional): The entity ID of the new schedule (e.g. `schedule.vacation_mode`). If omitted or set to `None`, reverts to the configured default entity.

**Example:**
```yaml
service: climate_group_helper.set_schedule_entity
target:
  entity_id: climate.my_group
data:
  schedule_entity: schedule.guest_mode
```

---

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

---

## Setup

1. Go to **Settings** > **Devices & Services** > **Helpers**
2. Click **+ Create Helper**
3. Choose **Climate Group Helper**
4. Enter a name and select your climate entities

**To configure advanced options:**
1. Find the group in your dashboard or entity list
2. Click the **⚙️ Settings** icon → **Configure**
3. Select the configuration category (Members, Temperature, Sync Mode, etc.)

---

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

---

## Contributing

Found a bug or have an idea? [Open an issue](https://github.com/bjrnptrsn/climate_group_helper/issues) on GitHub.

---

## License

MIT License
