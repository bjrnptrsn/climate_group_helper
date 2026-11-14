# Climate Group Helper Card — developer guide

This folder holds the source of the dashboard card that ships with the
Climate Group Helper integration. You do not need it to use the card: the
integration loads the built bundle itself (via `add_extra_js_url`), so there is
no dashboard resource to add. The source is here so the shipped bundle can be
reviewed and rebuilt — and so you can build your own card, or fork this one.

- **Your own card** needs nothing from this folder: a group is an ordinary
  `climate` entity with extra attributes and services. Read
  [The data contract](#the-data-contract) and [Services](#services).
- **Changing this card** means forking it — see [Forking](#forking-this-card).
  Do not edit the bundle the integration ships: every update of the
  integration overwrites it.

## Build

```bash
cd frontend
npm ci
npm run build      # → ../custom_components/climate_group_helper/www/climate-group-helper-card.js
npm run tsc        # type check
npm run test:run   # unit tests
```

The published `main` tree carries no test files; `npm run test:run` passes
there without running anything.

## Develop

```bash
npm run dev
```

opens a playground (`index.html`) with the card in demo mode: made-up groups
and members that change every few seconds, no Home Assistant needed. Add
`?lang=de` (or any other supported language) to the URL to switch the
language; light and dark follow your system.

The playground only approximates Home Assistant: there is no theme and no
`ha-card` styling, so `index.html` sets a few theme variables and draws the
card frame itself. The card editor does not work there — it needs Home
Assistant's entity picker. Check the real look in Home Assistant: build and
deploy the integration, or load your fork as a dashboard resource.

## The data contract

A group is a `climate` entity. Everything specific to Climate Group Helper is
in its state object (`hass.states['climate.my_group']`) — there is no
WebSocket API and no extra endpoint. Home Assistant's entity registry
(`hass.entities`) is there as for any card; the shipped card uses its
`device_id` to find each member's battery.

"Offline" below means unavailable or unknown.

**Missing means "not active" or "not set up", never `null`.** Most attributes
appear only while they have something to say, and a group in Simple Mode (the
default for new groups) has none of the Advanced Mode attributes at all. Read
every attribute as optional.

### Standard climate attributes

Home Assistant's usual climate attributes, unchanged in meaning: `state` (the
group's HVAC mode), `current_temperature`, `temperature`, `target_temp_low`,
`target_temp_high`, `min_temp`, `max_temp`, `target_temp_step`,
`current_humidity`, `humidity`, `min_humidity`, `max_humidity`,
`target_humidity_step`, `hvac_action`, `hvac_modes`, `preset_mode`,
`preset_modes`, `fan_mode`, `fan_modes`, `swing_mode`, `swing_modes`,
`swing_horizontal_mode`, `swing_horizontal_modes`, `temperature_unit`,
`supported_features`.

What is specific to a group:

- **`min_temp` / `max_temp`** are the range the whole group accepts — use them
  for a dial, not the members' own limits.
- **`preset_modes` includes the group's own presets** next to the devices'
  presets. While one of the group's presets is active, **`preset_mode`
  reports its name**, even though no device knows it.
- **`temperature` is what the devices run on**: the members' average (or the
  master's value), so it already contains the group offset. The group's own
  intended setpoint, without the offset, is in `target_state`.
- **`assumed_state`** is `true` while the members are in different modes.

### Members

| Attribute | |
|---|---|
| `member_entities` | Entity ids of all members. Always present. Read each member's state from `hass.states` yourself — there is deliberately no map of member states. |
| `entity_id` | The same list, only when "Expose Member List" is enabled in the group's settings. Use `member_entities`. |
| `total_member_count` | All configured members. |
| `active_member_count` | Members that are neither off nor offline. |
| `current_hvac_modes` | The modes of the members the group currently counts (without isolated and offline ones) — no entity mapping; for a row of dots, not per-member logic. |
| `member_divergence` | `{attribute: {entity_id: value}}` for every setting the members disagree on; `{}` when they agree. The values are what the devices really report; the comparison accounts for member offsets — two devices at +1 and −1 count as agreeing. Isolated and offline members are left out. |
| `member_offsets` | `{entity_id: offset}` — configured per-member temperature offsets, only those ≠ 0; missing when there are none. Explains why a device's setpoint differs from the group value. |
| `isolated_members` | Members an isolation rule currently excludes. |
| `oob_members` | Members whose own temperature range the group's target lies outside of. |
| `master_entity_id` | The configured master device; missing without one. |
| `master_fallback_active` | `true` while the master is offline and the group computes without it. |

### Why the group is not acting

| Attribute | |
|---|---|
| `blocking_reason` | `{"source": "...", "since": "<ISO>"}` — the blocker in charge, already prioritised (`switch` > `window` > `presence`). Render this; do not derive the priority yourself. After a restart, `since` counts from the restart. Missing when nothing blocks. |
| `blocking_sources` | All active blockers, sorted alphabetically, not by priority: `presence`, `switch`, `window`. The raw list, for badges. |
| `presence_fallback` | `true` while presence blocks and a presence sensor is offline — "sensor dead" rather than "away". |
| `main_switch_entity_id` | The group's Main Switch (`switch.*`). Advanced Mode; missing until the switch is set up. |
| `main_switch_action` | What the Main Switch does to the devices while off: `off`, `temperature` or `release`. Present together with `main_switch_entity_id`. |

### What the group intends and where it came from

| Attribute | |
|---|---|
| `target_state` | The settings the group holds for its devices (`{attribute: value}`), without the group offset. |
| `last_source` | What last changed `target_state`: `ui`, `group`, `sync_mode`, `adopt_only`, `window_control`, `schedule`. |
| `last_changed` / `last_entity` | When, and which entity triggered it. |
| `last_active_hvac_mode` | The last mode other than `off`. |
| `group_offset` | The group's temperature offset. Always present, also at `0.0`. |
| `offset_entity_id` | The `number.*` entity that sets the group offset. Advanced Mode; missing when the entity does not exist. |

### What is in effect

| Attribute | |
|---|---|
| `enabled_features` | Configured modules: `window`, `presence`, `schedule`, `sync`, `isolation`, `range_template`, `calibration`, `master`. Always present, also as `[]` — tells "not set up" from "not received yet". |
| `config_overrides` | Pause keys a schedule slot or group preset currently applies (`window_mode`, `presence_mode`, `calibration_mode`, `isolation_bypass`, `sync_mode`, `sync_attributes`, `group_offset`). |
| `active_virtual_preset` | The active group preset; missing when none is active. |
| `runtime_group_presets` | Group presets set via service, with their values (`{name: {attribute: value}}`). |

### Advanced Mode only

Missing entirely in Simple Mode.

| Attribute | |
|---|---|
| `effective_sync_mode` / `effective_sync_attributes` | Sync settings in force right now, including a slot's or preset's override. `effective_sync_mode` is present in every Advanced Mode group — a reliable marker for "Advanced Mode". |
| `active_schedule_entity` / `active_schedule_bypass_entity` | The schedule and bypass entities in use. |
| `schedule_entity_overridden` / `schedule_bypass_entity_overridden` | Only `true`: a service call replaced the configured entity. |
| `active_schedule_layer` | Which schedule layer the last slot came from: `main`, `bypass`, `fallback`, `none`. Missing before the first slot is read — read that as `none`. |
| `active_schedule_slot_title` | Title of the running calendar event; missing for schedule helpers. |
| `schedule_fallback_payload_active` | `true` while the fallback slot applies. |
| `boost_temperature` / `boost_until` | Setpoint and end (ISO) of a running boost. |
| `schedule_hold_until` | When a manual change stops holding against the schedule (ISO). |
| `schedule_hold_duration` | Hold duration in minutes, only when set via service; missing while the configured duration applies — so it is not the effective duration. For a countdown use `schedule_hold_until`. |

`boost_until` and `schedule_hold_until` are the countdown sources; their
presence alone answers "is an override running?".

A few further attributes are diagnostic and not part of this contract.

## Services

What a card calls. All target the group with `entity_id`.

| Service | Use |
|---|---|
| `climate.set_temperature`, `set_hvac_mode`, `set_humidity`, `set_preset_mode`, `set_fan_mode`, `set_swing_mode`, `set_swing_horizontal_mode` | Standard climate control. A group preset is set like any preset. A direct `set_temperature` resets the group offset to 0. |
| `switch.turn_on` / `switch.turn_off` | The Main Switch, on `main_switch_entity_id`. |
| `number.set_value` | The group offset, on `offset_entity_id`; its range and step are in that entity's attributes. |
| `climate_group_helper.boost` | Advanced Mode. `duration` (minutes, required) and exactly one of `temperature` or `temperature_offset`; optional `hvac_mode` (`heat`, `cool`, `dry`, `fan_only`). The service does not range-check the temperature — keep it within `min_temp`/`max_temp`. |
| `climate_group_helper.reset` | Advanced Mode. Booleans `boost`, `offset`, `schedule`, `bypass`, `fallback`, `presets`, or `everything`; at least one must be set. `boost: true` ends a running boost. |

A boost the group cannot run is rejected (a block is active, or no member can
take its mode), and so is an empty reset; Home Assistant shows the error. A
card does not need to pre-check.

The group has more services — schedule entities, the hold duration, group
presets, configuration — described in the integration's
[README](../README.md#services).

To open the group's or a member's details, fire Home Assistant's
`hass-more-info` event:

```js
this.dispatchEvent(new CustomEvent('hass-more-info', {
  detail: { entityId: 'climate.my_group' },
  bubbles: true,
  composed: true,
}))
```

## Your own card

A minimal card, plain JavaScript — load it as a dashboard resource (Settings →
Dashboards → Resources, type "JavaScript module"):

```js
class MyGroupCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error('entity is required')
    this._config = config
  }

  set hass(hass) {
    const group = hass.states[this._config.entity]
    if (!group) return
    const attrs = group.attributes

    const lines = [`${attrs.friendly_name}: ${group.state}, ${attrs.temperature}°`]
    if (attrs.blocking_reason) {
      const since = new Date(attrs.blocking_reason.since).toLocaleTimeString()
      lines.push(`Paused by ${attrs.blocking_reason.source} since ${since}`)
    }
    for (const id of attrs.member_entities ?? []) {
      const member = hass.states[id]
      if (member) lines.push(`${member.attributes.friendly_name}: ${member.state}`)
    }

    if (!this._card) {
      this._card = document.createElement('ha-card')
      this._card.style.padding = '16px'
      this.append(this._card)
    }
    this._card.replaceChildren(
      ...lines.map((text) => Object.assign(document.createElement('div'), { textContent: text }))
    )
  }

  getCardSize() {
    return 3
  }
}

customElements.define('my-group-card', MyGroupCard)
window.customCards = window.customCards || []
window.customCards.push({ type: 'my-group-card', name: 'My group card' })
```

`window.customCards` puts the card into the card picker; a static
`getStubConfig()` can fill in a first group. Home Assistant's developer
documentation on custom cards covers the rest:
<https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card>.

## Forking this card

Two things, both required — otherwise the fork either replaces the shipped
card or silently does not load.

**1. A build target of its own.** In `vite.config.ts` change `outDir`,
`fileName` and the library `name`. Unchanged, `npm run build` writes over the
bundle the integration ships. Load the fork's bundle as a dashboard resource.

**2. Rename every element, or none.** Replace the prefix across all of `src/` —
the `@customElement(...)` names, their uses in templates (`<cgh-status>` …) and
CSS selectors. The elements:

`climate-group-helper-card`, `climate-group-helper-card-editor`,
`cgh-action-tile`, `cgh-circular-slider`, `cgh-climate-control`,
`cgh-climate-humidity`, `cgh-climate-offset`, `cgh-climate-temperature`,
`cgh-feature-tiles`, `cgh-member-list`, `cgh-number-buttons`,
`cgh-select-tile`, `cgh-status`, `cgh-toggle`.

Also the card `type` in `getStubConfig()` (with the `custom:` prefix) and in
`registerCustomCard()`, and the editor element `getConfigElement()` creates.

Why it fails silently: the integration's bundle is loaded whenever a group
exists, and an element name can be defined only once per page. Registration
skips names that are already taken, and the card picker skips a `type` that is
already listed. With unchanged names, whichever bundle loads first wins — your
fork's elements either never run or replace the original's — and the fork gets
no picker entry of its own; the existing one keeps pointing at the original.
After a full rename, original and fork stand side by side in the picker.

Keep registering through `src/lib/define.ts`: it waits until Home Assistant's
element registry is ready and tolerates the bundle running twice.

## What is stable

- **Stable:** the group's attributes and services described above. A change to
  them — a rename, a removal, a new meaning — is announced in the changelog.
- **Internal:** everything in `src/` — element names, components, `lib/`. It
  changes whenever the card needs it, without notice. A fork follows it at its
  own pace.
