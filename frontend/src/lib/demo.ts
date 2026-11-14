import type { HassEntity, HomeAssistant } from '../types'
import { LOW_BATTERY_THRESHOLD } from './battery'
import { translate, type TranslationKey } from './i18n'

/** Synthetic entity ids used by the demo mode. */
export const DEMO_ENTITY = 'climate.demo'
export const DEMO_SCHEDULE_ENTITY = 'schedule.demo_schedule'
export const DEMO_CALENDAR_ENTITY = 'calendar.demo_calendar'
export const DEMO_BYPASS_ENTITY = 'calendar.demo_vacation'
export const DEMO_MAIN_SWITCH_ENTITY = 'switch.demo_main_switch'
export const DEMO_OFFSET_ENTITY = 'number.demo_group_offset'

/** Demo re-render / scenario step interval. */
export const DEMO_TICK_MS = 3500

// `battery`: the battery entity on the member's device — the single source for
// both the demo registry and the battery states. The living room runs on mains.
const MEMBERS: { id: string; nameKey: TranslationKey; battery?: string }[] = [
  { id: 'climate.demo_living_room', nameKey: 'demo.room.living_room' },
  {
    id: 'climate.demo_bedroom',
    nameKey: 'demo.room.bedroom',
    battery: 'sensor.demo_bedroom_battery',
  },
  {
    id: 'climate.demo_bathroom',
    nameKey: 'demo.room.bathroom',
    battery: 'sensor.demo_bathroom_battery',
  },
  {
    id: 'climate.demo_kitchen',
    nameKey: 'demo.room.kitchen',
    battery: 'binary_sensor.demo_kitchen_battery_low',
  },
]

/**
 * The demo's entity registry: every member on its own device, with its battery
 * entity. A constant on purpose — the battery lookup caches per registry object,
 * so the wrapper must hand over this same object on every render.
 */
export const DEMO_ENTITIES: NonNullable<HomeAssistant['entities']> = Object.fromEntries(
  MEMBERS.flatMap((member) => {
    const device_id = `demo_device_${member.id}`
    const ids = member.battery ? [member.id, member.battery] : [member.id]
    return ids.map((entity_id) => [entity_id, { entity_id, device_id }])
  })
)
// With Master enabled, the first member is the master entity.
const MASTER = MEMBERS[0].id
// On some ticks (Advanced Mode only) one member runs with a configured offset:
// its setpoints carry it, and the group compares and averages them without it,
// like the backend.
const OFFSET_MEMBER = MEMBERS[2].id
const MEMBER_OFFSET = 1

const FEATURE_TARGET_TEMPERATURE = 1
const FEATURE_TARGET_TEMPERATURE_RANGE = 2
const FEATURE_TARGET_HUMIDITY = 4
const FEATURE_FAN_MODE = 8
const FEATURE_PRESET_MODE = 16
const FEATURE_SWING_MODE = 32
const FEATURE_SWING_HORIZONTAL_MODE = 512

