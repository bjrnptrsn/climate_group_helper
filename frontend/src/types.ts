// Minimal local typings — no dependency on the HA frontend package. Keeps the
// bundle self-contained and the build independent of HA's internals.
export interface HassEntity {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed?: string
}

export interface HomeAssistant {
  states: Record<string, HassEntity>
  // HA's entity registry as the frontend sees it (enabled entities only).
  // Optional: absent in tests, where nothing is looked up by device.
  entities?: Record<string, { entity_id: string; device_id?: string }>
  language?: string
  locale?: {
    language?: string
    number_format?: string
    time_format?: 'language' | '12' | '24' | 'system'
  }
  config?: { unit_system?: { temperature?: string } }
  /** The signed-in user; only an admin may open an entity's settings. */
  user?: { is_admin?: boolean }
  themes?: { darkMode?: boolean }
  callService(
    domain: string,
    service: string,
    data?: Record<string, any>
  ): Promise<unknown>
  // HA's own formatters (entity translations, units). Optional: absent in
  // tests and older frontends, where the raw value is shown instead.
  formatEntityState?(stateObj: HassEntity, state?: string): string
  formatEntityAttributeName?(stateObj: HassEntity, attribute: string): string
  formatEntityAttributeValue?(
    stateObj: HassEntity,
    attribute: string,
    value?: unknown
  ): string
}

export type StatusSection = 'panel' | 'badges' | 'deviations'
/** The dial's controls: the whole dial block, its −/+ buttons. */
export type Control = 'slider' | 'buttons'
/** The dial's views, in the view switch's segment order. */
export type View = 'offset' | 'temperature' | 'humidity'
export type FeatureTile =
  | 'mode'
  | 'preset'
  | 'fan'
  | 'swing'
  | 'swing_horizontal'

/**
 * What the boost tile sends to `climate_group_helper.boost`: a relative or an
 * absolute temperature (in the system's unit) for `duration` minutes.
 */
export type BoostConfig = { duration: number } & (
  | { temperature_offset: number; temperature?: never }
  | { temperature: number; temperature_offset?: never }
)

/** Fields of the `climate_group_helper.reset` service the reset tile sends. */
export type ResetField =
  | 'boost'
  | 'offset'
  | 'schedule'
  | 'bypass'
  | 'fallback'
  | 'presets'

/**
 * The card's config. Every option is opt-out: absent means the standard,
 * `false` (or an empty list) switches it off, a list or object narrows or
 * parameterises it. Options that need a group in Advanced Mode (main switch,
 * offset view, boost, reset) show only there, whatever the config says.
 */
export interface LovelaceCardConfig {
  type: string
  /**
   * Version of the config schema; absent = 0, the schema before every option
   * was opt-out. Older configs are migrated when read (`migrateConfig()`).
   */
  config_version?: number
  /** Required unless `demo` is set. */
  entity?: string
  name?: string
  /** `false` hides the header row with the name; absent = shown. */
  title?: boolean
  /** `false` hides the more-info button (⋮); absent = shown. */
  more_info?: boolean
  /** `false` hides the button to the entity's history; absent = shown. */
  history?: boolean
  /** `false` hides the button to the entity's settings; absent = shown. */
  settings?: boolean
  /** Status sections to render; absent = all, `false` or `[]` = no status cell. */
  status?: false | StatusSection[]
  /** Feature tiles to render; absent = all by capability, `false` or `[]` = none. */
  features?: false | FeatureTile[]
  /** Dial controls to render; absent = all, `[]` = no dial. */
  controls?: Control[]
  /**
   * The dial's views; absent = all where offered, `false` or `[]` = temperature
   * alone. The view switch shows from two available views on.
   */
  views?: false | View[]
  /** `false` hides every battery display; absent = shown. */
  battery?: boolean
  /** `false` hides the deviations badge in the status panel; absent = shown. */
  deviations_badge?: boolean
  /** `false` hides the group's main switch; absent = shown. */
  main_switch?: boolean
  /** What the boost tile starts; absent = +2 °C (+4 °F) for 30 min, `false` = no tile. */
  boost?: false | BoostConfig
  /** Reset fields the reset tile sends; absent = the temporary overrides, `false` or `[]` = no tile. */
  reset?: false | ResetField[]
  /** Render synthetic state instead of a real entity (development/demo). */
  demo?: boolean
}

/** A card offered in the card picker's "By entity" tab. */
export interface CustomCardSuggestion {
  label?: string
  config: LovelaceCardConfig
}

/** An entry in HA's card picker (`window.customCards`). */
export interface CustomCardEntry {
  type: string
  name: string
  description?: string
  preview?: boolean
  getEntitySuggestion?: (hass: HomeAssistant, entityId: string) => CustomCardSuggestion | null
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[]
  }
}
