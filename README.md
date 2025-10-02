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

*   **Flexible Averaging**: Choose between different methods for calculating the average temperature
    *   `Mean (Average)`: The average value of all members
    *   `Median (Middle Value)`: The middle value
    *   `Minimum`: The lowest value among all members
    *   `Maximum`: The highest value among all members

*   **Temperature Rounding**: Configure the precision of temperature values
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

*   **Expose Member Entities**: Optionally, expose the member entities as a state attribute on the group entity

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
5.  A configuration dialog will open. Fill in the following fields:
    *   **Group Name**: A descriptive name for your group (e.g. "Living Room Heating").
    *   **Climate Entities**: Select all climate entities you want to add to this group.
    *   **Temperature Averaging Method**: Choose the method for calculating the average temperature (see Features).
    *   **Temperature Rounding**: Select the desired rounding method.
    *   **HVAC Mode Strategy**: Choose how the group's HVAC mode is determined. See the Features section for a detailed explanation of the `Normal`, `Off Priority`, and `Auto` strategies.
    *   **Feature Grouping Strategy**: Choose how to combine features from member devices (`Intersection` or `Union`).
    *   **External Temperature Sensor**: Select an optional sensor to provide the temperature for the group.
    *   **Expose Member Entities**: Optionally expose the member entities as a state attribute on the group entity.
6.  Click **"Submit"**.

The new climate group entity will be created and ready to use immediately.

## 🔄 Modifying a Group

You can change the configuration of an existing group after creation:

1.  Go to **Settings > Devices & Services**.
2.  Select the **Helpers** tab.
3.  Find your climate group helper in the list and click on it to open the settings.
4.  Here you can adjust the member entities and calculation options.

## ❤️ Contributions and Bug Reports

Contributions are welcome! If you find a bug or want to suggest a new feature, please create an [Issue in the GitHub repository](https://github.com/bjrnptrsn/climate_group_helper/issues).

## 📄 License

This project is licensed under the [MIT License](LICENSE).
