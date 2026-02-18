# 🌡️ Climate Group Helper

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/icon@2x.png" alt="Climate Group Helper Icon" width="192"/>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Default-orange.svg" alt="HACS"/></a>
  <a href="https://github.com/bjrnptrsn/climate_group_helper/releases"><img src="https://img.shields.io/github/v/release/bjrnptrsn/climate_group_helper" alt="Release"/></a>
</p>

Combine multiple climate devices into a single, powerful entity for Home Assistant. Simplify your dashboard, streamline automations, and control entire rooms or zones as one unit.

---

## ✨ Core Features (Zero Config)
The "Minimalist Mode": Add your entities, and it just works. No complex setup required.

### 🎛️ Unified Control
Change settings on the group, and all member devices update to match. No more managing 5 thermostats individually.

### 🌡️ Smart Averaging
The group calculates the **mean** of all member temperatures to represent the true room reading.
*   **Averaging Method:** Choose between Mean (default), Median, Min, or Max.
*   **Precision:** Round target temperatures to device-compatible steps (0.5° or 1°). *Default: No rounding.*

## 🚀 Advanced Features (Optional)
Everything below is **completely optional**. If you don't configure it, the logic remains inactive and efficient ("Pay for what you use").


### 🌡️ External Sensors
Use **multiple external sensors** for temperature and humidity to override the member readings.

### 🎚️ Device Calibration
*Improved in v0.18!* Write the external sensor value back to your TRVs to fix their internal temperature reading.
*   **Modes:** Absolute (Standard), Offset (Delta calculation), and Scaled (x100 for Danfoss Ally).
*   **Heartbeat:** Periodically re-sends the calibration value to prevent sensor timeouts on Zigbee devices.

### 🔄 Advanced Sync Modes
*   **Standard:** Classic one-way control (Group → Members).
*   **Mirror:** Two-way sync. Change one device, all others follow.
*   **Lock:** Enforce group settings. Reverts manual changes on members.

*   **Selective Attribute Sync:** Choose **exactly** which attributes to sync in Lock/Mirror modes. Example: Sync temperature but allow individual fan control.
*   **Partial Sync (Respect Off):** Prevents the group from waking up members that are manually turned `off`.
    *   **Ignore Off Members:** If a member is turned `off`, the group will not force it back on during synchronization (allows "Soft Off" for individual devices).
    *   **Last Man Standing:** Only when the *last* active member is turned `off`, the Group accepts this change and updates its internal **Target State** to `off`.

### 🪟 Window Control
*New in v0.19: Enhanced with Temperature Targets!*

Automatically turn off heating when windows open and restore it when they close.

*   **Logic:** Opening a window forces all members to `off`. Closing the window restores the group's previous settings (e.g. `heat`).
*   **Room Sensor:** Fast reaction (default: 15s). For sensors directly in the room. E.g. `binary_sensor.living_room_window`.
*   **Zone Sensor:** Slow reaction (default: 5min). For whole-house sensors. Prevents heating shutdown in closed rooms when a distant window opens. E.g. `binary_sensor.all_windows_open`.
*   **Blocking:** While windows are open, manual changes and background sync are blocked. Schedule changes are still accepted internally and applied when windows close.
*   **Adopt Manual Changes:** Optionally allow manual changes to update the target state while windows are open (Passive Tracking). Changes are applied when windows close.

### 👑 Master Entity
*New in v0.19.0*

Designate a single climate member as the **Reference Point** or **Leader** for the group. This centralizes control logic and establishes a hierarchy, allowing one device to act as the authoritative source for the room's desired state.

*   **Centralized Target State:** Use the Master's target settings (temperature, humidity) as the group's goal, rather than calculated averages.
*   **Hierarchical Sync (Master/Lock):** Enables a specialized "Follow the Leader" mode. Changes on the Master are adopted by the group, while manual changes on "Slave" members are automatically reverted.
*   **Intelligent Window Control:** If enabled, manual adjustments on the Master are adopted as the new target state while windows are open. Changes on other devices remain ignored.

### 📅 Advanced Schedule & Automation
*New in v0.19: Enhanced with Dynamic Service Control!*

*   **Dynamic Control:** Change the active schedule entity on the fly via the `set_schedule_entity` service (e.g. switch to "Away Schedule" when no one is home).
*   **Intelligent Sync:** The schedule updates the group's desired settings.
*   **Periodic Resync:** Force-sync all members to the group's target state every X minutes. Works independently of Sync Mode.
*   **Manual Overrides:** Stay in control. Set an **Override Duration** to automatically return to the schedule after X minutes of manual adjustment.
*   **Sticky Override (Persist Changes):** If enabled, manual changes persist until the override expires, even if the schedule changes slots in the background.
*   **Window Aware:** If a schedule changes while windows are open, the new target is saved and applied immediately when windows close.

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

