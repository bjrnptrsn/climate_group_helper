import type { LovelaceCardConfig } from '../types'

/** The config schema the card writes and reads natively. */
export const CONFIG_VERSION = 1

/**
 * A config as any version may have written it. The keys a later version
 * retired are read here only — `LovelaceCardConfig` no longer knows them.
 */
type LegacyCardConfig = Omit<LovelaceCardConfig, 'controls'> & {
  controls?: unknown
  offset?: unknown
  temperature?: unknown
  humidity?: unknown
  [key: string]: unknown
}

type Stage = (config: LegacyCardConfig) => LegacyCardConfig

const RETIRED_V0_KEYS = ['offset', 'temperature', 'humidity'] as const

/** Drops v0's `toggle` from `controls`; leaves anything that is no list alone. */
const dropToggle = (config: LegacyCardConfig): void => {
  if (Array.isArray(config.controls)) {
    config.controls = config.controls.filter((control) => control !== 'toggle')
  }
}

/**
 * v0 → v1: every option opt-out. Version 0 showed main switch, boost and reset
 * only when configured, and spread the dial's views over `controls` (`toggle`)
 * and three keys of their own. The stage writes what v0 left off as `false`, so
 * the card looks exactly as before. v0's rules are spelled out here instead of
 * calling today's resolvers in `config.ts`: those follow the current schema
 * and will change again.
 */
const v0ToV1: Stage = (input) => {
  const config: LegacyCardConfig = { ...input }

  // `views` did not exist in v0: whoever wrote it wrote v1 by hand, only
  // without the version. Take it as it is, minus what v1 no longer reads.
  if (config.views !== undefined) {
    if (config.views === null) config.views = false
    dropToggle(config)
    for (const key of RETIRED_V0_KEYS) delete config[key]
    return { ...config, config_version: 1 }
  }

  if (config.main_switch === true) delete config.main_switch
  else config.main_switch = false
  // Buttons v0 did not have: an existing card does not grow them.
  config.history = false
  config.settings = false

  const boost: unknown = config.boost
  if (typeof boost !== 'object' || boost === null || Array.isArray(boost)) config.boost = false

  const reset: unknown = config.reset
  if (!Array.isArray(reset) || reset.length === 0) config.reset = false

  // v0 showed the view switch unless an explicit `controls` list left it out;
  // the views were offset (opt-in), temperature and humidity (both opt-out).
  const controls = config.controls
  const toggle = !Array.isArray(controls) || controls.includes('toggle')
  const views = toggle
    ? [
        ...(config.offset === true ? (['offset'] as const) : []),
        ...(config.temperature !== false ? (['temperature'] as const) : []),
        ...(config.humidity !== false ? (['humidity'] as const) : []),
      ]
    : []
  if (views.length === 0) config.views = false
  else if (views.length < 3) config.views = [...views]
  dropToggle(config)
  for (const key of RETIRED_V0_KEYS) delete config[key]

  return { ...config, config_version: 1 }
}

/** `STAGES[n]` lifts a config from version `n` to `n + 1`. */
const STAGES: Record<number, Stage> = {
  0: v0ToV1,
}

/**
 * The config in the current schema, without touching the one passed in: the
 * dashboard YAML changes only when the user edits the card. Idempotent; a
 * version newer than this card knows is passed through untouched.
 */
export const migrateConfig = (config: LovelaceCardConfig): LovelaceCardConfig => {
  const raw = config.config_version
  const version = typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 ? raw : 0
  if (version > CONFIG_VERSION) {
    console.warn(
      `[climate-group-helper-card] config_version ${version} is newer than this card ` +
        `(${CONFIG_VERSION}); update the integration`
    )
    return config
  }
  let current = config as LegacyCardConfig
  for (let v = version; v < CONFIG_VERSION; v++) current = STAGES[v](current)
  return current as LovelaceCardConfig
}
