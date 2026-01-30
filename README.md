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

## ✨ Key Features

### 🎛️ Unified Control
Change settings on the group, and all member devices update to match. No more managing 5 thermostats individually.

### 🌡️ Multi-Sensor Aggregation
Use **multiple external sensors** for temperature and humidity. The group calculates the average (or min/max/median) to get the true room reading—not just what one device thinks.
*   **Averaging:** Mean, Median, Min, or Max.
*   **Precision:** Round values to match your device (e.g. 0.5°).

### 🔄 Advanced Calibration Sync
*New in v0.18!* Write the calculated sensor value back to your TRVs.
*   **Modes:** Absolute (Standard), Offset (Delta calculation), and Scaled (x100 for Danfoss Ally).
*   **Heartbeat:** Periodically re-sends the calibration value to prevent sensor timeouts on Zigbee devices.

### 🔒 Advanced Sync Modes
*   **Standard:** Classic one-way control (Group → Members).
*   **Mirror:** Two-way sync. Change one device, all others follow.
*   **Lock:** Enforce group settings. Reverts manual changes on members.

### 🎚️ Selective Attribute Sync
Choose **exactly** which attributes to sync in Lock/Mirror modes. Example: Sync temperature but allow individual fan control.

### ☯ Partial Sync (Respect Off)
Prevents the group from waking up members that are manually turned off.
*   **Ignore Off Members:** Allows turning off individual rooms without the Group forcing them back on (avoids "fighting").
*   **Last Man Standing:** Turning off the last active member turns off the group.

### 🪟 Window Control
Automatically turn off heating when windows open and restore it when they close.

*   **Logic:** Opening a window forces all members to `off`. Closing the window restores the group's previous settings (e.g. `heat`).
*   **Room Sensor:** Fast reaction (default: 15s). For sensors directly in the room. E.g. `binary_sensor.living_room_window`.
*   **Zone Sensor:** Slow reaction (default: 5min). For whole-house sensors. Prevents heating shutdown in closed rooms when a distant window opens. E.g. `binary_sensor.all_windows_open`.
*   **User Blocking:** Manual changes are blocked while windows are open.
*   **Sync Blocking:** Background sync ignores changes during window control.

### 📅 Advanced Schedule & Automation
*New in v0.18!* Native support for Home Assistant `schedule` entities with advanced override logic.

*   **Intelligent Sync:** The schedule updates the group's desired settings.
*   **Periodic Resync:** Ensure all devices stay on track. Forces the current schedule state every X minutes—perfect for "stubborn" devices or physical tampering.
*   **Manual Overrides:** Stay in control. Set an **Override Duration** to automatically return to the schedule after X minutes of manual adjustment.
*   **Sticky Override (Persist Changes):** If enabled, manual changes persist until the override expires, even if the schedule changes slots in the background.
*   **Window Aware:** If a schedule changes while windows are open, the new target is saved and applied immediately when windows close.

#### Schedule Configuration Example

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
| **Min Temp Off** | Enforce a minimum temperature (e.g. 5°C) even when the group is `OFF`. Essential for TRVs that don't close valves fully or provide frost protection in `OFF` mode. |

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

**Issues after updating?**
If you experience strange behavior after an update (e.g. settings not saving), try re-creating the group. This resolves potential migration issues.

To see more details, enable debug logging by adding the following to your `configuration.yaml` file:

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