## ⚙️ Configuration Options

The configuration is organized into a wizard-style flow. Use the **Configure** button on the helper to change these settings.

### Temperature & Humidity Settings

| Option | Description |
|--------|-------------|
| **External Sensors** | Select one or more sensors to override member readings. |
| **Calibration Targets** | Write calculated temperature to number entities. Supports **Absolute** (Standard), **Offset** (Delta), and **Scaled** (x100) modes. |
| **Calibration Heartbeat** | Periodically re-send calibration values (in minutes). Helps prevent timeouts on devices that expect frequent updates. |
| **Device Mapping** | Automatically links external sensors to TRV internal sensors using HA Device Registry (for precise Offset calculation). |
| **Averaging Method** | Mean, Median, Min, or Max—separately for Current and Target values. |
| **Precision** | Round target values sent to devices (e.g. 0.5° or 1°). |
| **Min Temp Off** | Enforce a minimum temperature (e.g. 5°C) even when the group is `off`. Essential for TRVs that don't close valves fully or provide frost protection in `off` mode. |

### HVAC Mode Strategy

| Strategy | Behavior |
|----------|----------|
| **Normal** | Group shows most common mode. Only `off` when all are off. |
| **Off Priority** | Group shows `off` if *any* device is off. |
| **Auto** | Smart switching between Normal and Off Priority. |

### Feature Strategy

| Strategy | Behavior |
|----------|----------|
| **Intersection** | Features (e.g. Fan) supported by *all* devices. Safe mode. |
| **Union** | Features supported by *any* device. |

### Sync Mode

| Option | Description |
|--------|-------------|
| **Sync Mode** | Standard (One-way), Mirror (Two-way), or Lock (Enforced). |
| **Selective Sync** | Choose which attributes to enforce (e.g. sync temperature but allow local fan control). |

### Window Control

| Option | Description |
|--------|-------------|
| **Window Action** | **Turn Off** (Default) or **Set Temperature**. Useful for frost protection. |
| **Adopt Manual Changes** | If enabled, manual changes made while windows are open are saved as the new target state (Passive Tracking). |
| **Window Temperature** | Target temperature to set when 'Set Temperature' action is selected. |
| **Room Sensor** | Binary sensor for fast reaction (window in the same room). |
| **Zone Sensor** | Binary sensor for slow reaction (e.g. whole-house "any window open"). |
| **Room/Zone Delay** | Time before turning off heating (default: 15s / 5min). |
| **Close Delay** | Time before restoring heating after windows close (default: 30s). |

### Schedule & Timers

| Option | Description |
|--------|-------------|
| **Schedule Entity** | A Home Assistant `schedule` entity to control the group. |
| **Resync Interval** | Force-sync members to the desired group setting every X minutes (0 = disabled). |
| **Override Duration** | Delay before returning to schedule after manual changes (0 = disabled). |
| **Sticky Override** | Ignore schedule changes while a manual override is active. |

### Availability & Timings

| Option | Description |
|--------|-------------|
| **Debounce Delay** | Wait before sending commands to prevent network congestion (default: 0.5s). |
| **Retry Attempts** | Number of retries if a command fails. |
| **Retry Delay** | Time between retries (e.g. 1.0s). |

---

## 🛠️ Services

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

## 📦 Installation

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

## 🛠️ Setup

1. Go to **Settings** > **Devices & Services** > **Helpers**
2. Click **+ Create Helper**
3. Choose **Climate Group Helper**
4. Enter a name and select your climate entities

**To configure advanced options:**
1. Find the group in your dashboard or entity list
2. Click the **⚙️ Settings** icon → **Configure**
3. Select the configuration category (Members, Temperature, Sync Mode, etc.)

---

## 🔍 Troubleshooting

### Issues after updating?
If you experience strange behavior after an update (e.g. settings not saving), try re-creating the group. This resolves potential migration issues.

### Debug Logging

To see more details, enable debug logging:

#### Option 1: Via UI (Recommended)
This method applies instantly and does not require a restart.

1.  Go to **Settings > Devices & Services**.
2.  Select the **Devices** tab (at the top).
3.  Search for and select your configured **Climate Group Helper** device from the list.
4.  In the **Device info** panel, click on the **Climate Group Helper** link.
5.  On the integration page, click the menu (3 dots) on the left and select **Enable debug logging**.
6.  Reproduce the issue.
7.  Disable debug logging via the same menu. The log file will be downloaded automatically.

#### Option 2: Via YAML (Manual)
Add the following to your `configuration.yaml` file (requires restart):

```yaml
logger:
  default: info
  logs:
    custom_components.climate_group_helper: debug
```

---

## ❤️ Contributing

Found a bug or have an idea? [Open an issue](https://github.com/bjrnptrsn/climate_group_helper/issues) on GitHub.

---

## 📄 License

MIT License