# 🌡️ Climate Group Helper

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/icon@2x.png" alt="Climate Group Helper Icon" width="128"/>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Custom-orange.svg" alt="HACS"/></a>
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

### 🔄 Calibration Sync (Write Targets)
*New in v0.13!* Write the calculated sensor value **back to physical devices** (e.g. `number.thermostat_external_input`). Perfect for TRVs that support external temperature calibration.

### 🔒 Advanced Sync Modes
*   **Standard:** Classic one-way control (Group → Members).
*   **Mirror:** Two-way sync. Change one device, all others follow.
*   **Lock:** Enforce group state. Reverts manual changes on members.

### 🎚️ Selective Attribute Sync
*New in v0.13!* Choose **exactly** which attributes to sync in Lock/Mirror modes. Example: Sync temperature but allow individual fan control.

### 🪟 Window Control
*Redesigned in v0.16!* Automatically turn off heating when windows open and restore it when they close.

*   **Logic:** Opening a window forces all members to `off`. Closing the window restores the group's target state (e.g. `heat`).
*   **Room Sensor:** Fast reaction (default: 15s). For sensors directly in the room. E.g. `binary_sensor.living_room_window`.
*   **Zone Sensor:** Slow reaction (default: 5min). For whole-house sensors. Prevents heating shutdown in closed rooms when a distant window opens. E.g. `binary_sensor.all_windows_open`.
*   **User Blocking:** Manual changes are blocked while windows are open.
*   **Sync Blocking:** Background sync ignores changes during window control.

### 📅 Schedule Integration
*New in v0.16!* Native support for Home Assistant `schedule` entities.

*   **Direct Control:** Link a schedule helper to your climate group.
*   **Intelligent Sync:** The schedule updates the group's target state.
*   **Window Aware:** If a schedule changes while windows are open, the new target is saved and applied immediately when windows close.
*   **Format:** Supports `hvac_mode`, `temperature`, `fan_mode`, etc. via schedule variables.

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
| **Calibration Targets** | Write calculated temperature to number entities. |
| **Averaging Method** | Mean, Median, Min, or Max—separately for Current and Target values. |
| **Precision** | Round target values sent to devices (e.g. 0.5° or 1°). |

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

### Schedule

| Option | Description |
|--------|-------------|
| **Schedule Entity** | A Home Assistant `schedule` entity to control the group. |

### Availability & Timings

| Option | Description |
|--------|-------------|
| **Debounce Delay** | Wait before sending commands to prevent network congestion (default: 0.5s). |
| **Retry Attempts** | Number of retries if a command fails. |
| **Retry Delay** | Time between retries (e.g. 1.0s). |

---

## 📦 Installation

### Via HACS (Recommended)

1. Open **HACS** > **Integrations**
2. Click the **three dots** in the top right corner > **Custom repositories**
3. Add the URL: `https://github.com/bjrnptrsn/climate_group_helper`
4. Select **Integration** as the category and click **Add**
5. Search for **Climate Group Helper** and install it
6. **Restart Home Assistant**

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