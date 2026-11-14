import { LitElement, css, html, nothing } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { stateColor } from '../lib/climate-display'
import { RESET_LABEL_KEYS } from '../lib/config'
import { formatOffset, formatTime, numberLocale } from '../lib/format'
import { translateState, LocalizeMixin } from '../lib/i18n'
import {
  hvacModeIcon,
  MDI_ARROW_OSCILLATING,
  MDI_FAN,
  MDI_RESTORE,
  MDI_ROCKET_LAUNCH,
  MDI_TUNE,
} from '../lib/icons'
import './cgh-action-tile'
import './cgh-select-tile'
import type { SelectOption } from './cgh-select-tile'
import type {
  BoostConfig,
  FeatureTile,
  HassEntity,
  HomeAssistant,
  ResetField,
} from '../types'

// ClimateEntityFeature bits (kept local — no HA frontend package dependency).
const FEATURE_FAN_MODE = 8
const FEATURE_PRESET_MODE = 16
const FEATURE_SWING_MODE = 32
const FEATURE_SWING_HORIZONTAL_MODE = 512

/**
 * Colour of the mode tile: the dial's instead of the primary colour, so tile
 * and ring read as one. `off`, `unavailable` and `unknown` leave it neutral.
 */
export const modeAccent = (stateObj: HassEntity): string | undefined =>
  ['off', 'unavailable', 'unknown'].includes(stateObj.state)
    ? undefined
    : stateColor(stateObj)

/** The values that mean "nothing set" per tile. */
export const NEUTRAL_VALUES = {
  mode: ['off'],
  preset: ['none'],
  fan: ['auto', 'off'],
  swing: ['off'],
} as const

/**
 * The tile's value differs from a neutral one — only when the device offers a
 * neutral value at all. Without one (a fan with only low/high) every value is
 * an ordinary setting and the tile stays neutral instead of tinted for good. A
 * value outside the options (`unavailable`, `unknown`) is not a setting either.
 */
export const differsFromNeutral = (
  value: unknown,
  options: readonly string[],
  neutral: readonly string[]
): boolean =>
  typeof value === 'string' &&
  options.includes(value) &&
  options.some((option) => neutral.includes(option)) &&
  !neutral.includes(value)

/**
 * Feature tiles in the more-info style: mode, preset, fan and swing, each a
 * compact tile that opens a dropdown. Rendered per capability.
 * The boost and reset tiles come last: no dropdown, no capability — each
 * shows when the card config has it.
 */
