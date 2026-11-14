import { LitElement, css, html, nothing, type PropertyValues } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { styleMap } from 'lit/directives/style-map.js'
import {
  actionColor,
  bigNumber,
  stateColor,
  stepDigits,
  targetStep,
} from '../lib/climate-display'
import { numberLocale } from '../lib/format'
import { translateHvacAction } from '../lib/i18n'
import { MDI_THERMOMETER, MDI_WATER_PERCENT } from '../lib/icons'
import { PendingController } from '../lib/pending-controller'
import { bigNumberStyles, dialStyles, glowStyles } from '../lib/shared-styles'
import { clamp } from '../lib/slider'
import './cgh-circular-slider'
import './cgh-number-buttons'
import type { HassEntity, HomeAssistant } from '../types'

// ClimateEntityFeature bits (kept local — no HA frontend package dependency).
const FEATURE_TARGET_TEMPERATURE = 1
const FEATURE_TARGET_TEMPERATURE_RANGE = 2

type Bound = 'low' | 'high'
type TargetKey = 'temperature' | 'target_temp_low' | 'target_temp_high'

/**
 * Temperature control: dial + action/target/current info + step buttons. The
 * buttons can be left out; the dial as a whole is dropped by the parent.
 *
 * Single-setpoint vs. range is decided like HA's
 * `ha-state-control-climate-temperature`: `TARGET_TEMPERATURE` with a concrete
 * `temperature` first, otherwise `TARGET_TEMPERATURE_RANGE` with low/high.
 * Layout mirrors HA too: target big in the centre (integer + superscript unit +
 * subscript decimals), current small below it, step buttons at the dial's foot.
 */
