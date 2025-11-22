# 🌡️ Home Assistant Climate Group Helper

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

The **Climate Group Helper** for Home Assistant lets you combine multiple thermostats into a single, powerful entity. Simplify your dashboard and automations by controlling all your climate devices as one, with a fully UI-driven setup.

## ✨ Features

This integration provides a set of core features for grouping climate devices, along with extensive customization options to tailor the group's behavior to your needs.

### 🚀 Core Features

*   **Unified Control**: Treat multiple thermostats as a single, unified entity
*   **Synchronized Operation**: Simultaneously set various attributes for all grouped devices (e.g. mode, temperature, humidity)
*   **Aggregated Sensors**: Get a single, combined reading for temperature and humidity from all members
*   **Dynamic Grouping**: Add or remove devices from a group on-the-fly without restarting Home Assistant
*   **UI-Managed**: Set up and manage everything through the Home Assistant interface (**Helpers** tab)

### ⚙️ Customization Options

*   **Flexible Averaging for Current Values**: Choose how the group's *current* temperature and humidity are calculated from its members.
    *   `Mean (Average)`: The average value of all members.
    *   `Median (Middle Value)`: The middle value.
    *   `Minimum`: The lowest value among all members.
    *   `Maximum`: The highest value among all members.

*   **Flexible Averaging for Target Values**: Independently choose how the group's *target* temperature and humidity are calculated.
    *   `Mean (Average)`: The average value of all members.
    *   `Median (Middle Value)`: The middle value.
    *   `Minimum`: The lowest value among all members.
    *   `Maximum`: The highest value among all members.

*   **Temperature Rounding**: Configure the precision of *target* temperature values to avoid sending fractional setpoints.
    *   `No Rounding`: Exact values
    *   `Half Degree (0.5°)`: Round to half degrees
    *   `Whole Numbers (1°)`: Round to whole numbers

*   **HVAC Mode Strategy**: Defines how the group's overall state (e.g. `heat` or `off`) is determined. This is crucial for reliable automations
    *   `Normal (Most common mode)`: The group takes on the mode that most of its active members are in. The group only turns `off` when *all* members are off
    *   `Off Priority`: The group will report as `off` if *any* single member is off. This is useful to quickly see if not all devices are active
    *   `Auto (Smart)`: A dynamic strategy that helps make automations more reliable by changing its behavior based on the last command
        *   **When turning ON** (e.g. to `heat`): The group waits for *all* members to turn on before changing its state to `heat`. This prevents automations from triggering too early (same as `Off Priority`)
        *   **When turning OFF**: The group waits for *all* members to turn off before changing its state to `off` (same as `Normal (Most common mode)`)

*   **Feature Grouping Strategy**: Choose how the group exposes features (hvac modes, fan modes, preset modes, swing modes) from its members
    *   `Intersection`: The group only exposes features and modes that are common to *all* member devices
    *   `Union`: The group exposes all features and modes from *any* of its member devices. When a command is sent, it's only forwarded to the members that actually support it

*   **External Temperature Sensor**: Optionally, override the group's current temperature with an external sensor

*   **Expose Attributes as Sensors**: Optionally, create separate `sensor` entities for the group's aggregated attributes (temperature, humidity). This enables history tracking and simplifies using these values in automations or the UI.

*   **Expose Member Entities**: Optionally, expose the member entities as a state attribute on the group entity

*   **Reliability Settings (Debounce and Retry)**: Fine-tune the communication with your climate devices to handle unreliable networks or devices that don't always respond to commands.
    *   **Debounce Delay**: Waits for a specified time (in seconds) after a UI change before sending the command. If other changes are made within this delay, the timer resets. This is useful to prevent a flood of commands when making rapid changes.
    *   **Repeat Count**: The number of times to send the final command to ensure it's received.
    *   **Repeat Delay**: The delay (in seconds) between each repeated command.

## 📦 Installation

### Via HACS (Home Assistant Community Store) - Recommended

1.  Ensure [HACS](https://hacs.xyz/) is installed.
2.  Go to HACS > Integrations.
3.  Click the 3 dots in the top right and select "Custom repositories".
4.  Add the URL of this repository (`https://github.com/bjrnptrsn/climate_group_helper`) as an `Integration`.
5.  The "Climate Group Helper" integration should now appear. Click "Install".
6.  Restart Home Assistant.

### Manual Installation

1.  Download the latest version from the [Release page](https://github.com/bjrnptrsn/climate_group_helper/releases).
2.  Copy the `custom_components/climate_group_helper` folder into the `custom_components` directory of your Home Assistant installation.
3.  Restart Home Assistant.

## 🛠️ Configuration

After installation, you can create a new Climate Group via the Helpers menu.

1.  In Home Assistant, go to **Settings > Devices & Services**.
2.  Select the **Helpers** tab.
3.  Click the **+ Create Helper** button.
4.  Find and select **"Climate Group Helper"**.
5.  A configuration dialog will open. Configure the group settings as needed.
6.  Click **"Submit"**.

The new climate group entity will be created and ready to use immediately.

## 🔄 Modifying a Group

You can change the configuration of an existing group after creation:

1.  Go to **Settings > Devices & Services**.
2.  Select the **Helpers** tab.
3.  Find your climate group helper in the list and click on it to open the settings.
4.  Here you can adjust the member entities and calculation options.

## 🔍 Troubleshooting

If you encounter issues or need to gather more detailed information for bug reports, you can enable debug logging. Add this to your Home Assistant `configuration.yaml` file:

```yaml
logger:
  logs:
    custom_components.climate_group_helper: debug
```

After adding this, restart Home Assistant. Then you will find more detailed entries in your Home Assistant logs. This information also might be helpful when reporting issues.

## ❤️ Contributions and Bug Reports

Contributions are welcome! If you find a bug or want to suggest a new feature, please create an [Issue in the GitHub repository](https://github.com/bjrnptrsn/climate_group_helper/issues).

## 📄 License

This project is licensed under the [MIT License](LICENSE).
