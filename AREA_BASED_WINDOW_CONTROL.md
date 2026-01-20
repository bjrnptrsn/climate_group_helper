# Area-Based Window Control Implementation

## Changes Implemented

### 1. const.py
- Added `CONF_WINDOW_SENSORS` for window sensor list
- Added `CONF_WINDOW_OPEN_DELAY` for open delay
- Added `DEFAULT_WINDOW_OPEN_DELAY = 15`
- Added `WindowControlMode.AREA_BASED` as new mode

### 2. window_control.py
New implementation with:
- **Area-based mode**: Tracks each window individually
- **Area logic**: Uses `entity_registry` and `area_registry` to identify areas of windows and thermostats
- **Granular control**: Turns off only members in the same area as the opened window
- **Multi-window**: Handles multiple open windows simultaneously
- **Backward compatibility**: Maintains legacy logic for room/zone sensors

#### How it works:
1. When a window opens → identifies its area
2. Finds all group members in the same area
3. Turns off only those members (after configured delay)
4. When window closes → restores only members that were turned off by that window
5. If multiple windows are open in the same area, restoration happens only when all are closed

### 3. config_flow.py
- Added imports for `CONF_WINDOW_SENSORS` and `CONF_WINDOW_OPEN_DELAY`
- Modified `async_step_window_control()` to show dynamic configuration:
  - If `window_mode = area_based` → shows multiple selector for windows
  - If `window_mode = on` → shows legacy configuration (room/zone sensor)

### 4. service_call.py
- Added optional `entity_ids` parameter to:
  - `call_immediate()`
  - `_execute_calls()`
  - `_generate_calls()`
  - `_get_unsynced_entities()`
- Allows targeting specific members instead of entire group

## Steps to Complete

### 1. Add translations in strings.json
Add under `config.step.window_control.data`:
```json
"window_sensors": "Window Sensors (Area-based)",
"window_open_delay": "Window Open Delay"
```

Add under `config.step.window_control.data_description`:
```json
"window_sensors": "Select all window sensors to monitor. When a window opens, only climate devices in the same area will be turned off.",
"window_open_delay": "Time to wait before turning off heating after a window opens."
```

Add under `selector.window_mode.options`:
```json
"area_based": "Area-based (automatic zone detection)"
```

### 2. Update __init__.py
Add to exported constants:
```python
CONF_WINDOW_SENSORS,
CONF_WINDOW_OPEN_DELAY,
DEFAULT_WINDOW_OPEN_DELAY,
```

### 3. Increment VERSION in config_flow.py
```python
VERSION = 7  # Was 6
```

### 4. Add migration in __init__.py
In `async_migrate_entry()` method, add:
```python
if config_entry.version < 7:
    # Migrate to version 7 - area-based window control
    new_options = {**config_entry.options}
    
    # If window control was enabled, keep legacy mode
    if new_options.get(CONF_WINDOW_MODE) == WindowControlMode.ON:
        # Keep existing configuration as-is (legacy mode)
        pass
    
    config_entry.version = 7
    hass.config_entries.async_update_entry(config_entry, options=new_options)
    _LOGGER.info("Migrated %s to version %s", config_entry.title, config_entry.version)
```

## How to Use

### Helper Configuration

1. Go to **Settings** > **Devices & Services** > **Helpers**
2. Find your Climate Group Helper
3. Click **Configure** > **Window Control**
4. Select **Window Mode**: `area_based`
5. Select all windows to monitor in **Window Sensors**
6. Configure **Window Open Delay** (default: 15s)
7. Configure **Close Delay** (default: 30s)

### Requirements

- **Areas configured**: Windows and thermostats must be assigned to areas in Home Assistant
- **Same area name**: Window and thermostat must be in the same area to be associated
- If an entity has no assigned area, the system tries to use the device's area

### Example

**Setup:**
- Area "Living Room": `binary_sensor.living_room_window`, `climate.living_room_thermostat`
- Area "Bedroom": `binary_sensor.bedroom_window`, `climate.bedroom_thermostat`
- Group: includes both thermostats

**Behavior:**
1. Open `living_room_window` → only `living_room_thermostat` turns off
2. Open `bedroom_window` → only `bedroom_thermostat` turns off
3. Close `living_room_window` → only `living_room_thermostat` turns back on
4. Close `bedroom_window` → only `bedroom_thermostat` turns back on

## Testing

1. Verify areas are configured correctly
2. Test single window open/close
3. Test multiple windows in different areas
4. Test multiple windows in same area
5. Check logs for debug: `custom_components.climate_group_helper: debug`

## Notes

- Legacy mode (room/zone sensor) continues to work for backward compatibility
- If `window_mode = area_based` but no sensors configured, control is disabled
- If an entity has no area, it's ignored by area-based control