const MODES = ['heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'off']
const ACTIVE_MODES = MODES.filter((m) => m !== 'off')
const PRESETS = ['none', 'eco', 'comfort', 'away']
const FANS = ['low', 'medium', 'high']
const ALL_FEATURES = [
  'window',
  'presence',
  'schedule',
  'sync',
  'isolation',
  'range_template',
  'calibration',
  'master',
]

// Setpoints the overrides push (heat only — none of them carries a range).
const WINDOW_TEMPERATURE = 12
const SWITCH_TEMPERATURE = 15
const AWAY_TEMPERATURE = 16
const AWAY_OFFSET = 2
const BOOST_TEMPERATURE = 25

/**
 * One situation per tick. Everything else — member states, the aggregate,
 * divergence, badges — is derived from it, so the demo only ever shows states
 * the integration can actually reach.
 */
type Situation =
  | 'normal'
  | 'off'
  | 'boost'
  | 'hold'
  | 'window_off'
  | 'window_temperature'
  | 'presence_off'
  | 'presence_offset'
  | 'presence_temperature'
  | 'presence_preset'
  | 'switch_off'
  | 'switch_temperature'
  | 'switch_release'

const r1 = (value: number): number => Math.round(value * 10) / 10
const half = (value: number): number => Math.round(value * 2) / 2
const avg = (values: number[]): number | undefined =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined

const entity = (
  id: string,
  state: string,
  attributes: Record<string, unknown>
): HassEntity => ({ entity_id: id, state, attributes })

/** Deterministic 32-bit hash → [0, 1); seeded per tick so a given `now` always
 * yields the same scenario (tests), while consecutive ticks look unrelated. */
const hash = (n: number): number => {
  let t = (n + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** What a climate entity reports as running, from its mode and the room. */
const actionFor = (
  mode: string,
  current: number,
  target?: number,
  low?: number,
  high?: number
): string => {
  switch (mode) {
    case 'off':
      return 'off'
    case 'dry':
      return 'drying'
    case 'fan_only':
      return 'fan'
    case 'heat':
      return target != null && current < target ? 'heating' : 'idle'
    case 'cool':
      return target != null && current > target ? 'cooling' : 'idle'
    default: {
      // heat_cool / auto: a band, or a single setpoint with a small deadband.
      const lo = low ?? (target != null ? target - 0.5 : undefined)
      const hi = high ?? (target != null ? target + 0.5 : undefined)
      if (lo != null && current < lo) return 'heating'
      if (hi != null && current > hi) return 'cooling'
      return 'idle'
    }
  }
}

/**
 * The backend's divergence rule: once the counted members (not isolated, not
 * offline) disagree on an attribute, every one of them is listed with its value.
 * Setpoints are compared without the member offsets but reported raw.
 */
const divergenceOf = (
  counted: HassEntity[],
  offsets: Record<string, number> = {}
): Record<string, Record<string, unknown>> => {
  const result: Record<string, Record<string, unknown>> = {}
  if (counted.length < 2) return result
  const modes = Object.fromEntries(counted.map((m) => [m.entity_id, m.state]))
  if (new Set(Object.values(modes)).size > 1) result.hvac_mode = modes
  for (const attr of ['temperature', 'target_temp_low', 'target_temp_high']) {
    const members = counted.filter((m) => m.attributes[attr] != null)
    const logical = members.map(
      (m) => (m.attributes[attr] as number) - (offsets[m.entity_id] ?? 0)
    )
    if (new Set(logical).size > 1) {
      result[attr] = Object.fromEntries(members.map((m) => [m.entity_id, m.attributes[attr]]))
    }
  }
  for (const attr of ['fan_mode', 'preset_mode']) {
    const values = Object.fromEntries(
      counted
        .filter((m) => m.attributes[attr] != null)
        .map((m) => [m.entity_id, m.attributes[attr]])
    )
    if (new Set(Object.values(values)).size > 1) result[attr] = values
  }
  return result
}

/**
 * Synthetic state for the demo mode: a group, its members, their batteries and
 * a schedule. Each tick picks a fresh, pseudo-random situation so every part of
 * the card cycles through. Content-only — the wrapper swaps this in for
 * `hass.states` (and `DEMO_ENTITIES` for `hass.entities`). Names follow `locale`.
 */
export const demoStates = (
  now: number = Date.now(),
  locale?: string
): Record<string, HassEntity> => {
  const t = (key: TranslationKey): string => translate(locale, key)
  const tick = Math.floor(now / DEMO_TICK_MS)
  const rand = (salt: number): number =>
    hash(Math.imul(tick, 0x9e3779b1) + salt)
  const chance = (p: number, salt: number): boolean => rand(salt) < p
  const pick = <T>(list: readonly T[], salt: number): T =>
    list[Math.floor(rand(salt) * list.length)]

  // --- Configuration: capabilities and configured features ----------------
  const supportsRange = chance(0.6, 2)
  const supportsPreset = chance(0.8, 16)
  const supportsFan = chance(0.7, 15)
  const enabled = ALL_FEATURES.filter((_, i) => chance(0.5, 100 + i))
  const has = (feature: string): boolean => enabled.includes(feature)
  // The main switch exists in Advanced Mode, which every feature requires.
  const advanced = enabled.length > 0

  // --- The situation of this tick -----------------------------------------
  const candidates: [Situation, number][] = [
    ['normal', 10],
    ['off', 1],
    ['boost', 1],
    ['hold', has('schedule') ? 1 : 0],
    ['window_off', has('window') ? 1 : 0],
    ['window_temperature', has('window') ? 1 : 0],
    ['presence_off', has('presence') ? 1 : 0],
    ['presence_offset', has('presence') ? 1 : 0],
    ['presence_temperature', has('presence') ? 1 : 0],
    ['presence_preset', has('presence') && supportsPreset ? 1 : 0],
    ['switch_off', advanced ? 1 : 0],
    ['switch_temperature', advanced ? 1 : 0],
    ['switch_release', advanced ? 1 : 0],
  ]
  const weight = candidates.reduce((sum, [, w]) => sum + w, 0)
  let roll = rand(1) * weight
  const situation = (candidates.find(([, w]) => (roll -= w) < 0) ??
    candidates[0])[0]
  const settled = situation === 'normal' || situation === 'hold'

  // --- Blocks: the dominant one drives the members, a lower one may stack --
  const blocking: string[] = []
  if (situation.startsWith('switch')) blocking.push('switch')
  if (situation.startsWith('window')) blocking.push('window')
  if (situation.startsWith('presence')) blocking.push('presence')
  if (situation.startsWith('switch') && has('window') && chance(0.3, 131)) {
    blocking.push('window')
  }
  if (
    (situation.startsWith('switch') || situation.startsWith('window')) &&
    has('presence') &&
    chance(0.3, 132)
  ) {
    blocking.push('presence')
  }
  const reasonSource = ['switch', 'window', 'presence'].find((b) =>
    blocking.includes(b)
  )

  // --- Pauses a slot or preset applies (meta-key overrides) ---------------
  // A paused feature does not act: no window/presence block, no isolation.
  const overrides: Record<string, unknown> = {}
  if (has('window') && !blocking.includes('window') && chance(0.2, 140)) {
    overrides.window_mode = 'disabled'
  }
  if (has('presence') && !blocking.includes('presence') && chance(0.2, 141)) {
    overrides.presence_mode = 'disabled'
  }
  if (has('calibration') && chance(0.2, 142)) overrides.calibration_mode = 'disabled'
  if (has('isolation') && chance(0.2, 143)) overrides.isolation_bypass = 'all'
  if (has('sync') && chance(0.2, 144)) overrides.sync_mode = 'disabled'
  // LOCK only enforces; every other mode adopts member changes into the target.
  const syncMode = !has('sync')
    ? 'disabled'
    : overrides.sync_mode === 'disabled'
      ? 'disabled'
      : pick(['lock', 'mirror', 'mirror_lock', 'master_lock', 'adopt_only'], 145)
  const syncSource =
    syncMode === 'disabled' || syncMode === 'lock'
      ? []
      : [syncMode === 'adopt_only' ? 'adopt_only' : 'sync_mode']

  // --- The group's intended target ----------------------------------------
  // Overrides that push a single heat setpoint need a heat group underneath.
  const heatOnly =
    situation === 'switch_temperature' ||
    situation === 'window_temperature' ||
    situation === 'presence_offset' ||
    situation === 'presence_temperature' ||
    situation === 'presence_preset'
  // A boost wakes a group that is off, with `heat`.
  const boostWakes = situation === 'boost' && chance(0.3, 3)
  const intendedMode =
    situation === 'off' || boostWakes
      ? 'off'
      : heatOnly || situation === 'boost'
        ? 'heat'
        : pick(ACTIVE_MODES, 4)
  const range = intendedMode === 'heat_cool' && supportsRange
  const setpoint = half(18 + rand(5) * 6)
  const low = range ? setpoint - 1.5 : undefined
  const high = range ? setpoint + 1.5 : undefined
  const intendedPreset = supportsPreset ? pick(['none', 'none', 'eco', 'comfort'], 6) : undefined
  const intendedFan = supportsFan ? pick(FANS, 11) : undefined

  // --- What reaches every counted member ----------------------------------
  let pushMode = intendedMode
  let pushTemp: number | undefined = range ? undefined : setpoint
  let pushPreset = intendedPreset
  switch (situation) {
    case 'switch_off':
    case 'window_off':
    case 'presence_off':
      pushMode = 'off'
      break
    case 'switch_temperature':
      pushTemp = SWITCH_TEMPERATURE
      break
    case 'boost':
      pushMode = 'heat'
      pushTemp = BOOST_TEMPERATURE
      break
    case 'window_temperature':
      pushTemp = WINDOW_TEMPERATURE
      break
    case 'presence_offset':
      pushTemp = setpoint - AWAY_OFFSET
      break
    case 'presence_temperature':
      pushTemp = AWAY_TEMPERATURE
      break
    case 'presence_preset':
      pushPreset = 'away'
      break
  }
  // A switch or window block is led by that block even when presence stacks.
  if (situation === 'switch_off' || (reasonSource === 'window' && situation === 'window_off')) {
    pushMode = 'off'
  }

  // --- Members ------------------------------------------------------------
  const room = r1(19 + rand(7) * 5)
  const offlineIndex = chance(0.12, 20) ? Math.floor(rand(21) * MEMBERS.length) : -1
  const isolatedIndex =
    has('isolation') && !overrides.isolation_bypass && chance(0.5, 22)
      ? [0, 1, 2, 3].filter((i) => i !== offlineIndex)[Math.floor(rand(23) * 3)]
      : -1
  const others = [0, 1, 2, 3].filter((i) => i !== offlineIndex && i !== isolatedIndex)
  // A settled, running group — or one whose switch leaves the devices alone —
  // shows members going their own way; every other block or boost pushes the
  // same payload to everyone.
  const running = settled && pushMode !== 'off'
  const canDiverge = (settled || situation === 'switch_release') && pushMode !== 'off'
  const oobIndex = running && chance(0.15, 24) ? pick(others, 25) : -1
  const userOffIndex =
    canDiverge && chance(0.3, 26) ? pick(others.filter((i) => i !== oobIndex), 27) : -1
  const driftIndex =
    canDiverge && chance(0.5, 28)
      ? pick(others.filter((i) => i !== oobIndex && i !== userOffIndex), 29)
      : -1
  const drift = chance(0.5, 30) ? 0.5 : -0.5
  // A running member set to its own preset or fan speed by hand. It may be the
  // drifting one too, so a row can carry several disputed values.
  const runningOthers = others.filter((i) => i !== oobIndex && i !== userOffIndex)
  const presetDriftIndex =
    canDiverge && supportsPreset && chance(0.4, 31) ? pick(runningOthers, 32) : -1
  const presetDrift = pick(
    PRESETS.filter((p) => p !== pushPreset && p !== 'away'),
    33
  )
  const fanDriftIndex = canDiverge && supportsFan && chance(0.4, 34) ? pick(runningOthers, 35) : -1
  const fanDrift = pick(
    FANS.filter((f) => f !== intendedFan),
    36
  )
  // The backend keeps the offset through a boost or block but does not apply
  // it; the demo only sets one while it takes effect — then it reaches every
  // member's setpoint.
  const groupOffset =
    advanced && settled && chance(0.3, 82) ? pick([0.5, 1, 1.5, -0.5], 84) : 0
  const memberOffsets: Record<string, number> =
    advanced && chance(0.4, 85) ? { [OFFSET_MEMBER]: MEMBER_OFFSET } : {}

  const memberStates: Record<string, HassEntity> = {}
  const counted: HassEntity[] = []
  MEMBERS.forEach((member, i) => {
    const name = t(member.nameKey)
    if (i === offlineIndex) {
      memberStates[member.id] = entity(member.id, 'unavailable', {
        friendly_name: name,
      })
      return
    }
    const current = r1(room + (rand(40 + i) - 0.5))
    // Isolated (the rule turned it off), out of bounds (OOB action OFF) and
    // switched off by hand all leave the device off with its old setpoint.
    const off = i === isolatedIndex || i === oobIndex || i === userOffIndex
    const mode = off ? 'off' : pushMode
    const offset = groupOffset + (memberOffsets[member.id] ?? 0)
    const shift = (i === driftIndex ? drift : 0) + offset
    const temperature = pushTemp != null ? pushTemp + shift : undefined
    const memberLow = low != null ? low + shift : undefined
    const memberHigh = high != null ? high + offset : undefined
    const state = entity(member.id, mode, {
      friendly_name: name,
      current_temperature: current,
      temperature,
      target_temp_low: memberLow,
      target_temp_high: memberHigh,
      preset_mode: i === presetDriftIndex ? presetDrift : pushPreset,
      fan_mode: i === fanDriftIndex ? fanDrift : intendedFan,
      hvac_action: actionFor(mode, current, temperature, memberLow, memberHigh),
    })
    memberStates[member.id] = state
    if (i !== isolatedIndex) counted.push(state)
  })

  // --- The group aggregate ------------------------------------------------
  const runningCounted = counted.filter((m) => m.state !== 'off')
  const groupMode = runningCounted.length ? pushMode : 'off'
  // Setpoints are averaged without the member offsets (offset correction).
  const mean = (attr: string, corrected = true): number | undefined => {
    const value = avg(
      counted
        .filter((m) => m.attributes[attr] != null)
        .map(
          (m) =>
            (m.attributes[attr] as number) -
            (corrected ? (memberOffsets[m.entity_id] ?? 0) : 0)
        )
    )
    return value != null ? r1(value) : undefined
  }
  const current = mean('current_temperature', false) ?? room
  const temperature = range ? undefined : mean('temperature')
  const groupLow = range ? mean('target_temp_low') : undefined
  const groupHigh = range ? mean('target_temp_high') : undefined
  const divergence = divergenceOf(counted, memberOffsets)
  const activeCount = Object.values(memberStates).filter(
    (m) => m.state !== 'off' && m.state !== 'unavailable'
  ).length

  // --- Schedule -----------------------------------------------------------
  const calendar = chance(0.5, 50)
  const scheduleEntity = calendar ? DEMO_CALENDAR_ENTITY : DEMO_SCHEDULE_ENTITY
  const scheduleOn = has('schedule') && (situation === 'hold' || chance(0.6, 51))
  // A bypass run ends a manual hold, so the two never coexist.
  const bypassOn = has('schedule') && situation !== 'hold' && chance(0.2, 52)
  const fallbackConfigured = has('schedule') && chance(0.5, 53)
  const layer = !has('schedule')
    ? undefined
    : bypassOn
      ? 'bypass'
      : scheduleOn
        ? 'main'
        : fallbackConfigured
          ? 'fallback'
          : 'none'

  // --- Where the target came from -----------------------------------------
  const manualSources = ['ui', 'group', ...syncSource]
  const source =
    situation === 'hold'
      ? pick(manualSources, 60)
      : layer && layer !== 'none' && chance(0.6, 61)
        ? 'schedule'
        : pick(manualSources, 62)

  const blockedSince = new Date(now - Math.round(1 + rand(70) * 20) * 60000)

  const group = entity(DEMO_ENTITY, groupMode, {
    friendly_name: t('demo.group'),
    min_temp: 5,
    max_temp: 35,
    target_temp_step: 0.5,
    current_temperature: current,
    temperature,
    target_temp_low: groupLow,
    target_temp_high: groupHigh,
    current_humidity: 35 + Math.round(rand(8) * 30),
    humidity: 40 + Math.round(rand(9) * 25),
    min_humidity: 0,
    max_humidity: 100,
    target_humidity_step: 1,
    hvac_action: actionFor(groupMode, current, temperature, groupLow, groupHigh),
    hvac_modes: MODES,
    preset_modes: PRESETS,
    preset_mode: pushPreset,
    fan_modes: FANS,
    fan_mode: intendedFan,
    swing_modes: ['off', 'on'],
    swing_mode: pick(['off', 'on'], 12),
    swing_horizontal_modes: ['off', 'on'],
    swing_horizontal_mode: pick(['off', 'on'], 13),
    supported_features:
      FEATURE_TARGET_TEMPERATURE |
      (supportsRange ? FEATURE_TARGET_TEMPERATURE_RANGE : 0) |
      (chance(0.6, 14) ? FEATURE_TARGET_HUMIDITY : 0) |
      (supportsFan ? FEATURE_FAN_MODE : 0) |
      (supportsPreset ? FEATURE_PRESET_MODE : 0) |
      (chance(0.5, 17) ? FEATURE_SWING_MODE : 0) |
      (chance(0.4, 18) ? FEATURE_SWING_HORIZONTAL_MODE : 0),
    active_member_count: activeCount,
    total_member_count: MEMBERS.length,
    member_entities: MEMBERS.map((member) => member.id),
    enabled_features: enabled,
    blocking_sources: blocking,
    blocking_reason: reasonSource
      ? { source: reasonSource, since: blockedSince.toISOString() }
      : undefined,
    isolated_members: isolatedIndex >= 0 ? [MEMBERS[isolatedIndex].id] : [],
    oob_members: oobIndex >= 0 ? [MEMBERS[oobIndex].id] : [],
    member_divergence: divergence,
    config_overrides: Object.keys(overrides).length ? overrides : undefined,
    // Advanced Mode only, like the backend.
    effective_sync_mode: advanced ? syncMode : undefined,
    main_switch_entity_id: advanced ? DEMO_MAIN_SWITCH_ENTITY : undefined,
    offset_entity_id: advanced ? DEMO_OFFSET_ENTITY : undefined,
    main_switch_action: !advanced
      ? undefined
      : situation === 'switch_temperature'
        ? 'temperature'
        : situation === 'switch_release'
          ? 'release'
          : 'off',
    assumed_state: Object.keys(divergence).length > 0,
    last_source: source,
    last_entity: source === 'sync_mode' || source === 'adopt_only' ? pick(MEMBERS, 63).id : undefined,
    // At least a minute ago: a change inside the tick would hold back the
    // deviation marks for the card's quiet window.
    last_changed: new Date(now - (1 + Math.round(rand(64) * 9)) * 60000).toISOString(),
    active_schedule_entity: has('schedule') ? scheduleEntity : undefined,
    // Set by a service in place of the configured one: the card adds its pill.
    // Often, since the pill only shows while the schedule panel does.
    schedule_entity_overridden: has('schedule') && chance(0.6, 54) ? true : undefined,
    active_schedule_bypass_entity: has('schedule') ? DEMO_BYPASS_ENTITY : undefined,
    schedule_bypass_entity_overridden: bypassOn && chance(0.5, 55) ? true : undefined,
    active_schedule_layer: layer,
    // The bypass's own title wins over the main slot's.
    active_schedule_slot_title: bypassOn
      ? t('demo.vacation')
      : scheduleOn && calendar
        ? t('demo.slot')
        : undefined,
    schedule_fallback_payload: fallbackConfigured ? { temperature: 17 } : undefined,
    schedule_fallback_payload_active: layer === 'fallback' ? true : undefined,
    boost_temperature: situation === 'boost' ? BOOST_TEMPERATURE : undefined,
    boost_until:
      situation === 'boost'
        ? new Date(now + (1 + rand(80) * 15) * 60000).toISOString()
        : undefined,
    schedule_hold_until:
      situation === 'hold'
        ? new Date(now + (5 + rand(81) * 55) * 60000).toISOString()
        : undefined,
    group_offset: groupOffset,
    // What the group commands; the overrides above never write it.
    target_state: {
      hvac_mode: intendedMode,
      temperature: range ? undefined : setpoint,
      target_temp_low: low,
      target_temp_high: high,
      preset_mode: intendedPreset,
      fan_mode: intendedFan,
    },
    member_offsets: Object.keys(memberOffsets).length ? memberOffsets : undefined,
    master_entity_id: has('master') ? MASTER : undefined,
    master_fallback_active: has('master') && offlineIndex === 0,
    // Only reported while a presence sensor is offline.
    presence_fallback: has('presence') && chance(0.2, 83) ? true : undefined,
  })

  const schedule = calendar
    ? entity(DEMO_CALENDAR_ENTITY, scheduleOn ? 'on' : 'off', {
        friendly_name: t('demo.schedule'),
        message: scheduleOn ? t('demo.slot') : undefined,
      })
    : entity(DEMO_SCHEDULE_ENTITY, scheduleOn ? 'on' : 'off', {
        friendly_name: t('demo.schedule'),
        next_event: new Date(now + (1 + rand(90) * 90) * 60000).toISOString(),
      })

  const bypass = entity(DEMO_BYPASS_ENTITY, bypassOn ? 'on' : 'off', {
    friendly_name: t('demo.vacation'),
    message: bypassOn ? t('demo.vacation') : undefined,
  })

  // --- Batteries: independent of the situation, one runs low on some ticks --
  const withBattery = MEMBERS.filter((member) => member.battery)
  const lowBattery = chance(0.3, 150) ? pick(withBattery, 151).id : undefined
  const batteryStates: Record<string, HassEntity> = {}
  MEMBERS.forEach((member, i) => {
    if (!member.battery) return
    const low = member.id === lowBattery
    batteryStates[member.battery] = member.battery.startsWith('binary_sensor.')
      ? entity(member.battery, low ? 'on' : 'off', { device_class: 'battery' })
      : entity(
          member.battery,
          String(
            low
              ? 5 + Math.round(rand(152) * (LOW_BATTERY_THRESHOLD - 10))
              : 40 + Math.round(rand(153 + i) * 60)
          ),
          { device_class: 'battery', unit_of_measurement: '%' }
        )
  })

  // Off exactly while the situation carries the switch block, like the backend
  // derives `is_on` from `blocking_sources`.
  const mainSwitch: HassEntity = {
    entity_id: DEMO_MAIN_SWITCH_ENTITY,
    state: blocking.includes('switch') ? 'off' : 'on',
    attributes: {},
  }

  // Bounds and step of the real offset entity. No unit: the real one follows
  // the system's temperature unit, which the card falls back to anyway.
  const offsetNumber: HassEntity = {
    entity_id: DEMO_OFFSET_ENTITY,
    state: String(groupOffset),
    attributes: { min: -5, max: 5, step: 0.5 },
  }

  return {
    [DEMO_ENTITY]: group,
    ...(advanced
      ? { [DEMO_MAIN_SWITCH_ENTITY]: mainSwitch, [DEMO_OFFSET_ENTITY]: offsetNumber }
      : {}),
    [scheduleEntity]: schedule,
    ...(has('schedule') ? { [DEMO_BYPASS_ENTITY]: bypass } : {}),
    ...memberStates,
    ...batteryStates,
  }
}
