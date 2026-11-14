import { LitElement, css, html, nothing, type PropertyValues } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { styleMap } from 'lit/directives/style-map.js'
import { numberLocale } from '../lib/format'
import { LocalizeMixin } from '../lib/i18n'
import { MDI_WATER_PERCENT } from '../lib/icons'
import { PendingController } from '../lib/pending-controller'
import { dialStyles } from '../lib/shared-styles'
import { clamp } from '../lib/slider'
import './cgh-circular-slider'
import './cgh-number-buttons'
import type { HassEntity, HomeAssistant } from '../types'

/**
 * Humidity control: dial + target/current info + step buttons. The buttons
 * can be left out; the dial as a whole is dropped by the parent.
 *
 * Mirrors HA's `ha-state-control-climate-humidity`: the target humidity is the
 * entity's `humidity` attribute (HA's `TARGET_HUMIDITY` state attribute), the
 * big number carries `%` at the baseline, and the arc uses the humidifier state
 * colour.
 */
@customElement('cgh-climate-humidity')
export class CghClimateHumidity extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public stateObj?: HassEntity
  @property({ type: Boolean }) public buttons = true

  private _pending = new PendingController<'humidity'>(this)

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('stateObj')) {
      this._pending.sync(changed.get('stateObj') as HassEntity | undefined, this.stateObj)
    }
  }

  private get _target(): number | undefined {
    return (
      this._pending.get('humidity') ??
      (this.stateObj?.attributes.humidity as number | undefined)
    )
  }

  private get _current(): number | undefined {
    return this.stateObj?.attributes.current_humidity as number | undefined
  }

  private get _min(): number {
    return (this.stateObj?.attributes.min_humidity as number) ?? 0
  }

  private get _max(): number {
    return (this.stateObj?.attributes.max_humidity as number) ?? 100
  }

  private get _step(): number {
    return (this.stateObj?.attributes.target_humidity_step as number) ?? 1
  }

  private get _inactive(): boolean {
    const state = this.stateObj?.state
    return state === 'off' || state === 'unavailable' || state === 'unknown'
  }

  private _color(): string {
    return this._inactive
      ? 'var(--state-inactive-color, var(--disabled-color, #9e9e9e))'
      : 'var(--state-humidifier-on-color, #2196f3)'
  }

  private _set(value: number): void {
    if (!this.hass || !this.stateObj) return
    this._pending.set({ humidity: value })
    this.hass.callService('climate', 'set_humidity', {
      entity_id: this.stateObj.entity_id,
      humidity: value,
    })
  }

  private _onStep(e: CustomEvent<{ direction: number }>): void {
    const target = this._target
    if (target == null) return
    const next = clamp(
      target + e.detail.direction * this._step,
      this._min,
      this._max,
      this._step
    )
    if (next !== target) this._set(next)
  }

  private _format(value: number): string {
    return new Intl.NumberFormat(numberLocale(this.hass), {
      maximumFractionDigits: 0,
    }).format(value)
  }

  protected render() {
    if (!this.stateObj) return nothing

    const target = this._target
    const current = this._current

    return html`
      <div
        class="wrap"
        style=${styleMap({ '--cgh-slider-color': this._color() })}
      >
        <div class="dial ${this.buttons ? '' : 'no-buttons'}">
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${'start'}
            .inactive=${this._inactive}
            .value=${target ?? nothing}
            .current=${current ?? nothing}
            @value-changed=${(e: CustomEvent) =>
              e.detail.value != null && this._set(e.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action">${this.t('humidity.target')}</div>
            ${
              target != null
                ? html`<div class="primary">
                    <span class="int">${this._format(target)}</span
                    ><span class="unit">%</span>
                  </div>`
                : nothing
            }
            ${
              current != null
                ? html`<div class="secondary">
                    <svg viewBox="0 0 24 24">
                      <path d=${MDI_WATER_PERCENT} />
                    </svg>
                    ${this._format(current)} %
                  </div>`
                : nothing
            }
          </div>

          ${this.buttons
            ? html`<div class="buttons">
                <cgh-number-buttons
                  .hass=${this.hass}
                  @cgh-step=${this._onStep}
                ></cgh-number-buttons>
              </div>`
            : nothing}
        </div>
      </div>
    `
  }

  static styles = [
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
      width: min(100%, 320px);
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
      font-weight: var(--ha-font-weight-medium, 500);
      min-height: 1.5em;
    }
    .primary {
      display: inline-flex;
      align-items: baseline;
      color: inherit;
    }
    .int {
      font-size: 57px;
      line-height: 1.12;
      letter-spacing: -0.25px;
    }
    .unit {
      font-size: 24px;
      margin-left: 2px;
    }
    .secondary {
      display: flex;
      align-items: center;
      gap: 4px;
      color: inherit;
      font-weight: var(--ha-font-weight-medium, 500);
      font-size: 1.1rem;
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
  `,
  ]
}
