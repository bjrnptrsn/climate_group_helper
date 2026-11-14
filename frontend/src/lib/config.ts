import type {
  BoostConfig,
  Control,
  FeatureTile,
  HassEntity,
  LovelaceCardConfig,
  ResetField,
  StatusSection,
} from '../types'
import type { TranslationKey } from './i18n'

export const STATUS_SECTIONS: StatusSection[] = [
  'panel',
  'badges',
  'deviations',
]

export const CONTROLS: Control[] = ['slider', 'buttons', 'toggle']

export const FEATURE_TILES: FeatureTile[] = [
  'mode',
  'preset',
  'fan',
  'swing',
  'swing_horizontal',
]

/** In the order of the `reset` service's fields. */
export const RESET_FIELDS: ResetField[] = [
  'boost',
  'offset',
  'schedule',
  'bypass',
  'fallback',
  'presets',
]

/** Card labels for the reset fields — shared by the editor and the tooltip. */
export const RESET_LABEL_KEYS: Record<ResetField, TranslationKey> = {
  boost: 'reset.boost',
  offset: 'reset.offset',
  schedule: 'reset.schedule',
  bypass: 'reset.bypass',
  fallback: 'reset.fallback',
  presets: 'reset.presets',
}

/**
 * What the editor ticks when the reset tile is switched on: the temporary
 * overrides. `fallback` and `presets` discard content set via service, which
 * does not come back by itself.
 */
export const DEFAULT_RESET_FIELDS: readonly ResetField[] = [
  'boost',
  'offset',
  'schedule',
  'bypass',
]

/**
 * Status sections to render, or `null` when the whole cell is off
 * (`status: false`). Absent config means all sections.
 */
export const statusSections = (
  config?: LovelaceCardConfig
): StatusSection[] | null => {
  const status = config?.status
  if (status === false) return null
  if (Array.isArray(status)) {
    return STATUS_SECTIONS.filter((section) => status.includes(section))
  }
  return [...STATUS_SECTIONS]
}

/**
 * Feature tiles to render. Absent config means all (each tile also needs the
 * entity's capability); an explicit array restricts them.
 */
export const featureTiles = (config?: LovelaceCardConfig): FeatureTile[] => {
  const features = config?.features
  if (Array.isArray(features)) {
    return FEATURE_TILES.filter((tile) => features.includes(tile))
  }
  return [...FEATURE_TILES]
}

/**
 * Whether the header row with the card's name renders. Opt-out: only `false`
 * hides it; the main switch and the more-info button then move to the corners
 * of the dial's area.
 */
export const showTitle = (config?: LovelaceCardConfig): boolean => config?.title !== false

/** Whether the more-info button (⋮) renders. Opt-out: only `false` hides it. */
export const showMoreInfo = (config?: LovelaceCardConfig): boolean =>
  config?.more_info !== false

/**
 * Whether the battery displays render (panel level, member list mark,
 * deviations row). Its own key, not a status section: an explicit `status`
 * list written before it existed would otherwise hide it.
 */
export const showBattery = (config?: LovelaceCardConfig): boolean => config?.battery !== false

/**
 * Dial controls to render. Absent config means all; an explicit array
 * restricts them.
 */
export const controls = (config?: LovelaceCardConfig): Control[] => {
  const selected = config?.controls
  if (Array.isArray(selected)) {
    return CONTROLS.filter((control) => selected.includes(control))
  }
  return [...CONTROLS]
}

/**
 * Whether the entity is a group in Advanced Mode — the only mode with a main
 * switch and the group's own services (reset among them). `effective_sync_mode`
 * is published in Advanced Mode only, on every state write.
 */
export const isAdvancedGroup = (stateObj?: HassEntity): boolean =>
  stateObj?.attributes?.effective_sync_mode !== undefined

/**
 * Whether the group's main switch is shown. Opt-in: only `true` counts, so an
 * existing card stays as it is.
 */
export const showMainSwitch = (config?: LovelaceCardConfig): boolean =>
  config?.main_switch === true

