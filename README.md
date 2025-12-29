# 🌡️ Climate Group Helper

<p align="center">
  <img src="assets/icon@2x.png" alt="Climate Group Helper Icon" width="128"/>
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

### 🔄 Calibration Sync (Write Targets)
*New in v0.13!* Sync the calculated sensor value **back to physical devices**. Perfect for TRVs that support external temperature calibration offsets.

### 🔒 Advanced Sync Modes
- **Standard**: Classic one-way control.
- **Mirror**: Change one device, all others follow.
- **Lock**: Enforce group state—reverts manual changes.

### 🎚️ Selective Attribute Sync
*New in v0.13!* Choose exactly which attributes to sync. Want unified temperature but individual fan control? Now possible.

---

## ⚙️ Configuration Options

### Temperature & Humidity

| Option | Description |
|--------|-------------|
| **External Sensors** | Select one or more sensors to override member readings |
| **Calibration Targets** | Number entities to receive the calculated value (e.g. TRV offsets) |
| **Averaging Method** | Mean, Median, Min, or Max—separately for current and target values |
| **Rounding** | Exact, Half Degree (0.5°), or Whole Numbers (1°) |

### HVAC Mode Strategy

| Strategy | Behavior |
|----------|----------|
| **Normal** | Group shows most common mode. Only `off` when all are off. |
| **Off Priority** | Group shows `off` if *any* device is off. |
| **Auto** | Smart switching based on target mode. |

### Feature Strategy

| Strategy | Behavior |
|----------|----------|
| **Intersection** | Only features supported by *all* devices. Safe mode. |
| **Union** | All features from *any* device. Commands routed intelligently. |

### Sync Mode

| Mode | Behavior |
|------|----------|
| **Standard** | One-way: Group → Members |
| **Mirror** | Two-way: Any change propagates to all |
| **Lock** | Enforce: Reverts unauthorized changes |

**Selective Sync**: Enable specific attributes (temperature, hvac_mode, fan_mode, etc.) for enforcement.

### Reliability

| Option | Description |
|--------|-------------|
| **Debounce Delay** | Wait before sending commands (prevents network flooding) |
| **Retry Attempts** | Number of retries if command fails |
| **Retry Delay** | Time between retries |

### Other Options

- **Expose Sensors**: Create separate sensor entities for temperature/humidity history
- **Expose Member List**: Show member entity IDs as an attribute

---

## 📦 Installation

### Via HACS (Recommended)

1. Open **HACS** > **Integrations**
2. Search for **Climate Group Helper**
3. Click **Install**
4. Restart Home Assistant

### Manual

1. Download the [latest release](https://github.com/bjrnptrsn/climate_group_helper/releases)
2. Copy `custom_components/climate_group_helper` to your `custom_components` folder
3. Restart Home Assistant

---

## 🛠️ Setup

1. Go to **Settings > Devices & Services > Helpers**
2. Click **+ Create Helper**
3. Choose **Climate Group Helper**
4. Enter a name and select your climate entities

To configure advanced options after creation:
1. Open the entity (e.g., via the dashboard or entity list)
2. Click the **⚙️ Settings** (gear icon)
3. Select your group options

**Available options:**
- **Members & Modes**: Add/remove devices, set HVAC and feature strategies
- **Temperature**: External sensors, calibration targets, averaging, rounding
- **Humidity**: Same options as temperature
- **Timings**: Debounce, retry settings
- **Sync Mode**: Standard/Mirror/Lock, selective attribute sync
- **Other**: Sensor exposure, member list

---

## 🔍 Troubleshooting

Enable debug logging to see what's happening:

```yaml
logger:
  logs:
    custom_components.climate_group_helper: debug
```

---

## ❤️ Contributing

Found a bug or have an idea? [Open an issue](https://github.com/bjrnptrsn/climate_group_helper/issues) on GitHub.

---

## 📄 License

MIT License