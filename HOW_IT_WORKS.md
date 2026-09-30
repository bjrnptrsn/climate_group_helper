# How Climate Group Helper Works

The [README](README.md) explains each feature on its own. This page shows how they fit together: who decides what your devices do, what takes priority, and why the group sometimes shows something different from what you set.

## Contents

- [The core idea: target and reality](#the-core-idea-target-and-reality)
- [Who sets the target](#who-sets-the-target)
- [What takes priority for a while](#what-takes-priority-for-a-while)
- [How the target reaches the devices](#how-the-target-reaches-the-devices)
- [When someone changes a device directly](#when-someone-changes-a-device-directly)
- [What the group shows](#what-the-group-shows)

---

## The core idea: target and reality

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/how_it_works_overview.svg" alt="The group's target feeds the devices through the temporary rules; the devices feed the group display; changes on a device go back to the target through the Sync Mode" width="700"/>
</p>

Everything in Climate Group Helper is built around one thing: the **group's target**. It is what the group wants your devices to do: mode, temperature, preset and so on.

- **The target changes only on purpose:** when you set something, a schedule slot starts, you pick a preset, or a device change is adopted by the Sync Mode. Nothing else touches it, and it survives Home Assistant restarts.
- **Temporary rules sit between the target and the devices.** An open window, an empty home, the Main Switch or a boost decide what the devices get *for now*. They never change the target. When a rule ends, the group sends the target again.
- **The group display shows reality.** Its temperature and mode are calculated from what the devices actually report. If the devices do something else than the target for a while, the display shows that.

You can always look up the target itself: it is the `target_state` attribute in the group's more-info dialog under **Attributes**.

---

## Who sets the target

| Source | How it changes the target |
|---|---|
| **You** | Through the dashboard, voice assistants, automations or scripts: anything that controls the group entity. |
| **Group presets** | Picking one sets all of its settings at once. Changing one of those settings afterwards leaves the preset. |
| **Schedule** | Each new slot writes its settings. A bypass slot overrides the main schedule while it runs, and the fallback stands in when no main slot is active. |
| **A device changed directly** | Only with a Sync Mode that adopts changes (Mirror, Mirror/Lock, Master/Lock for the master device, Adopt Only). See [below](#when-someone-changes-a-device-directly). |

**The last change wins.** The schedule, however, comes back: at the next slot, or, with a **Manual Hold** configured, once the hold runs out.

---

## What takes priority for a while

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/how_it_works_priority.svg" alt="Priority from top to bottom: Main Switch off, window open, nobody home, boost, group target. Isolated devices stand aside." width="700"/>
</p>

From top to bottom, the first one that applies decides what the devices get:

| Rule | What the devices get | Changes to the target meanwhile | When it ends |
|---|---|---|---|
| **Main Switch off** | Off, all of them. | Held back. | The target is sent again. |
| **Window open** | Off, or the window temperature. | Held back, unless **Adopt Manual Changes** lets them through for later — that works only while the window is the only active rule. | The target is sent again. |
| **Nobody home** | The away action: off, an offset, a fixed temperature or a preset. | Held back. | The target is sent again. |
| **Boost** | The boost temperature, for the time you asked for. | A direct command to the group ends the boost, and so does a device change that the Sync Mode adopts. | The target is sent again, including the schedule slot that is current by then. |

The first three are **blocks**. A few things are worth knowing about them:

- **They are enforced, not only started.** A device that deviates is set back to what the block demands — with **Turn Off** that is off, with **Set Temperature** the window temperature.
- **The schedule keeps running in the background.** A slot change during a block updates the target. The devices get it once the block ends.
- **Turning the group off always gets through.**
- **When one block ends while another is still active,** the other one takes over, and the target waits until all of them are gone.
- **A boost does not start during a block**, and a block starting ends a running boost.

**Isolated devices** are a separate case. While their isolation rule applies, they are left out of the group entirely: out of the readings, out of the commands, and out of window and presence control. Only the Main Switch still reaches them. When the rule ends, they rejoin the group.

---

## How the target reaches the devices

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/how_it_works_command_path.svg" alt="The group target of 21 °C is raised by a group offset of +2 and lowered by a bedroom member offset of −1, checked against the device's limits, and the bedroom thermostat receives 22 °C" width="700"/>
</p>

The target is the same for the whole group. On the way to each device, it is adjusted for that device:

- **Group Offset** shifts every device up or down, without changing the target underneath. It is paused while a block or a boost is active. It does not apply to what you set on the group yourself: those commands arrive exactly as given, and setting a temperature on the group resets the Group Offset to 0.
- **Member Offsets** shift individual devices, e.g. a bedroom that should always run a degree cooler.
- **Device limits** *(Union only)*: a device that cannot reach the temperature is turned off or set to its nearest limit (**Out-of-Bounds Action**). A device that does not support the mode is left alone or turned off (**Unsupported HVAC Mode Action**).
- **Member Template** turns a heat/cool range into plain heat or cool for devices that only have a single setpoint.
- **Minimum Temperature when Off** sends a device's lowest temperature when turning it off, for valves that don't close fully.

Which devices get a command:

- **Commands you give the group** go to every device that supports them.
- **Automatic commands** (schedule, Sync Mode) go only to the devices that differ from the target. **Force Retry** sends them to all devices anyway, for devices that don't reliably report their state.
- **Member Command Delay** paces the commands out instead of sending them all at once.

---

## When someone changes a device directly

Changing a device directly at the device or in its own app does not go through the group. What happens then depends on the **Sync Mode**, and for most modes on whether the setting is one of the selected **Sync Attributes**:

| Sync Mode | The change on the device… |
|---|---|
| **Disabled** | stays until the group sends its target the next time. |
| **Mirror** | becomes the new target and is passed on to the other devices. |
| **Lock** | is set back to the target. |
| **Mirror/Lock** | becomes the target for selected settings and is set back for the rest. |
| **Master/Lock** | becomes the target on the master device and is set back on all others. |
| **Adopt Only** | becomes the new target, but the other devices are left as they are. |

The full table, including what happens to settings that are not selected, is in the README under [Sync Modes](README.md#advanced-sync-modes).

Some cases don't follow the Sync Mode:

- **While a block is active,** the block decides: the device is set back to what the block demands (see above).
- **Isolated devices** are left alone.
- **Devices covered by the Member Template** always follow the group's range.
- **With Respect Member Off State (Sync),** a device you turn off is left off, and its off is not passed on to the others. If it is the last device still running, the whole group turns off.

---

## What the group shows

The group entity shows **what the devices do**, not what the group wants:

- **Current temperature and humidity** come from your external sensors, or are calculated from the devices (mean, median, minimum or maximum).
- **Target temperature** is calculated the same way from the devices' setpoints, or taken from the master device with **Use Master Target Temperature** (or **Use Master Target Humidity**). With **Correct member offset** (on by default), Member Offsets are taken out first, so a bedroom running a degree cooler doesn't pull the value down.
- **Mode** is combined from the devices' modes as set by the **HVAC Mode Strategy**.

This is why the display can differ from what you set: while an open window has switched the heating off, the group shows off, even though its target is still heat at 21 °C. Right after you change something, the group shows your value for a moment (**UI Grace Period**) before it switches to the devices' readings.

**External sensors** work independently of the target: they provide the room temperature, and with calibration configured, the group writes that value back to your thermostats.

To see what the group is doing and why, check the [attributes the group reports](README.md#what-the-group-reports-about-itself) or the status panel of the [Lovelace card](README.md#lovelace-card).
