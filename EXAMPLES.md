# Example Configurations

Real-world scenarios, ordered by complexity. Each example describes the situation, then lists **only the settings that matter** — everything else stays at its default.

> All examples beyond the Basic tier require **Advanced Mode: on**.

- [Basic](#basic) — no Advanced Mode needed, works out of the box
  - [1. Target Temperature Precision](#1-target-temperature-precision)
  - [2. HVAC Mode Strategy: Auto](#2-hvac-mode-strategy-auto)
- [Advanced](#advanced) — the setups most users end up with, all require Advanced Mode: on
  - [3. Multi-Room House with a Weekly Schedule](#3-multi-room-house-with-a-weekly-schedule)
  - [4. Single Thermostat with Window Control](#4-single-thermostat-with-window-control)
  - [5. Window Control with a Cover (Roller Shutter)](#5-window-control-with-a-cover-roller-shutter)
  - [6. Turn Off Heating When Nobody's Home](#6-turn-off-heating-when-nobodys-home)
  - [7. Reliable External Thermostat as Master](#7-reliable-external-thermostat-as-master)
  - [8. Virtual Presets for Simple TRVs](#8-virtual-presets-for-simple-trvs)
  - [9. External Sensor Calibration for TRVs](#9-external-sensor-calibration-for-trvs)
  - [10. Better Thermostat / Versatile Thermostat + CGH](#10-better-thermostat--versatile-thermostat--cgh)
  - [11. Schedule with Temporary Local Overrides](#11-schedule-with-temporary-local-overrides)
  - [12. Seasonal Shutdown via Schedule](#12-seasonal-shutdown-via-schedule)
  - [13. Calendar Bypass on Top of a Base Schedule](#13-calendar-bypass-on-top-of-a-base-schedule)
  - [14. Night Setback when the Schedule is Inactive](#14-night-setback-when-the-schedule-is-inactive)
- [Edge Cases](#edge-cases) — mixed hardware, multiple constraints, edge cases from real support issues
  - [15. Mixed Radiator + AC, One Device per Mode](#15-mixed-radiator--ac-one-device-per-mode)
  - [16. Underfloor Heating That Can't Turn Off](#16-underfloor-heating-that-cant-turn-off)
  - [17. Union Group with Out-of-Bounds Devices](#17-union-group-with-out-of-bounds-devices)
  - [18. Multi-Head Mini-Split, Shared Mode Only](#18-multi-head-mini-split-shared-mode-only)
  - [19. Interlocking Heat/Cool Across Two Systems](#19-interlocking-heatcool-across-two-systems)

---

## Basic

### 1. Target Temperature Precision

Two radiators in the same room, grouped as one entity. One only accepts whole-degree setpoints (1° steps); the other supports half-degree steps. Setting the group to 21.3°C would silently round differently — or fail — on the coarser device.

**Entities:** `climate.living_room_trv1` (0.5° steps), `climate.living_room_trv2` (1° steps only)

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv1`, `climate.living_room_trv2` |
| Precision | 1° |

**Result:** Every setpoint sent to members is rounded to whole degrees before dispatch — 21.3°C becomes 21°C for both devices, so the coarser TRV always receives a value it actually supports instead of silently clamping or rejecting it.

> **Tip:** This works with a single member too — CGH isn't just for groups.

---

### 2. HVAC Mode Strategy: Auto

Two radiators grouped as one entity, controlled by an external automation (not CGH's own Window Control) that turns the group off and on and needs to know from the group's reported `hvac_mode` whether its command has fully landed yet, so it can re-send if not.

**Entities:** `climate.living_room_trv1`, `climate.living_room_trv2`

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv1`, `climate.living_room_trv2` |
| HVAC Mode Strategy | Auto |

**Result:** `Auto` only reports the new mode once *every* member has actually reached it — in both directions:
- **Turning off** (behaves like **Normal**): the automation sends `off` to the group. The group keeps showing `heat` until *every* member has actually turned off; if one radiator lags behind, that's the automation's cue to re-send `off`. Only once all are off does the group report `off`.
- **Turning on** (behaves like **Off Priority**): the automation sends `heat` to the group. The group keeps showing `off` until *every* member has actually reached `heat`; if one radiator is still catching up, that's the automation's cue to re-send `heat`. Only once all are heating does the group report `heat`.

---

## Advanced

### 3. Multi-Room House with a Weekly Schedule

Three rooms, each with one TRV, following the same weekly schedule. Manual adjustments should hold until the schedule takes over again.

**Entities:** `climate.bedroom_trv`, `climate.living_room_trv`, `climate.kitchen_trv`, `schedule.house_weekly`

| Setting | Value |
|---|---|
| Members | `climate.bedroom_trv`, `climate.living_room_trv`, `climate.kitchen_trv` |
| Sync Mode | Lock |
| Schedule Entity | `schedule.house_weekly` |

**Schedule slots (YAML in additional data):**
```yaml
# Morning (06:00–08:00)
hvac_mode: heat
temperature: 21.0

# Day (08:00–17:00)
hvac_mode: heat
temperature: 19.5

# Evening (17:00–22:00)
hvac_mode: heat
temperature: 21.5

# Night (22:00–06:00)
hvac_mode: heat
temperature: 18.0
```

**Result:** The schedule drives all rooms. A manual change is respected until the next slot begins, which then takes over again.

---

### 4. Single Thermostat with Window Control

One thermostat, but heating should pause automatically while a window is open — no grouping needed at all.

**Entities:** `climate.living_room_trv`, `binary_sensor.living_room_window`

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv` |
| Window Control | on |
| Room Sensor | `binary_sensor.living_room_window` |
| Window Action | Turn Off |

**Result:** Window opens → heater turns off. Window closes → previous state restores.

> **Tip:** This works with a single member too — CGH isn't just for groups.

---

### 5. Window Control with a Cover (Roller Shutter)

Same idea as Example 4, but the "window sensor" is a roller shutter, and instead of turning off completely it should drop to a frost-protection setpoint.

**Entities:** `climate.bedroom_trv`, `cover.bedroom_shutter`

| Setting | Value |
|---|---|
| Members | `climate.bedroom_trv` |
| Window Control | on |
| Room Sensor | `cover.bedroom_shutter` |
| Window Action | Set Temperature |
| Window Temperature | 16.0 |

**Result:** Shutter open/opening/closing → treated as "window open", temperature drops to 16 °C. Shutter closed → heating restores. (Any state other than fully `closed` counts as open.)

---

### 6. Turn Off Heating When Nobody's Home

Save energy automatically based on presence, without writing a separate automation.

**Entities:** `climate.living_room_trv`, `person.wife`, `person.husband`

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv` |
| Presence Control | on |
| Presence Trigger | `person.wife`, `person.husband` |
| Away Action | Turn Off |
| Away Delay | 300 (seconds) |
| Return Delay | 60 (seconds) |

**Result:** Once *all* trigger entities report "away" for 5 minutes, heating turns off. As soon as anyone returns, it restores after a 1-minute confirmation delay.

> **Variant:** Set **Away Action: Away Offset** with **Away Offset: -3.0** instead of turning off completely — useful if the room shouldn't go fully cold (e.g. a room with plants or pets).

---

### 7. Reliable External Thermostat as Master

Cheap TRVs measure the room temperature poorly. Let one accurate device be the source of truth, and mirror it to the rest.

**Entities:** `climate.generic_thermostat` (master, external sensor), `climate.trv1`, `climate.trv2`

| Setting | Value |
|---|---|
| Members | `climate.generic_thermostat`, `climate.trv1`, `climate.trv2` |
| Master Entity | `climate.generic_thermostat` |
| Sync Mode | Master/Lock |

**Result:** Changes on the master propagate to every member. Direct changes on `climate.trv1` or `climate.trv2` are reverted.

---

### 8. Virtual Presets for Simple TRVs

Simple TRVs don't support `preset_mode` at all — no "Eco"/"Comfort" concept, just a setpoint. Give them virtual presets by routing preset selection through a `generic_thermostat` master.

**Entities:** `climate.generic_thermostat` (master, fixed preset temperatures), `climate.trv1`, `climate.trv2`

| Setting | Value |
|---|---|
| Members | `climate.generic_thermostat`, `climate.trv1`, `climate.trv2` |
| Master Entity | `climate.generic_thermostat` |
| Sync Mode | Master/Lock |

Configure the `generic_thermostat`'s away/home presets with the temperatures you want (e.g. Eco = 17 °C, Comfort = 21 °C).

**Result:** Selecting a preset on the group changes the master's target temperature accordingly, which then syncs to `climate.trv1` and `climate.trv2` — giving devices that have no native preset support a working preset selector.

---

### 9. External Sensor Calibration for TRVs

A TRV's built-in sensor sits right next to a hot pipe and reads too high. Correct it using a real room sensor.

**Entities:** `climate.living_room_trv`, `sensor.living_room_temperature`, `number.living_room_trv_calibration`

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv` |
| External Sensors | `sensor.living_room_temperature` |
| Calibration Target | `number.living_room_trv_calibration` |
| Calibration Mode | Offset |
| Calibration Heartbeat | 5 (minutes) |

**Result:** CGH computes the offset between the TRV's internal reading and the external sensor, writes it to the calibration `number` entity, and re-sends it periodically to prevent battery-device timeouts.

> Skip this if your devices are already handled by Better Thermostat or Versatile Thermostat — see Example 10.

---

### 10. Better Thermostat / Versatile Thermostat + CGH

You already use a dedicated regulation integration (Better Thermostat or Versatile Thermostat) for per-device algorithms (MPC/PID/TPI) — each device regulates its own valve/output independently. CGH doesn't need to (and generally shouldn't) force a shared setpoint on top of that; its job is the orchestration each regulation integration doesn't do by itself: Schedule, Window Control, Presence, a combined overview entity.

**Variant A — independent rooms, shared orchestration only (most common):**

Each room keeps its own setpoint, managed entirely by its own BT/VT instance. CGH only supplies what's shared across rooms.

**Entities:** `climate.bt_living_room_trv`, `climate.bt_bedroom_trv`

| Setting | Value |
|---|---|
| Members | `climate.bt_living_room_trv`, `climate.bt_bedroom_trv` |
| Sync Mode | Disabled |
| Schedule Entity | `schedule.house_weekly` |
| Window Control | on — centralize this in CGH instead of configuring it per-device |
| Calibration | off — the regulation integration handles this |
| External Sensors | off — the regulation integration uses its own |

**Result:** Each BT/VT instance keeps regulating its own device independently. CGH only pushes the schedule's `hvac_mode`/`temperature` to each room and handles window/presence centrally — it never tries to keep rooms in sync with each other.

**Variant B — one accurate BT/VT device leads plain TRVs (Master/Lock):**

A room has one well-calibrated BT/VT device (good external sensor, proper regulation) and one or more plain, unregulated TRVs elsewhere that should simply follow its target rather than run their own crude on-device logic — the plain TRVs profit from BT/VT's better sensor without needing BT/VT themselves.

**Entities:** `climate.bt_living_room_trv` (Better Thermostat, external sensor), `climate.bedroom_trv`, `climate.hallway_trv` (plain TRVs)

| Setting | Value |
|---|---|
| Members | `climate.bt_living_room_trv`, `climate.bedroom_trv`, `climate.hallway_trv` |
| Master Entity | `climate.bt_living_room_trv` |
| Sync Mode | Master/Lock |

**Result:** The BT/VT instance keeps regulating its own device via its own algorithm; its resulting target temperature is also pushed to `climate.bedroom_trv` and `climate.hallway_trv`, which just apply it directly. Manual changes on the plain TRVs are reverted. Avoid `Mirror`/`Mirror-Lock` here — they adopt *any* member's `hvac_mode`/temperature change as if it were deliberate user input, and Versatile Thermostat's own window/safety/power managers can change those attributes on their own, which would get mirrored to every other member.

---

### 11. Schedule with Temporary Local Overrides

During certain slots (e.g. a "comfort" evening slot), occupants should be able to nudge the temperature without the group instantly reverting it — but other slots should stay strictly locked.

**Entities:** `climate.bedroom_trv`, `schedule.bedroom_weekly`

| Setting | Value |
|---|---|
| Members | `climate.bedroom_trv` |
| Sync Mode | Lock |
| Schedule Entity | `schedule.bedroom_weekly` |

**Schedule slots using meta-keys:**
```yaml
# Comfort slot — local adjustments allowed
preset_mode: comfort
sync_mode: disabled

# Boost slot — elevated setpoint, no sync interference
preset_mode: comfort
group_offset: 1.5
sync_mode: disabled
```

**Result:** The `sync_mode: disabled` meta-key temporarily suspends Lock enforcement for that slot only — outside of it, the schedule is back in full control.

---

### 12. Seasonal Shutdown via Schedule

Turn a group off for an extended period (e.g. summer) and back on again automatically via a calendar event, instead of flipping the Main Switch by hand.

**Entities:** `climate.living_room_trv`, `schedule.house_weekly` (or a `calendar.*` entity)

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv` |
| Schedule Entity | `schedule.house_weekly` |

**Schedule slots using the `turn_off` meta-key:**
```yaml
# Summer slot — block the group entirely
turn_off: true

# Autumn slot — release the block again
turn_off: false
hvac_mode: heat
temperature: 20.0
```

**Result:** `turn_off: true` blocks the group exactly like turning the Main Switch off — all members turn off and stay blocked. `turn_off` is a one-shot trigger, not a state tied to the slot: it stays active until a later slot explicitly sets `turn_off: false` again, so the slot that should end the shutdown must set it explicitly.

---

### 13. Calendar Bypass on Top of a Base Schedule

A weekly `schedule.*` entity already drives day-to-day heating. On top of that, a shared household `calendar.*` (e.g. a Google Calendar everyone can add events to) should be able to temporarily override it — a guest staying over, a day working from home, a party — without touching the base schedule at all.

**Entities:** `climate.living_room_trv`, `schedule.house_weekly` (base), `calendar.household_overrides` (bypass)

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv` |
| Schedule Entity | `schedule.house_weekly` |
| Bypass Entity | `calendar.household_overrides` |

**Base schedule slot (unchanged):**
```yaml
hvac_mode: heat
temperature: 19.5
```

**Calendar bypass event** ("Guest Room" event, 18:00–23:00, Description field):
```yaml
hvac_mode: heat
temperature: 22.0
```

**Result:** Outside the calendar event, `climate.living_room_trv` follows the base schedule (19.5 °C). While the "Guest Room" event is active, its 22.0 °C wins — the base schedule keeps running in the background and is restored automatically the moment the event ends, no need to touch the weekly schedule at all.

> **Tip — invalid YAML only breaks at the worst moment:** a calendar event's Description field must contain *only* valid YAML (see [README § Using a Calendar Entity](README.md#using-a-calendar-entity)) — a stray word, a missing colon, or wrong indentation makes CGH skip the event entirely, silently, and you'll only notice when the slot was supposed to start and nothing happened. Don't type the YAML freehand into each new event: keep one known-good event as a template and **copy or duplicate it** for every new override (most calendar UIs support duplicating an event), then only edit the times and the values — this avoids reintroducing a syntax error from scratch each time. If you're unsure about a new block, paste it into a local editor with YAML syntax checking (e.g. VS Code) before saving the event.

---

### 14. Night Setback when the Schedule is Inactive

`schedule.*` entities report `off` without any slot attributes outside the configured time blocks. Instead of building a gapless 24/7 schedule (an explicit low-temperature block for every inactive hour), define one fallback state that the group applies whenever no slot is active.

**Entities:** `climate.living_room_trv`, `schedule.house_weekly`

| Setting | Value |
|---|---|
| Members | `climate.living_room_trv` |
| Schedule Entity | `schedule.house_weekly` |
| Inactive Schedule Fallback | see below |

**Inactive Schedule Fallback** (options flow → Schedule section, YAML):
```yaml
temperature: 17.0
hvac_mode: heat
```

**Heating slot (e.g. 06:00–22:00):**
```yaml
hvac_mode: heat
temperature: 21.0
```

**Result:** During the active slot the room is heated to 21 °C. The moment the slot ends, the group automatically applies the fallback and lowers the setpoint to 17 °C — no 24/7 blocks needed.

> **Note — turning the group fully off:** for a complete shutdown outside active hours, use `hvac_mode: off` as the fallback, not the `turn_off` meta-key. `turn_off: true` is a one-shot trigger for the Main Switch block that stays active until a slot explicitly releases it with `turn_off: false` — put it in the fallback, and the next heating slot would remain blocked.

**Changing the fallback seasonally without touching the options flow:** call `climate_group_helper.set_schedule_fallback_payload` from an automation (e.g. a yearly summer/winter trigger) instead of reconfiguring the group each time:
```yaml
service: climate_group_helper.set_schedule_fallback_payload
target:
  entity_id: climate.living_room
data:
  fallback_payload: |
    temperature: 19.0
    hvac_mode: heat
```
The override takes effect immediately (if the slot is currently inactive). Enable **Retain Changes Made via Service (Schedule)** if it should also survive a restart. Call the service again with `fallback_payload:` omitted or empty to revert to the configured default.

---

## Edge Cases

### 15. Mixed Radiator + AC, One Device per Mode

A room has a heat-only radiator (Wiser) and a heat/cool AC (Daikin/Faikin). The AC must **never** heat, even though it advertises `heat` — and each device needs different handling depending on which mode is active. (Based on a real mixed-hardware report, GitHub #99.)

**Entities:** `climate.wiser_radiator` (heat/off only), `climate.daikin_ac` (heat_cool/cool/heat/dry/fan_only/off)

| Setting | Value |
|---|---|
| Members | `climate.wiser_radiator`, `climate.daikin_ac` |
| Feature Strategy | Union |
| Unsupported HVAC Mode Action | Off |
| Sync Mode | Disabled |
| Member Isolation | on |
| **Isolation Rule 1** | Trigger: HVAC Mode `heat` → Isolate `climate.daikin_ac` (Set HVAC Mode `off`) |
| **Isolation Rule 2** | Trigger: HVAC Mode `cool` → Isolate `climate.wiser_radiator` (Set HVAC Mode `off`) |

**Result:** In `heat`, the AC is fully isolated (off, and its presets/fan/swing drop out of the group). In `cool`, the radiator is isolated the same way — symmetric behavior on both sides, no mode bleed-through. This needs **multiple isolation rules**, one per device/trigger pair.

---

### 16. Underfloor Heating That Can't Turn Off

Water-based underfloor heating has no `off` mode — it only supports `heat`. When the group needs to stop heating (e.g. switching to cooling elsewhere in summer), the floor loop needs a safe fallback instead of a real `off` call. (Based on GitHub #100.)

**Entities:** `climate.floor_heating` (heat only, no off), `climate.bedroom_ac` (heat/cool)

| Setting | Value |
|---|---|
| Members | `climate.floor_heating`, `climate.bedroom_ac` |
| Feature Strategy | Union |
| Member Isolation | on |
| Isolation Rule 1 | Trigger: HVAC Mode `cool`, `dry`, `fan_only` → Isolate `climate.floor_heating` (Set Preset Mode `building_protection`) |

**Result:** Switching the group to `cool` isolates the floor heating into a low, safe preset instead of sending it an unsupported `off`. Switching back to `heat` restores it to the group.

---

### 17. Union Group with Out-of-Bounds Devices

Mixing devices with different temperature ranges — a low-range TRV and an AC with a higher minimum. When the target falls outside a device's range, that device should be excluded rather than clamped to a nonsensical value.

**Entities:** `climate.trv` (range 5–30 °C), `climate.ac` (range 16–30 °C)

| Setting | Value |
|---|---|
| Members | `climate.trv`, `climate.ac` |
| Feature Strategy | Union |
| Out-of-Bounds Action | Off |

**Result:** Target set to 14 °C → the AC can't reach it (min 16 °C) and turns off; the TRV keeps heating. Target set to 22 °C → both are within range and stay active.

---

### 18. Multi-Head Mini-Split, Shared Mode Only

A 4-head mini-split system (e.g. Daikin via Faikin) requires all heads to share the same HVAC mode to function correctly, but each room still needs its own setpoint and fan speed. Full Mirror/Lock would wrongly force temperature and fan speed to match too. (Based on GitHub #36.)

**Entities:** `climate.head_living_room`, `climate.head_bedroom`, `climate.head_office`, `climate.head_kitchen`

| Setting | Value |
|---|---|
| Members | all four heads |
| Sync Mode | Mirror |
| Sync Attributes | `hvac_mode` only |

**Result:** Changing `hvac_mode` on any head (e.g. switching one to `cool`) mirrors that mode to the rest of the group. Temperature and fan speed are *not* in `sync_attributes`, so each head keeps its own independent setpoint — Mirror ignores unselected attributes entirely.

---

### 19. Interlocking Heat/Cool Across Two Systems

An HRV (heat recovery ventilator) with heat/cool/auto acts as the "conductor". Several independent underfloor heating zones must turn fully off whenever the HRV is cooling, and back on when it's heating — pure interlocking, no shared setpoint. (Based on GitHub #66.)

**Entities:** `climate.hrv` (master), `climate.floor_zone_1` … `climate.floor_zone_5`

| Setting | Value |
|---|---|
| Members | `climate.hrv`, `climate.floor_zone_1` … `climate.floor_zone_5` |
| Master Entity | `climate.hrv` |
| Sync Mode | Master/Lock |
| Feature Strategy | Union |
| Unsupported HVAC Mode Action | Off |

**Result:** The HRV drives the group's `hvac_mode`. When it enters `cool` (manually or via `auto`), the floor zones — which don't support `cool` — are automatically turned off via Union's unsupported-mode handling. Switching the HRV back to `heat` restores them.

---

## Tips

- **Start simple:** get basic grouping working first (just Members, no other settings), then layer on features one at a time.
- **Advanced Mode:** toggle it on in the group's configuration to unlock everything beyond Basic-tier settings (Examples 3–18).
- **Sync Mode:** use `Lock` if the group should be the single source of truth; use `Mirror` if manual member changes should be adopted; use `Mirror/Lock` when only some attributes should sync (Example 17).
- **Blocking priority:** Main Switch > Window Control > Presence Control — if several are active at once, only the highest-ranked one's action is sent to members.
- **Schedule + Boost:** Boost outranks the schedule. Schedule slot changes still run in the background during a boost.
- **Calibration:** only use CGH's own calibration if you're not already using Better Thermostat or Versatile Thermostat — they handle their own (Example 10).
- **Multiple Isolation Rules:** when different member devices need different reactions to the same trigger (or different triggers entirely), add one isolation rule per device — see Examples 14 and 15.
