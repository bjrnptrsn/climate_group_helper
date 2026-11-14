import type { HassEntity, HomeAssistant } from '../types'

/** HA colours a battery red below this level (`batteryStateColorProperty()`). */
export const LOW_BATTERY_THRESHOLD = 30
/** …and green from this level on, orange in between. */
const HIGH_BATTERY_THRESHOLD = 70

type Registry = NonNullable<HomeAssistant['entities']>
type Hass = Pick<HomeAssistant, 'states' | 'entities'>

// Device → its entity ids, per registry object. `hass.entities` keeps its
// identity across state updates, so this is built once per registry change.
// Only the structure is cached: whether an entity is a battery comes from its
// state (`device_class` is not in the registry entry) and is checked fresh.
const deviceEntities = new WeakMap<Registry, Map<string, string[]>>()

const entitiesByDevice = (registry: Registry): Map<string, string[]> => {
  let byDevice = deviceEntities.get(registry)
  if (!byDevice) {
    byDevice = new Map()
    for (const [id, entry] of Object.entries(registry)) {
      if (!entry.device_id) continue
      const ids = byDevice.get(entry.device_id)
      if (ids) ids.push(id)
      else byDevice.set(entry.device_id, [id])
    }
    deviceEntities.set(registry, byDevice)
  }
  return byDevice
}

const isBinary = (state: HassEntity): boolean => state.entity_id.startsWith('binary_sensor.')

/**
 * A battery's level in percent, or `undefined` when it reports none. A binary
 * battery sensor counts as empty while `on` (low) and full while `off`.
 */
const batteryLevel = (state: HassEntity): number | undefined => {
  if (isBinary(state)) {
    if (state.state === 'on') return 0
    return state.state === 'off' ? 100 : undefined
  }
  // `Number('')` is 0 — an empty state would read as an empty battery.
  const raw = String(state.state).trim()
  if (!raw) return undefined
  const level = Number(raw)
  return Number.isFinite(level) ? level : undefined
}

/** The battery entities with a level on each member's device, in member order. */
const memberBatteries = (
  members: readonly string[],
  hass?: Hass
): [string, { state: HassEntity; level: number }[]][] => {
  const registry = hass?.entities
  if (!hass || !registry) return []
  const byDevice = entitiesByDevice(registry)
  const result: [string, { state: HassEntity; level: number }[]][] = []
  for (const member of members) {
    const deviceId = registry[member]?.device_id
    if (!deviceId) continue
    const batteries = (byDevice.get(deviceId) ?? []).flatMap((id) => {
      const state = hass.states[id]
      if (
        !state ||
        state.attributes.device_class !== 'battery' ||
        !(isBinary(state) || id.startsWith('sensor.'))
      ) {
        return []
      }
      const level = batteryLevel(state)
      return level === undefined ? [] : [{ state, level }]
    })
    if (batteries.length) result.push([member, batteries])
  }
  return result
}

/**
 * Members whose device reports a low battery, mapped to that battery's state.
 *
 * The battery is found on the member's device through the frontend registry —
 * the group itself knows nothing about batteries. A member without a device or
 * without a battery entity is left out, as is one whose battery is fine.
 */
export const lowBatteryMembers = (
  members: readonly string[],
  hass?: Hass
): Record<string, HassEntity> => {
  const result: Record<string, HassEntity> = {}
  for (const [member, batteries] of memberBatteries(members, hass)) {
    const low = batteries.filter((b) => b.level < LOW_BATTERY_THRESHOLD)
    // A level beats a plain on/off: it is what the mark's tooltip shows.
    const battery = low.find((b) => !isBinary(b.state)) ?? low[0]
    if (battery) result[member] = battery.state
  }
  return result
}

/** The group's weakest battery, or `undefined` when no member reports a level. */
export const weakestBattery = (
  members: readonly string[],
  hass?: Hass
): { member: string; state: HassEntity; level: number } | undefined => {
  let weakest: { member: string; state: HassEntity; level: number } | undefined
  for (const [member, batteries] of memberBatteries(members, hass)) {
    for (const battery of batteries) {
      if (!weakest || battery.level < weakest.level) weakest = { member, ...battery }
    }
  }
  return weakest
}

/** HA's battery colour bands: red below 30 %, orange below 70 %, green above. */
export const batteryLevelClass = (level: number): 'low' | 'medium' | 'high' =>
  level < LOW_BATTERY_THRESHOLD ? 'low' : level < HIGH_BATTERY_THRESHOLD ? 'medium' : 'high'