/**
 * Whether the dial's view switch offers the group offset. Opt-in: only `true`
 * counts, so an existing card stays as it is.
 */
export const showOffset = (config?: LovelaceCardConfig): boolean => config?.offset === true

/**
 * Whether the dial offers the temperature view. Opt-out: only `false` counts,
 * so an existing card stays as it is.
 */
export const showTemperatureView = (config?: LovelaceCardConfig): boolean =>
  config?.temperature !== false

/**
 * Whether the dial offers the humidity view where the entity has a humidity
 * setpoint. Opt-out: only `false` counts, so an existing card stays as it is.
 */
export const showHumidityView = (config?: LovelaceCardConfig): boolean =>
  config?.humidity !== false

/**
 * Whether the reset tile is switched on — also with no field selected. Only a
 * list counts, so a stray `reset: true` does not show as ticked.
 */
export const resetEnabled = (config?: LovelaceCardConfig): boolean =>
  Array.isArray(config?.reset)

/**
 * Fields the reset tile sends, in canonical order. Opt-in: absent config means
 * none, and an empty result means no tile — the service rejects an empty
 * selection.
 */
export const resetFields = (config?: LovelaceCardConfig): ResetField[] => {
  const selected = config?.reset
  if (!Array.isArray(selected)) return []
  return RESET_FIELDS.filter((field) => selected.includes(field))
}

/** Minutes a new boost tile runs for. */
export const DEFAULT_BOOST_DURATION = 30

/** Longest boost the tile sends, in minutes (the service selector's limit). */
export const MAX_BOOST_DURATION = 480

const fahrenheit = (unit?: string): boolean => unit === '°F'

/** A new boost tile: a little warmer for half an hour, in the system's unit. */
export const defaultBoost = (unit?: string): BoostConfig & { temperature_offset: number } => ({
  temperature_offset: fahrenheit(unit) ? 4 : 2,
  duration: DEFAULT_BOOST_DURATION,
})

/** The value a boost tile switched to an absolute temperature starts with. */
export const defaultBoostTemperature = (unit?: string): number => (fahrenheit(unit) ? 75 : 24)

export type BoostLimits = {
  temperature_offset: readonly [number, number]
  temperature: readonly [number, number]
}

/**
 * The boost service selector's ranges (offset ±20 °C, temperature 5–35 °C),
 * converted to the system's unit — the selector's own figures are Celsius only.
 */
export const boostLimits = (unit?: string): BoostLimits =>
  fahrenheit(unit)
    ? { temperature_offset: [-36, 36], temperature: [41, 95] }
    : { temperature_offset: [-20, 20], temperature: [5, 35] }

/** Whether the boost tile is switched on — also with values the tile cannot send. */
export const boostEnabled = (config?: LovelaceCardConfig): boolean =>
  typeof config?.boost === 'object' && config.boost !== null && !Array.isArray(config.boost)

/**
 * What the boost tile sends, or `null` for no tile: exactly one of
 * `temperature_offset`/`temperature` as a finite number within `boostLimits()`
 * and a whole `duration` of 1 to `MAX_BOOST_DURATION` minutes. A hand-written
 * config that misses this never reaches the service.
 */
export const boostParams = (config?: LovelaceCardConfig, unit?: string): BoostConfig | null => {
  if (!boostEnabled(config)) return null
  const boost = config!.boost as Record<string, unknown>
  const { temperature_offset: offset, temperature, duration } = boost
  if (
    !(
      typeof duration === 'number' &&
      Number.isInteger(duration) &&
      duration >= 1 &&
      duration <= MAX_BOOST_DURATION
    )
  ) {
    return null
  }
  const limits = boostLimits(unit)
  const within = (value: unknown, [min, max]: readonly [number, number]): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
  if (offset !== undefined && temperature === undefined && within(offset, limits.temperature_offset)) {
    return { temperature_offset: offset, duration }
  }
  if (temperature !== undefined && offset === undefined && within(temperature, limits.temperature)) {
    return { temperature, duration }
  }
  return null
}