@customElement('cgh-climate-temperature')
export class CghClimateTemperature extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public stateObj?: HassEntity
  @property({ type: Boolean }) public buttons = true

  @state() private _bound: Bound = 'low'
  private _pending = new PendingController<TargetKey>(this)

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('stateObj')) {
      this._pending.sync(changed.get('stateObj') as HassEntity | undefined, this.stateObj)
    }
  }

  private _target(key: TargetKey): number | undefined {
    return this._pending.get(key) ?? (this.stateObj?.attributes[key] as number | undefined)
  }

  private get _min(): number {
    return (this.stateObj?.attributes.min_temp as number) ?? 5
  }

  private get _max(): number {
    return (this.stateObj?.attributes.max_temp as number) ?? 35
  }

  private get _features(): number {
    return (this.stateObj?.attributes.supported_features as number) ?? 0
  }

  private get _supportsTemperature(): boolean {
    return (
      (this._features & FEATURE_TARGET_TEMPERATURE) !== 0 &&
      this.stateObj?.attributes.temperature != null
    )
  }

  private get _supportsRange(): boolean {
    return (
      (this._features & FEATURE_TARGET_TEMPERATURE_RANGE) !== 0 &&
      this.stateObj?.attributes.target_temp_low != null &&
      this.stateObj?.attributes.target_temp_high != null
    )
  }

  private get _step(): number {
    return targetStep(this.hass, this.stateObj)
  }

  private get _digits(): number {
    return stepDigits(this._step)
  }

  private get _unit(): string {
    return (
      (this.hass?.config?.unit_system?.temperature as string) ??
      (this.stateObj?.attributes.unit_of_measurement as string) ??
      ''
    )
  }

  /**
   * Fills the dial like HA's `SLIDER_MODES`: heat = start, cool = end, the rest
   * full. Like HA, `auto` and `off` take the direction of the device's only
   * heat/cool mode — a heat-only TRV in `auto` still heats up to the setpoint.
   */
  private get _mode(): 'start' | 'end' | 'full' {
    const state = this.stateObj?.state
    const heatCool = ((this.stateObj?.attributes.hvac_modes as string[]) ?? []).filter(
      (m) => m === 'heat' || m === 'cool' || m === 'heat_cool'
    )
    const mode =
      heatCool.length === 1 && (state === 'auto' || state === 'off') ? heatCool[0] : state
    if (mode === 'heat') return 'start'
    if (mode === 'cool') return 'end'
    return 'full'
  }

  private get _inactive(): boolean {
    const state = this.stateObj?.state
    return state === 'off' || state === 'unavailable' || state === 'unknown'
  }

  private _big(value: number | null | undefined) {
    return bigNumber(this.hass, value, { digits: this._digits, unit: this._unit })
  }

  private _send(data: Partial<Record<TargetKey, number>>): void {
    if (!this.hass || !this.stateObj) return
    this._pending.set(data)
    this.hass.callService('climate', 'set_temperature', {
      entity_id: this.stateObj.entity_id,
      ...data,
    })
  }

  private _setSingle(value: number): void {
    this._send({ temperature: value })
  }

  private _setRange(low: number, high: number): void {
    this._send({ target_temp_low: low, target_temp_high: high })
  }

  private _onStep(e: CustomEvent<{ direction: number }>): void {
    const move = (value: number) =>
      clamp(value + e.detail.direction * this._step, this._min, this._max, this._step)
    if (this._supportsRange) {
      const low = this._target('target_temp_low')!
      const high = this._target('target_temp_high')!
      if (this._bound === 'low') {
        const next = move(low)
        if (next !== low && next <= high) this._setRange(next, high)
      } else {
        const next = move(high)
        if (next !== high && next >= low) this._setRange(low, next)
      }
    } else if (this._supportsTemperature) {
      const current = this._target('temperature')!
      const next = move(current)
      if (next !== current) this._setSingle(next)
    }
  }

  private _renderInfo(
    range: boolean,
    current: number | undefined,
    target?: number,
    low?: number,
    high?: number
  ) {
    const action = translateHvacAction(
      this.hass,
      this.stateObj?.attributes.hvac_action as string | undefined,
      this.stateObj?.state
    )
    const currentHumidity = this.stateObj?.attributes.current_humidity as
      | number
      | undefined
    const color = actionColor(this.stateObj)
    const actionStyle = styleMap(color ? { color } : {})

    return html`
      <div class="overlay">
        ${
          action
            ? html`<div class="action" style=${actionStyle}>${action}</div>`
            : nothing
        }
        ${
          range
            ? html`<div class="range">
                <button
                  class="bound ${this._bound === 'low' ? 'sel' : ''}"
                  @click=${() => (this._bound = 'low')}
                >
                  ${this._big(low)}
                </button>
                <button
                  class="bound ${this._bound === 'high' ? 'sel' : ''}"
                  @click=${() => (this._bound = 'high')}
                >
                  ${this._big(high)}
                </button>
              </div>`
            : html`<div class="primary">${this._big(target)}</div>`
        }
        ${
          current != null || currentHumidity != null
            ? html`<div class="secondary" style=${actionStyle}>
                ${
                  current != null
                    ? html`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${MDI_THERMOMETER} />
                        </svg>
                        ${new Intl.NumberFormat(numberLocale(this.hass), {
                          maximumFractionDigits: 1,
                        }).format(current)}
                        ${this._unit}
                      </span>`
                    : nothing
                }
                ${
                  current != null && currentHumidity != null
                    ? html`<span class="sep">·</span>`
                    : nothing
                }
                ${
                  currentHumidity != null
                    ? html`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${MDI_WATER_PERCENT} />
                        </svg>
                        ${new Intl.NumberFormat(numberLocale(this.hass), {
                          maximumFractionDigits: 0,
                        }).format(currentHumidity)}
                        %
                      </span>`
                    : nothing
                }
              </div>`
            : nothing
        }
      </div>
    `
  }

  protected render() {
    if (!this.stateObj) return nothing

    const attrs = this.stateObj.attributes
    const current = attrs.current_temperature as number | undefined
    const range = this._supportsRange
    const single = !range && this._supportsTemperature

    const low = range ? this._target('target_temp_low') : undefined
    const high = range ? this._target('target_temp_high') : undefined
    const target = single ? this._target('temperature') : undefined

    return html`
      <div
        class="wrap"
        style=${styleMap({
          '--cgh-slider-color': stateColor(this.stateObj),
          '--cgh-slider-low': 'var(--state-climate-heat-color, #ff5722)',
          '--cgh-slider-high': 'var(--state-climate-cool-color, #2196f3)',
          '--cgh-action-color': actionColor(this.stateObj) ?? 'transparent',
        })}
      >
        <div class="dial ${this.buttons ? '' : 'no-buttons'}">
          <div class="glow"></div>
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${this._mode}
            .inactive=${this._inactive}
            .dual=${range}
            .bound=${this._bound}
            .value=${target ?? nothing}
            .low=${low ?? nothing}
            .high=${high ?? nothing}
            .current=${current ?? nothing}
            .disabled=${!single && !range}
            @value-changed=${(e: CustomEvent) =>
              e.detail.value != null && this._setSingle(e.detail.value)}
            @low-changing=${() => (this._bound = 'low')}
            @high-changing=${() => (this._bound = 'high')}
            @low-changed=${(e: CustomEvent) => {
              const v = e.detail.value
              if (v != null && high != null) this._setRange(v, high)
            }}
            @high-changed=${(e: CustomEvent) => {
              const v = e.detail.value
              if (v != null && low != null) this._setRange(low, v)
            }}
          ></cgh-circular-slider>

          ${this._renderInfo(range, current, target, low, high)}
          ${
            this.buttons && (single || range)
              ? html`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .color=${range && !this._inactive
                      ? this._bound === 'high'
                        ? 'var(--state-climate-cool-color, #2196f3)'
                        : 'var(--state-climate-heat-color, #ff5722)'
                      : undefined}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`
              : nothing
          }
        </div>
      </div>
    `
  }

  static styles = [
    bigNumberStyles,
    glowStyles,
    dialStyles,
    css`
    :host {
      display: block;
    }
    .wrap {
      display: block;
    }
    .dial {
      position: relative;
      width: min(100%, var(--cgh-content-width, 320px));
      aspect-ratio: 1;
      margin: 0 auto;
    }
    cgh-circular-slider {
      position: absolute;
      inset: 0;
    }
    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      pointer-events: none;
      text-align: center;
      color: var(--primary-text-color);
      font-size: 1rem;
    }
    .action {
      color: inherit;
      font-size: 1.1rem;
      font-weight: var(--ha-font-weight-medium, 500);
      text-transform: capitalize;
      min-height: 1.5em;
    }
    .primary {
      color: inherit;
    }
    .secondary {
      display: flex;
      align-items: center;
      gap: 6px;
      color: inherit;
      font-weight: var(--ha-font-weight-medium, 500);
      font-size: 1.1rem;
    }
    .reading {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .sep {
      opacity: 0.5;
    }
    .secondary svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .buttons {
      position: absolute;
      bottom: 10px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
    }
    .range {
      display: flex;
      gap: 16px;
      pointer-events: auto;
    }
    .bound {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      color: var(--primary-text-color);
      opacity: 0.5;
      cursor: pointer;
    }
    .bound.sel {
      opacity: 1;
    }
  `,
  ]
}
