# Climate Group Helper for Home Assistant

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/icon@2x.png" alt="Climate Group Helper - Home Assistant Integration for TRVs and ACs" width="192"/>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Default-orange.svg" alt="HACS - Home Assistant Community Store"/></a>
  <a href="https://github.com/bjrnptrsn/climate_group_helper/releases"><img src="https://img.shields.io/github/v/release/bjrnptrsn/climate_group_helper" alt="Release"/></a>
</p>

<p align="center">
  <strong>Control multiple climate devices as a single smart entity — with advanced logic and seamless synchronization.</strong>
</p>

<p align="center">
  🌡️ <b>TRV Calibration</b> | 🪟 <b>Window Open Detection</b> | 👤 <b>Presence</b> | 📅 <b>Smart Scheduling</b> | 🔒 <b>Sync Modes</b>
</p>

---

Stop managing thermostats individually in Home Assistant. Climate Group Helper combines your **radiator valves (TRVs), air conditioning units, and heaters** into a single controller. Install via **HACS** in minutes. It brings **external sensor calibration**, **window-open detection**, and **presence-based automation** to your Zigbee, Z-Wave, or Matter devices — all configurable without a single line of YAML.

> [!TIP]
> **Not just for groups!** Features like **Window Control**, **Scheduling**, and **Device Calibration** provide massive benefits for **single devices** too. Use this integration as a "Logic Layer" to bring premium features to basic thermostats.

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
    - [Schedule Meta-Keys](#schedule-configuration--meta-keys)
  - [Member Offsets](#member-offsets)
  - [Member Isolation](#member-isolation)
- [Management Entities (Switch & Slider)](#management-entities-switch--slider)
  - [Main Switch](#main-switch)
  - [Group Offset](#group-offset)
- [Configuration Options](#configuration-options)
- [Services](#services)
- [Backup & Migration](#backup--migration)
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
*   **Ignore Off Members:** Prevents sending calibration updates to TRVs that are currently turned `off`, preserving battery life on wireless devices.

### Advanced Sync Modes

Controls what happens when a member device is changed directly (e.g. via its own app or physical buttons) — not when you control the group itself.

The behavior of each mode depends on whether the changed attribute is listed under **Synced Attributes** in the UI — or not. Think of the two columns as two independent policies the mode applies:

| Mode | Attribute **in** `sync_attributes` | Attribute **not in** `sync_attributes` |
|---|---|---|
| **Disabled** | Ignore | Ignore |
| **Mirror** | Mirror ¹ | Ignore |
| **Lock** | Revert ¹ | Ignore |
| **Mirror/Lock** | Mirror ¹ | Revert ¹ |
| **Master/Lock** | Master: Mirror · Non-master: Revert ¹ | Ignore |

*¹ With **Respect Member Off State (Sync)** enabled: members that are manually turned `off` are left alone — their `off` is neither mirrored nor reverted. Exception: if it is the last active member, the group itself switches to `off`.*

**Glossary**
- **Mirror** — the group adopts the member's new value as the new group target, then syncs all other members to match.
- **Revert** — the group ignores the member's change and immediately sends the current group target back to that member.
- **Ignore** — the group takes no action; the member keeps its locally changed value.

**Synced Attributes** therefore has a different meaning depending on the mode:

| Mode | Role of **Synced Attributes** |
|---|---|
| Mirror | Opt-in: only listed attributes are mirrored. Unlisted = local freedom. |
| Lock | Opt-in: only listed attributes are enforced. Unlisted = local freedom. |
| **Mirror/Lock** | **Split**: listed = mirrored, unlisted = locked (no attribute is ignored). |
| Master/Lock | Opt-in for the master: only listed attributes are adopted from the master. |

> [!NOTE]
> **Mirror/Lock** is the only mode where no attribute is left alone — every change on a member either updates the group or gets corrected. Use it e.g. to allow users to adjust the temperature from any thermostat while preventing them from switching modes or fan speeds.

*   **Respect Member Off State (Sync):** When a member is manually turned `off`, the group neither mirrors that `off` to others nor forces it back on — the member is simply left alone. The one exception: if it is the *last* active member, the group accepts the `off` and its own target switches to `off` as well.

### Window Control

Automatically turn off heating or set a frost-protection temperature when windows or doors are opened, and restore the previous state when they close. While windows are open, manual changes are blocked. Supports binary sensors and cover entities.

*   **Room + Zone Sensors:** Supports fast-reacting room sensors vs. slow-reacting zone sensors (e.g. for whole floors).
*   **Configurable Delays:** Set custom reaction times for opening and closing.
*   **Window Action:** Choose between full `off` or a configurable temperature setpoint.
*   **Adopt Manual Changes:** Optionally allow passive tracking:
    *   **Off:** All manual changes are blocked and discarded.
    *   **All:** Any manual change updates the target state. Applied when windows close.
    *   **Master Only:** *(Requires Master Entity)* Only changes on the Master update the target state.

### Presence Control

Manage climate settings based on room presence. Select one or more triggers (binary sensor, device tracker, or person), optionally restricted to specific **zones** (e.g. to only trigger when someone is actually at 'Home'). Configure delays and fallback actions for when the room becomes empty. The group is considered occupied if **any** sensor reports presence.

*   **Turn Off:** Members are turned `off` while absence is detected (default).
*   **Away Offset:** Target temperature is reduced by a fixed offset (e.g. −2°C). The offset is applied relative to the group's *current target temperature*. If a schedule changes during absence, the offset is automatically reapplied to the new scheduled value.
*   **Away Temperature:** Members are set to a fixed absolute temperature.
*   **Away Preset:** A preset mode is sent to members that support it.

When presence returns, the group restores all members to the current target state. Window Control and the Main Switch always take priority over Presence Control.

### Schedule Automation

Integrate native HA `schedule` helpers to automate your climate settings per time slot. You can set temperature and HVAC mode directly in the schedule's data, and the group intelligently handles transitions: if a schedule change occurs while **Window Control** is active (e.g. heating is paused), the new target is applied immediately once everything is closed.

Schedules can be switched on the fly via service (e.g. for "Vacation" or "Guest" modes). Calling the service without an entity resets to the configured default and re-applies the current slot.

*   **Manual Overrides:** Manual adjustments temporarily pause the schedule for a set **Override Duration**. By default, the group returns to the schedule as soon as the timer expires OR the next scheduled slot begins.
*   **Sticky Override:** Ensures your manual setting persists for the full duration. If enabled, upcoming schedule transitions are ignored while the timer is running. The group only returns to the schedule once the timer actually expires.
*   **Periodic Resync:** Force-sync all members every X minutes to ensure they match the target state.
*   **Schedule Persistence:** Ensures that a schedule changed via service survives a Home Assistant restart. If disabled, the group always reverts to its configured default schedule after a restart.
*   **Respect Member Off State (Schedule):** Members that are manually turned `off` are skipped during scheduled changes and periodic resyncs — they are not forced back on.

### Schedule Configuration & Meta-Keys

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
| `sync_attributes` | Any subset of: `hvac_mode`, `temperature`, `target_temp_low`, `target_temp_high`, `humidity`, `fan_mode`, `preset_mode`, `swing_mode`, `swing_horizontal_mode` | `sync_attributes: [hvac_mode]` | Temporarily overrides which attributes are synchronized for the slot duration. Useful for slots where you want to sync only the mode but let members manage their own temperature. Restores to the configured Synced Attributes setting when the slot ends. |

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

Apply permanent individual offsets (±20°C) to each group member to account for physical room differences. The group intelligently handles these offsets during averaging and synchronization: for example, if the group is set to 21°C, a bedroom with a −1°C offset receives 20°C while the living room (+0.5°C) receives 21.5°C. Your logical setting remains a consistent 21°C across all group interfaces.

*   **Correct Member Offset:** Subtracts member offsets before averaging to show the room's logical setpoint instead of the raw physical temperature average.

### Member Isolation

Temporarily isolate specific members from the group using sensors or state triggers. While isolation is active, these devices are turned `off` and excluded from all averaging and synchronization calculations. Window Control and the Main Switch always take priority over Member Isolation. At least one member must always remain active to ensure the group stays operational.

*   **Binary Sensor:** Isolation activates when a binary sensor (e.g. curtain sensor, occupancy helper) turns `on`.
*   **HVAC Mode:** Isolation activates when the group's target mode matches a configured set (e.g. isolate radiators when switching to `cool`).
*   **Member Off:** Automatically isolates individual members when they are turned `off` manually. Restoration occurs as soon as the device is turned back `on`.
*   **Configurable Delays:** Set custom reaction times for activation and restoration (Sensor and HVAC Mode triggers only).


## Management Entities (Switch & Slider)

Alongside the main climate entity, the integration creates additional helper entities to provide direct control points for your dashboards and automations.

### Main Switch

A dedicated `switch` entity acts as a **master on/off toggle** for the entire group. It is useful for summer months, extended absences, or any situation where you want the group completely disabled without touching your schedules or target settings. While the switch is `off`, all manual and automated commands are blocked.

*   **Switch OFF:** Immediately turns all members `off` and aborts any active boost. The group remains blocked until the switch is turned back on.
*   **Switch ON:** Releases the block and restores all members to the group's current target state.

### Group Offset

A dedicated `number` entity allows you to apply a global temperature shift (±5.0°C) to all group members. Use it to temporarily adjust the room's comfort level without modifying your underlying schedule or target settings. The offset acts as a non-destructive layer: a +1.5°C offset shifts a 20°C morning setpoint to 21.5°C and automatically follows a schedule transition to 23.5°C in the evening.

*   **Auto-reset:** Setting a temperature directly on the group (via UI or service) resets the offset to `0` automatically.
*   **Persistence:** The offset value survives Home Assistant restarts.

## Configuration Options

### Members & Group Behavior

| Option | Description |
|--------|-------------|
| **Master Entity** | Designate one member as the group's Leader. Enables Master/Lock sync mode, Master-aware window tracking, and centralized temperature/humidity target. |
| **HVAC Mode Strategy** | How the group reports its combined mode. See table below. |
| **Feature Strategy** | Which features the group exposes. See table below. |
| **Out-of-Bounds Action** | *(Union only)* What to do when a target temperature is outside a member's range. |
| **Unsupported HVAC Mode Action** | *(Union only)* What to do with members that don't support the requested mode. |

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

### Unsupported Mode Action *(Union only)*

| Action | Behavior |
|--------|----------|
| **Ignore (Default)** | Member stays in its current mode if it doesn't support the target mode. |
| **Off** | Member is turned `off` when it doesn't support the target mode (e.g. AC when heating). |

### Temperature & Humidity Settings

| Option | Description |
|--------|-------------|
| **External Sensors** | Select one or more sensors to override member readings. |
| **Use Master Temperature/Humidity** | *(Requires Master Entity)* Use the Master's target value instead of averaging across all members. |
| **Averaging Method** | Mean, Median, Min, or Max—separately for Current and Target values. |
| **Precision** | Round target values sent to devices (e.g. 0.5° or 1°). |
| **Calibration Targets** | Write calculated temperature to number entities. Supports **Absolute** (Standard), **Offset** (Delta), and **Scaled** (x100) modes. |
| **Calibration Heartbeat** | Periodically re-send calibration values (in minutes). Helps prevent timeouts on devices that expect frequent updates. |
| **Ignore Off Members** | Prevents sending calibration updates to devices that are currently `off`, preserving battery life on wireless sensors and TRVs. |
| **Device Mapping** | Automatically links external sensors to TRV internal sensors using HA Device Registry (for precise Offset calculation). |
| **Min Temp Off** | Enforce a minimum temperature (e.g. 5°C) even when the group is `off`. This ensures valves are fully closed for frost protection (essential for TRVs that don't close fully in `off` mode). |

### Sync Mode

| Option | Description |
|--------|-------------|
| **Sync Mode** | What to do when a member is changed outside the group. Disabled: ignore everything. **Mirror**: adopt + propagate listed attributes, ignore the rest. **Lock**: revert listed attributes, ignore the rest. **Mirror** & **Lock**: adopt listed attributes, revert everything else (nothing is ignored). **Master/Lock** *(requires Master Entity)*: adopt listed attributes from the master, revert non-master changes. |
| **Synced Attributes** | Which attributes the mode acts on. In **Mirror**, **Lock**, **Master/Lock**: listed = active, unlisted = ignored. In **Mirror** & **Lock**: listed = mirrored, unlisted = locked. |
| **Respect Member Off State (Sync)** | Members that are manually turned `off` are left alone — their `off` is neither mirrored to others nor reverted back to the group target. Exception: if it is the last active member, the group itself switches to `off` (Last Man Standing). Direct group commands always reach all members regardless of this setting. |

### Window Control

| Option | Description |
|--------|-------------|
| **Window Action** | **Turn Off** (Default) or **Set Temperature**. Useful for frost protection. |
| **Adopt Manual Changes** | **Off** (block all), **All** (passive tracking for all members), or **Master Only** *(requires Master Entity)*. |
| **Window Temperature** | Target temperature to set when 'Set Temperature' action is selected. |
| **Room Sensor** | (Optional) Binary sensor (window/door) or cover entity for fast reaction. Covers are treated as "open" unless they are fully closed. |
| **Zone Sensor** | (Optional) Binary sensor or cover entity for slow reaction (e.g. apartment or floor). |
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
| **Respect Member Off State (Schedule)** | Members that are manually turned `off` are skipped during scheduled changes and periodic resyncs — they are not forced back on. Direct group commands always reach all members regardless of this setting. |
| **Retain Schedule Override** | Persist the active schedule entity across restarts when changed via `set_schedule_entity` service. Without this, the group always reverts to the configured default on restart. |

### Member Offsets

| Option | Description |
|--------|-------------|
| **Offset per Member** | Apply individual temperature shifts (±20°C, 0.5°C steps) so specific members run proportionately warmer or cooler than the group's target setpoint. |
| **Correct member offset (Default)** | Subtracts member offsets before averaging to show the room's logical setpoint instead of the raw physical average. |

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

Temporarily set the group to a target temperature for a fixed duration. When the timer expires, the group restores automatically to the active schedule slot (if configured) or its previous target state.

**Service Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `temperature` | No* | Absolute target temperature during boost (e.g. `24.0`). |
| `temperature_offset` | No* | Relative offset added to the current target temperature (e.g. `+3.0` or `−2.0`). |
| `duration` | **Yes** | Duration in minutes (minimum 1). |

*\*Either `temperature` or `temperature_offset` must be provided.*

Manual changes (direct group commands or Mirror adoptions) abort the boost immediately. Lock enforcement does not. Boost is ignored while a group block (like an open window) is active.

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

**Service Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `schedule_entity` | No | The entity ID of the new schedule (e.g. `schedule.vacation_mode`). If omitted, the group reverts to its configured default entity. |

Calling this service without an entity resets the group, cancels any active override timers (including boost), and immediately re-applies the current schedule slot.

**Example:**
```yaml
service: climate_group_helper.set_schedule_entity
target:
  entity_id: climate.my_group
data:
  schedule_entity: schedule.guest_mode
```

### `climate_group_helper.apply_config`

Apply a portable JSON configuration to a group. This is useful for copying logic settings between groups or restoring a backup from a configuration sensor.

**Service Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `settings` | **Yes** | A JSON object containing the configuration. Source: `settings_json` attribute from a Configuration Sensor. |
| `include_member_list` | **Yes** | If `true`, overwrites the list of member and isolation entities. |
| `include_entity_selectors` | **Yes** | If `true`, overwrites linked sensors and per-member offsets. |

By default, only logic settings (Sync Modes, Window Control, Schedules, etc.) are transferred. Set the two inclusion flags to `true` if you also want to copy the list of members and their linked sensors. The group name is always preserved.

> [!IMPORTANT]
> **Reload Behavior:** Calling this service triggers a full reload of the group entity. All active, non-persisted timers (e.g., Boost, Window delays) will be reset immediately. This is the same behavior as when making changes through the UI.

## Backup & Migration

The integration provides built-in ways to snapshot, restore, and clone your logic settings.

*   **Configuration Sensor:** Enable **Expose Configuration Sensor** (Advanced Settings) to create a diagnostic `sensor` entity. Its `settings_json` attribute contains a portable snapshot of all logic settings.
*   **Diagnostics Download:** Click **Download diagnostics** directly in the **Device info** panel (or via the integration's ⋮ menu).

**Example — Copy settings from one group to another:**
1. Enable the configuration sensor on the **source** group.
2. Call the `apply_config` service on the **target** group:

```yaml
service: climate_group_helper.apply_config
target:
  entity_id: climate.bedroom_group
data:
  settings: "{{ state_attr('sensor.living_room_group_configuration', 'settings_json') }}"
  include_member_list: false
  include_entity_selectors: false
```

## Installation

### Via HACS (Recommended)
1. Open **HACS**.
2. Search for **Climate Group Helper**.
3. Click **Download**
4. **Restart Home Assistant**.

### Manual
1. Download the [latest release](https://github.com/bjrnptrsn/climate_group_helper/releases).
2. Copy `custom_components/climate_group_helper` to your `custom_components` folder.
3. **Restart Home Assistant**.

## Setup

1. Go to **Settings** > **Devices & Services** > **Helpers**.
2. Click **+ Create Helper** > **Climate Group Helper**.
3. Follow the configuration flow to add your entities.

**To unlock all features:** Open the group's **Configuration** menu and enable **Advanced Mode** in General Settings. This will reveal all category-specific options.

## Troubleshooting

### Issues after updating?
If you experience strange behavior after an update (e.g. settings not saving), first try restarting Home Assistant. Re-creating the group usually resolves any remaining migration-related problems.

### Debug Logging

#### Option 1: Via UI (Instant)
1. Go to **Settings** > **Devices & Services** > **Devices**.
2. Search for your **Climate Group** and click it.
3. In the **Device info** panel, click the **Climate Group Helper** link (next to the icon).
4. On the integration page, click the **⋮ menu** (top right) and select **Enable debug logging**.
5. Reproduce the issue, then disable logging. The file will download automatically.
   *(Note: For startup-related issues, restart HA after enabling logging.)*

#### Option 2: Via YAML (Manual)
Add this to your `configuration.yaml` (requires restart):

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
