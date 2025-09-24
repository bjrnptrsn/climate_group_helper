# Home Assistant Climate Group Helper

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

**Climate Group Helper** is a [Home Assistant](https://www.home-assistant.io/) integration that allows you to group multiple climate entities into a single entity. Control all your thermostats as one unit, synchronize HVAC modes and target temperatures, and get aggregated temperature readings.

This integration is fully configured via the UI, no `configuration.yaml` editing is required.

## Features

*   **Group Climate Entities**: Combine any number of `climate` entities into one group.
*   **Synchronized Control**: Change the HVAC mode (heating, cooling, off, etc.) and target temperature for all devices in the group simultaneously.
*   **Aggregated Temperature**: The group's current temperature is calculated as an average of the member temperatures.
*   **Flexible Averaging**: Choose between different methods for calculating the average temperature:
    *   `Mean (Average)`: The average value of all members.
    *   `Median (Middle Value)`: The middle value.
    *   `Minimum`: The lowest value among all members.
    *   `Maximum`: The highest value among all members.
*   **Temperature Rounding**: Configure the precision of temperature values:
    *   `No Rounding`: Exact values.
    *   `Half Degree (0.5°)`: Round to half degrees.
    *   `Whole Numbers (1°)`: Round to whole numbers.
*   **HVAC Mode Strategy**: Choose how the group's HVAC mode is determined from its members. This is crucial for creating reliable automations.
    *   `Normal (Most common mode)`: The group's mode is the most frequent mode among its active (not `off`) members. The group only turns `off` when all members are `off`.
    *   `Off Priority`: The group's mode will be `off` if *any* member is `off`. This is useful to ensure the group state reflects that at least one device is inactive.
    *   `Auto`: A smart strategy that changes its behavior based on the last command sent to the group:
        *   When turning **off**: Behaves like `Normal`. The group waits until all members are `off` before its state changes to `off`.
        *   When turning **on** (e.g., to `heat`): Behaves like `Off Priority`. This ensures the group's state doesn't switch to `heat` prematurely while some devices are still `off`, making automations that wait for a state change more reliable.
*   **Feature Grouping Strategy**: Choose how the group exposes features (hvac modes, fan modes, preset modes, swing modes) from its members.
    *   `Intersection`: The group only exposes features and modes that are common to *all* member devices.
    *   `Union`: The group exposes all features and modes from *any* of its member devices. When a command is sent, it's only forwarded to the members that actually support it.
*   **External Temperature Sensor**: Optionally, override the group's current temperature with an external sensor. A selected sensor can be easily removed via a toggle in the group's options.
*   **Dynamic Updates**: Add or remove entities from the group without restarting Home Assistant (via the options dialog).
*   **UI Configuration**: Complete setup and management through the Home Assistant user interface (Config Flow).
*   **Expose Member Entities**: Optionally expose the member entities as a state attribute on the group entity.

## Installation

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

## Configuration

After installation, you can create a new Climate Group via the Helpers menu.

1.  In Home Assistant, go to **Settings > Devices & Services**.
2.  Select the **Helpers** tab.
3.  Click the **+ Create Helper** button.
4.  Find and select **"Climate Group Helper"**.
5.  A configuration dialog will open. Fill in the following fields:
    *   **Group Name**: A descriptive name for your group (e.g., "Living Room Heating").
    *   **Climate Entities**: Select all climate entities you want to add to this group.
    *   **Temperature Averaging Method**: Choose the method for calculating the average temperature (see Features).
    *   **Temperature Rounding**: Select the desired rounding method.
    *   **HVAC Mode Strategy**: Choose how the group's HVAC mode is determined. See the Features section for a detailed explanation of the `Normal`, `Off Priority`, and `Auto` strategies.
    *   **Feature Grouping Strategy**: Choose how to combine features from member devices (`Intersection` or `Union`).
    *   **External Temperature Sensor**: Select an optional sensor to provide the temperature for the group.
    *   **Expose Member Entities**: Optionally expose the member entities as a state attribute on the group entity.
6.  Click **"Submit"**.

The new climate group entity will be created and ready to use immediately.

## Modifying a Group

You can change the configuration of an existing group after creation:

1.  Go to **Settings > Devices & Services**.
2.  Select the **Helpers** tab.
3.  Find your climate group helper in the list and click on it to open the settings.
4.  Here you can adjust the member entities and calculation options.

## Contributions and Bug Reports

Contributions are welcome! If you find a bug or want to suggest a new feature, please create an [Issue in the GitHub repository](https://github.com/bjrnptrsn/climate_group_helper/issues).

## License

This project is licensed under the [MIT License](LICENSE).
