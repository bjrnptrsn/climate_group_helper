# Changelog

## 0.3.0 - 2025-09-07

### Features

*   Add option to prioritize 'Off' HVAC Mode.

## 0.2.1 - 2025-09-06

### Fixes

*   Fixes an issue with the error `'ClimateGroup' object has no attribute '_logger_data'`.

## 0.2.0 - 2025-09-06

### Features

*   Add option to expose member entities as a state attribute.
*   Add translations for German, Spanish, French, Italian, Dutch, Polish, Portuguese, Ukrainian and simplified Chinese.

## 0.1.0 - 2025-09-05

Initial Release of the Climate Group Helper for Home Assistant.

This integration allows you to group multiple climate entities into a single, controllable entity.
It's designed to simplify climate control across multiple rooms or devices by synchronizing HVAC modes and target temperatures. The integration is fully configurable through the Home Assistant UI.

### Features

*   Group Climate Entities: Combine any number of climate entities into one group.
*   Synchronized Control: Change the HVAC mode and target temperature for all devices in the group simultaneously.
*   Aggregated Temperature: The group's current temperature is calculated as an average of the member temperatures.
*   Flexible Averaging: Choose between Mean, Median, Minimum, or Maximum for temperature averaging.
*   Temperature Rounding: Configure temperature precision to Exact, Half Degree (0.5°), or Whole Numbers (1°).
*   UI Configuration: Fully configured via the "Helpers" menu in Home Assistant. No YAML required.
*   Dynamic Updates: Modify group members and options without restarting Home Assistant.
