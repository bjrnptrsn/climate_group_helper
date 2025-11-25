# 🌡️ Home Assistant Climate Group Helper

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

The **Climate Group Helper** for Home Assistant allows you to combine multiple climate devices into a single, powerful entity. Simplify your dashboard, clean up your automations, and control entire rooms or zones as one unit.

## ✨ Why use this?

Managing multiple climate devices individually is tedious. This integration solves that by creating a "Virtual Controller" that handles the complexity for you.

*   **Centralized Control**: Change settings on the group, and all *available* member devices will be updated to match.
*   **Smart Sensors**: Get a single, averaged temperature and humidity reading for the whole room.
*   **Dynamic**: Add or remove devices on the fly without restarting Home Assistant.
*   **100% UI Managed**: No YAML required. Set it up in seconds via the Helpers menu.

## ⚙️ Customization Options

Tailor the group's logic to fit your home perfectly.

*   **Intelligent Value Aggregation**: Configure how the group *displays its own* **Current** temperature/humidity, and how it *calculates* the **Target** temperature/humidity to send to its members.
    *   **For Current Values (Display)**: How the group summarizes sensor readings from its members.
        *   `Mean (Average)`: The classic average. Good for balanced comfort in large spaces.
        *   `Median`: Ignores outliers (e.g., a sensor near an open window or heat source).
        *   `Minimum / Maximum`: Shows the lowest/highest reading from any member.
    *   **For Target Values (Control)**: How the group determines the setpoint to send to its members.
        *   `Mean (Average)`: Sends the average of all desired setpoints.
        *   `Median`: Sends the median of all desired setpoints.
        *   `Minimum / Maximum`: Sends the lowest/highest of all desired setpoints.

*   **Precision Control (Rounding)**: Avoid sending values with excessive precision (like "21.33°C") to devices that expect strict steps.
    *   `No Rounding`: Exact values.
    *   `Half Degree (0.5°)`: Common for many digital devices.
    *   `Whole Numbers (1°)`: For simpler or older units.

*   **HVAC Mode Strategy**: Determines how the group decides its overall state (e.g., "Heating", "Cooling", or "Off").
    *   `Normal (Democratic)`: If most devices are active (e.g., heating), the group is active. It only switches to `off` when *all* members are off.
    *   `Off Priority (Master Switch)`: If *any* single device is turned off, the whole group reports as off. Great for quickly seeing if a zone is fully active.
    *   `Auto (Smart)`: The best of both worlds. It waits for *all* devices to acknowledge a command before changing state, preventing automation glitches when devices respond at different speeds.

*   **Feature Compatibility (Feature Strategy)**: How to handle devices with different capabilities (e.g., one supports "Fan Only", another doesn't).
    *   `Intersection (Strict)`: "Safe Mode". Only shows features that *every* device supports. Guarantees that every command works for everyone.
    *   `Union (Inclusive)`: "Power User". Shows *all* available features from any device. Commands are sent to everyone, but devices will simply ignore what they don't understand.

*   **External Temperature Sensor**: Select a separate sensor to be shown as the group's current temperature. Useful if the device sensors are inaccurate or poorly placed.
    *   ⚠️ **Note**: This only affects the group's display. It does **not** change how individual devices regulate their temperature (they still use their own internal sensors).

*   **Expose Attributes as Sensors**: Creates extra sensor entities for the group's temperature and humidity. Perfect for long-term history graphs (InfluxDB, etc.).

*   **Reliability Settings**: Fine-tune communication for chatty networks or sleepy devices.
    *   **Debounce Delay**: Waits a moment after you touch the controls before sending commands. Prevents flooding your network when you slide the temperature bar.
    *   **Repeat Count/Delay**: Retries commands automatically if a device misses them.

*   **Synchronization Mode**: Control how the group interacts with manual changes made directly on physical devices (e.g., adjusting controls on a wall unit).
    *   `Standard (One-way)`: **Default.** Group commands update members. Manual changes on members update the group's *average*, but don't change the other members.
    *   `Mirror (Two-way)`: **Magic Sync.** If you change settings on *one* device manually, the group detects this and instantly updates *all other* members to match. Keeps a zone in sync regardless of which unit you adjust.
    *   `Lock (Enforce Group)`: **The Boss.** If a device is changed manually, the group immediately reverts it back to the group's setting. Ideal for public spaces, or preventing tampering.
    *   **Sync Delay**: A configurable buffer (in seconds) to let manual adjustments settle before the sync logic kicks in.

## 📦 Installation

### Via HACS (Recommended)

1.  Open **HACS** > **Integrations**.
2.  Menu (⋮) > **Custom repositories**.
3.  Add `https://github.com/bjrnptrsn/climate_group_helper` as an `Integration`.
4.  Click **Install** on "Climate Group Helper".
5.  Restart Home Assistant.

### Manual

1.  Download the latest release from GitHub.
2.  Copy `custom_components/climate_group_helper` to your `custom_components` folder.
3.  Restart Home Assistant.

## 🛠️ Configuration

1.  Go to **Settings > Devices & Services > Helpers**.
2.  Click **+ Create Helper**.
3.  Choose **Climate Group Helper**.
4.  Follow the UI wizard to select your entities and preferences.

💡 **Tip:** You can always change these settings later by clicking on the helper entity in the list.

## 🔍 Troubleshooting

Something acting up? Enable debug logging in your `configuration.yaml` to see exactly what the group is thinking:

```yaml
logger:
  logs:
    custom_components.climate_group_helper: debug
```

## ❤️ Contributing

Found a bug or have an idea? [Open an issue](https://github.com/bjrnptrsn/climate_group_helper/issues) on GitHub. We love feedback!

## 📄 License

MIT License