@customElement('cgh-feature-tiles')
export class CghFeatureTiles extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public stateObj?: HassEntity
  @property({ attribute: false }) public tiles: FeatureTile[] = [
    'mode',
    'preset',
    'fan',
    'swing',
    'swing_horizontal',
  ]
  /** What the boost tile starts; `null` = no boost tile. */
  @property({ attribute: false }) public boost: BoostConfig | null = null
  /** Fields the reset tile sends; empty = no reset tile. */
  @property({ attribute: false }) public reset: ResetField[] = []

  private _call(service: string, data: Record<string, unknown>): void {
    if (!this.hass || !this.stateObj) return
    this.hass.callService('climate', service, {
      entity_id: this.stateObj.entity_id,
      ...data,
    })
  }

  /** A boost runs — the group reports its end. */
  private get _boostActive(): boolean {
    return !!this.stateObj?.attributes.boost_until
  }

  // Sends what the tile shows, like the main switch: a running boost is ended,
  // otherwise the configured one starts. Whether the service accepts it (a
  // block, a mode it rejects) is its call; HA shows the error.
  private _boost(): void {
    if (!this.hass || !this.stateObj || !this.boost) return
    if (this._boostActive) {
      this.hass.callService('climate_group_helper', 'reset', {
        entity_id: this.stateObj.entity_id,
        boost: true,
      })
      return
    }
    this.hass.callService('climate_group_helper', 'boost', {
      entity_id: this.stateObj.entity_id,
      ...this.boost,
    })
  }

  private _temperature(value: number): string {
    const unit = (this.hass?.config?.unit_system?.temperature as string) ?? '°C'
    const number = new Intl.NumberFormat(numberLocale(this.hass), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)
    return `${number} ${unit}`
  }

  /**
   * Tooltip and accessible name. While a boost runs it describes that boost
   * (`boost_temperature`, `boost_until`), not the config: the service may have
   * started it with other values.
   */
  private _boostDescription(): string {
    const label = this.t('boost.label')
    const attrs = this.stateObj?.attributes
    if (this._boostActive) {
      const temperature = attrs?.boost_temperature as number | undefined
      if (temperature == null) return label
      return `${label}: ${this.t('boost.running', {
        temperature: this._temperature(temperature),
        time: formatTime(attrs!.boost_until as string, this.hass, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })}`
    }
    const boost = this.boost!
    const value =
      boost.temperature_offset !== undefined
        ? formatOffset(boost.temperature_offset, this.hass)
        : this._temperature(boost.temperature!)
    return `${label}: ${value} · ${this.t('boost.duration', { minutes: boost.duration })}`
  }

  // The reset tile sends the configured fields to the group's own reset
  // service, nothing derived from state.
  private _reset(): void {
    if (!this.hass || !this.stateObj || !this.reset.length) return
    this.hass.callService('climate_group_helper', 'reset', {
      entity_id: this.stateObj.entity_id,
      ...Object.fromEntries(this.reset.map((field) => [field, true])),
    })
  }

  /** Options labelled like HA's more-info (entity translations); a group
   * preset — a free name — comes back unchanged. */
  private _options(attribute: string, values: string[]): SelectOption[] {
    const stateObj = this.stateObj!
    return values.map((value) => ({
      value,
      label: this.hass?.formatEntityAttributeValue?.(stateObj, attribute, value) ?? value,
    }))
  }

  protected render() {
    const stateObj = this.stateObj
    const attrs = stateObj?.attributes
    if (!stateObj || !attrs) return nothing

    const features = (attrs.supported_features as number) ?? 0
    const modes = (attrs.hvac_modes as string[]) ?? []
    const presetModes = (attrs.preset_modes as string[]) ?? []
    const fanModes = (attrs.fan_modes as string[]) ?? []
    const swingModes = (attrs.swing_modes as string[]) ?? []
    const swingHModes = (attrs.swing_horizontal_modes as string[]) ?? []

    // No row at all when no tile applies: the row carries the spacing to its
    // neighbours, and an empty one would leave it as a gap in the card.
    const tiles = [
      this.tiles.includes('mode') && modes.length
        ? html`<cgh-select-tile
            .icon=${hvacModeIcon(stateObj.state)}
            .accent=${modeAccent(stateObj)}
            .active=${differsFromNeutral(stateObj.state, modes, NEUTRAL_VALUES.mode)}
            .label=${this.t('tile.mode')}
            .value=${stateObj.state}
            .options=${modes.map((m) => ({
              value: m,
              label: translateState(this.hass, 'mode', m),
              icon: hvacModeIcon(m),
            }))}
            @cgh-select=${(e: CustomEvent) =>
              this._call('set_hvac_mode', { hvac_mode: e.detail.value })}
          ></cgh-select-tile>`
        : nothing,
      this.tiles.includes('preset') &&
      (features & FEATURE_PRESET_MODE) !== 0 &&
      presetModes.length
        ? html`<cgh-select-tile
            .icon=${MDI_TUNE}
            .label=${this.t('tile.preset')}
            .value=${attrs.preset_mode as string}
            .active=${differsFromNeutral(attrs.preset_mode, presetModes, NEUTRAL_VALUES.preset)}
            .options=${this._options('preset_mode', presetModes)}
            .reselect=${true}
            @cgh-select=${(e: CustomEvent) =>
              this._call('set_preset_mode', {
                preset_mode: e.detail.value,
              })}
          ></cgh-select-tile>`
        : nothing,
      this.tiles.includes('fan') &&
      (features & FEATURE_FAN_MODE) !== 0 &&
      fanModes.length
        ? html`<cgh-select-tile
            .icon=${MDI_FAN}
            .label=${this.t('tile.fan')}
            .value=${attrs.fan_mode as string}
            .active=${differsFromNeutral(attrs.fan_mode, fanModes, NEUTRAL_VALUES.fan)}
            .options=${this._options('fan_mode', fanModes)}
            @cgh-select=${(e: CustomEvent) =>
              this._call('set_fan_mode', { fan_mode: e.detail.value })}
          ></cgh-select-tile>`
        : nothing,
      this.tiles.includes('swing') &&
      (features & FEATURE_SWING_MODE) !== 0 &&
      swingModes.length
        ? html`<cgh-select-tile
            .icon=${MDI_ARROW_OSCILLATING}
            .label=${this.t('tile.swing')}
            .value=${attrs.swing_mode as string}
            .active=${differsFromNeutral(attrs.swing_mode, swingModes, NEUTRAL_VALUES.swing)}
            .options=${this._options('swing_mode', swingModes)}
            @cgh-select=${(e: CustomEvent) =>
              this._call('set_swing_mode', { swing_mode: e.detail.value })}
          ></cgh-select-tile>`
        : nothing,
      this.tiles.includes('swing_horizontal') &&
      (features & FEATURE_SWING_HORIZONTAL_MODE) !== 0 &&
      swingHModes.length
        ? html`<cgh-select-tile
            .icon=${MDI_ARROW_OSCILLATING}
            .label=${this.t('tile.swing_horizontal')}
            .value=${attrs.swing_horizontal_mode as string}
            .active=${differsFromNeutral(attrs.swing_horizontal_mode, swingHModes, NEUTRAL_VALUES.swing)}
            .options=${this._options('swing_horizontal_mode', swingHModes)}
            @cgh-select=${(e: CustomEvent) =>
              this._call('set_swing_horizontal_mode', {
                swing_horizontal_mode: e.detail.value,
              })}
          ></cgh-select-tile>`
        : nothing,
      this.boost
        ? html`<cgh-action-tile
            class="boost"
            .icon=${MDI_ROCKET_LAUNCH}
            .label=${this.t('boost.label')}
            .description=${this._boostDescription()}
            .active=${this._boostActive}
            @cgh-action=${this._boost}
          ></cgh-action-tile>`
        : nothing,
      this.reset.length
        ? html`<cgh-action-tile
            class="reset"
            .icon=${MDI_RESTORE}
            .label=${this.t('reset.label')}
            .description=${`${this.t('reset.label')}: ${this.reset
              .map((field) => this.t(RESET_LABEL_KEYS[field]))
              .join(', ')}`}
            @cgh-action=${this._reset}
          ></cgh-action-tile>`
        : nothing,
    ].filter((tile) => tile !== nothing)
    if (!tiles.length) return nothing

    return html`<div class="tiles">${tiles}</div>`
  }

  static styles = css`
    :host {
      display: block;
    }
    .tiles {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      padding: 8px;
    }
    .tiles cgh-select-tile,
    .tiles cgh-action-tile {
      flex: 1 1 120px;
      max-width: 160px;
    }
  `
}
