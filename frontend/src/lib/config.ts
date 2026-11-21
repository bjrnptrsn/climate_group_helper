import type {
  BoostConfig,
  Control,
  FeatureTile,
  HassEntity,
  HomeAssistant,
  LovelaceCardConfig,
  ResetField,
  StatusSection,
  View,
} from '../types'
import type { TranslationKey } from './i18n'

export const STATUS_SECTIONS: StatusSection[] = [
  'panel',
  'badges',
  'deviations',
]

export const CONTROLS: Control[] = ['slider', 'buttons']

/** The dial's views in segment order. */
export const VIEWS: View[] = ['offset', 'temperature', 'humidity']

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
 * A list option resolved: absent (or anything but `false` and a list) is the
 * standard selection, `false` none, a list narrows it — in canonical order.
 */
const listOption = <T>(value: unknown, all: readonly T[], standard: readonly T[] = all): T[] => {
  if (value === false) return []
  if (Array.isArray(value)) return all.filter((item) => value.includes(item))
  return [...standard]
}

/**
 * Status sections to render, or `null` when the whole cell is off
 * (`status: false`). Absent config means all sections.
 */
export const statusSections = (
  config?: LovelaceCardConfig
): StatusSection[] | null => {
  if (config?.status === false) return null
  return listOption(config?.status, STATUS_SECTIONS)
}

/**
 * Feature tiles to render. Absent config means all (each tile also needs the
 * entity's capability); `false` or an empty list none.
 */
export const featureTiles = (config?: LovelaceCardConfig): FeatureTile[] =>
  listOption(config?.features, FEATURE_TILES)

/**
 * The dial's views, in segment order. Absent config means all; the card still
 * leaves out what the entity lacks. `false` or an empty list leave the dial on
 * temperature alone.
 */
export const dialViews = (config?: LovelaceCardConfig): View[] =>
  listOption(config?.views, VIEWS)

/**
 * Whether the header row with the card's name renders. Opt-out: only `false`
 * hides it; the main switch and the more-info button then move to the corners
 * of the dial's area.
 */
export const showTitle = (config?: LovelaceCardConfig): boolean => config?.title !== false

/** Whether the more-info button (⋮) renders. Opt-out: only `false` hides it. */
export const showMoreInfo = (config?: LovelaceCardConfig): boolean =>
  config?.more_info !== false

/** Whether the button to the more-info dialog's history view renders. Opt-out. */
export const showHistory = (config?: LovelaceCardConfig): boolean => config?.history !== false

/** Whether the button to the more-info dialog's settings view renders. Opt-out. */
export const showSettings = (config?: LovelaceCardConfig): boolean => config?.settings !== false

/**
 * Whether the battery displays render (panel level, member list column,
 * deviations row). Its own key, not a status section: an explicit `status`
 * list written before it existed would otherwise hide it.
 */
export const showBattery = (config?: LovelaceCardConfig): boolean => config?.battery !== false

/**
 * Whether the status panel carries the deviations badge, which opens the
 * deviations as a popover — so the deviations section can go without hiding
 * them. Opt-out: only `false` hides it.
 */
export const showDeviationsBadge = (config?: LovelaceCardConfig): boolean =>
  config?.deviations_badge !== false

/**
 * Dial controls to render. Absent config means all; an explicit array
 * restricts them, an empty one hides the dial.
 */
export const controls = (config?: LovelaceCardConfig): Control[] =>
  listOption(config?.controls, CONTROLS)

/**
 * Whether the entity is a Climate Group Helper group, in any mode:
 * `enabled_features` is published by the integration alone.
 */
export const isGroupEntity = (hass: HomeAssistant | undefined, entityId: string): boolean =>
  hass?.states?.[entityId]?.attributes?.enabled_features !== undefined

/**
 * Whether the entity is a group in Advanced Mode — the only mode with a main
 * switch and the group's own services (reset among them). `effective_sync_mode`
 * is published in Advanced Mode only, on every state write.
 */
export const isAdvancedGroup = (stateObj?: HassEntity): boolean =>
  stateObj?.attributes?.effective_sync_mode !== undefined

/**
 * Whether the group's main switch is shown. Opt-out: only `false` hides it;
 * it also needs the group to report one (Advanced Mode).
 */
export const showMainSwitch = (config?: LovelaceCardConfig): boolean =>
  config?.main_switch !== false

/**
 * Fields the reset tile sends, in canonical order. Absent config means
 * `DEFAULT_RESET_FIELDS`; `false` or an empty list means no tile — the service
 * rejects an empty selection.
 */
export const resetFields = (config?: LovelaceCardConfig): ResetField[] =>
  listOption(config?.reset, RESET_FIELDS, DEFAULT_RESET_FIELDS)

/** Whether the reset tile is switched on: it has at least one field to send. */
export const resetEnabled = (config?: LovelaceCardConfig): boolean =>
  resetFields(config).length > 0

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

/**
 * Whether the boost tile is switched on — also with values the tile cannot
 * send. Opt-out: only `false` switches it off.
 */
export const boostEnabled = (config?: LovelaceCardConfig): boolean => config?.boost !== false

/**
 * The boost as configured, read leniently: absent is `defaultBoost()` in the
 * system's unit, `false` is nothing, anything that is no object is empty.
 */
export const boostValues = (config?: LovelaceCardConfig, unit?: string): Record<string, unknown> => {
  const boost: unknown = config?.boost
  if (boost === undefined) return defaultBoost(unit)
  if (typeof boost === 'object' && boost !== null && !Array.isArray(boost)) {
    return boost as Record<string, unknown>
  }
  return {}
}

/**
 * What the boost tile sends, or `null` for no tile: exactly one of
 * `temperature_offset`/`temperature` as a finite number within `boostLimits()`
 * and a whole `duration` of 1 to `MAX_BOOST_DURATION` minutes. A hand-written
 * config that misses this never reaches the service.
 */
export const boostParams = (config?: LovelaceCardConfig, unit?: string): BoostConfig | null => {
  if (!boostEnabled(config)) return null
  const boost = boostValues(config, unit)
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
