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
/** The dial's controls: slider ring, −/+ buttons, view switch. */
export type Control = 'slider' | 'buttons' | 'toggle'
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

export interface LovelaceCardConfig {
  type: string
  /** Required unless `demo` is set. */
  entity?: string
  name?: string
  /** `false` hides the header row with the name; absent = shown. */
  title?: boolean
  /** `false` hides the more-info button; absent = shown. */
  more_info?: boolean
  /** `false` hides the status cell; an array selects its sections. */
  status?: false | StatusSection[]
  /** Feature tiles to render; absent = all by capability. */
  features?: FeatureTile[]
  /** Dial controls to render; absent = all. */
  controls?: Control[]
  /** `false` hides every battery display; absent = shown. */
  battery?: boolean
  /** `true` shows the group's main switch; absent = hidden. */
  main_switch?: boolean
  /** `true` adds the group offset segment to the dial's view switch; absent = none. */
  offset?: boolean
  /** `false` leaves the temperature view out of the dial; absent = shown. */
  temperature?: boolean
  /** `false` leaves the humidity view out of the dial; absent = shown where offered. */
  humidity?: boolean
  /** What the boost tile starts; absent = no tile. */
  boost?: BoostConfig
  /** Reset fields the reset tile sends; absent or empty = no tile. */
  reset?: ResetField[]
  /** Render synthetic state instead of a real entity (development/demo). */
  demo?: boolean
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string
      name: string
      description?: string
      preview?: boolean
    }>
  }
}
