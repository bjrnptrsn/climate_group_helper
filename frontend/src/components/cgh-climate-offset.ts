import { LitElement, css, html, nothing, type PropertyValues } from 'lit'
import { property } from 'lit/decorators.js'
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
import { LocalizeMixin } from '../lib/i18n'
import { MDI_THERMOMETER, MDI_THERMOSTAT, MDI_WATER_PERCENT } from '../lib/icons'
import { PendingController } from '../lib/pending-controller'
import { bigNumberStyles, dialStyles, glowStyles } from '../lib/shared-styles'
import { clamp } from '../lib/slider'
import './cgh-circular-slider'
import './cgh-number-buttons'
import type { HassEntity, HomeAssistant } from '../types'

// The group offset entity's own bounds, used when it reports none.
const DEFAULT_MIN = -5
const DEFAULT_MAX = 5
const DEFAULT_STEP = 0.5

/**
 * Group offset control: the dial sets the group's offset `number` entity via
 * `number.set_value`. Range, step and unit come from that entity; colour, glow,
 * the target and the readings below the value from the group, like the
 * temperature view.
 * The ring fills from 0 towards the value.
 */
@customElement('cgh-climate-offset')
export class CghClimateOffset extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  /** The group — colour, glow and readings. */
  @property({ attribute: false }) public stateObj?: HassEntity
  /** The group's offset `number` entity. */
  @property({ attribute: false }) public offsetObj?: HassEntity
  @property({ type: Boolean }) public buttons = true

  private _pending = new PendingController<'value'>(this, (entity) => entity?.state)

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('offsetObj')) {
      this._pending.sync(changed.get('offsetObj') as HassEntity | undefined, this.offsetObj)
    }
  }

  /** The entity's value; undefined while it reports none (unavailable, unknown). */
  private get _target(): number | undefined {
    const reported = Number(this.offsetObj?.state)
    if (!Number.isFinite(reported)) return undefined
    return this._pending.get('value') ?? reported
  }

  private _attr(key: string, fallback: number): number {
    const value = this.offsetObj?.attributes[key]
    return typeof value === 'number' ? value : fallback
  }

  private get _min(): number {
    return this._attr('min', DEFAULT_MIN)
  }

  private get _max(): number {
    return this._attr('max', DEFAULT_MAX)
  }

  private get _step(): number {
    return this._attr('step', DEFAULT_STEP)
  }

  private get _digits(): number {
    return stepDigits(this._step)
  }

  /** Unit of the readings — the same as the temperature view's. */
  private get _temperatureUnit(): string {
    return (
      (this.hass?.config?.unit_system?.temperature as string) ??
      (this.stateObj?.attributes.unit_of_measurement as string) ??
      ''
    )
  }

  /** Unit of the offset: the entity's own, else HA's (like `formatOffset()`). */
  private get _unit(): string {
    return (
      (this.offsetObj?.attributes.unit_of_measurement as string | undefined) ??
      (this.hass?.config?.unit_system?.temperature as string | undefined) ??
      '°C'
    )
  }

  private _set(value: number): void {
    if (!this.hass || !this.offsetObj || this._target == null) return
    this._pending.set({ value })
    this.hass.callService('number', 'set_value', {
      entity_id: this.offsetObj.entity_id,
      value,
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

  /**
   * The group's setpoint as the temperature view shows it — the members'
   * value, with the offset already in it. A range shows both bounds; no line
   * without a setpoint.
   */
  private _renderTarget() {
    const attrs = this.stateObj?.attributes
    const temperature = attrs?.temperature as number | undefined
    const low = attrs?.target_temp_low as number | undefined
    const high = attrs?.target_temp_high as number | undefined
    const digits = stepDigits(targetStep(this.hass, this.stateObj))
    const format = (value: number) =>
      new Intl.NumberFormat(numberLocale(this.hass), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value)
    const unit = this._temperatureUnit
    let value: string | undefined
    if (temperature != null) {
      value = `${format(temperature)} ${unit}`
    } else if (low != null && high != null) {
      value = `${format(low)}–${format(high)} ${unit}`
    }
    if (value === undefined) return nothing
    return html`<div class="target">
      <svg viewBox="0 0 24 24"><path d=${MDI_THERMOSTAT} /></svg>
      ${value}
    </div>`
  }

  private _renderReadings(color: string | undefined) {
    const current = this.stateObj?.attributes.current_temperature as number | undefined
    const humidity = this.stateObj?.attributes.current_humidity as number | undefined
    if (current == null && humidity == null) return nothing
    return html`<div class="secondary" style=${styleMap(color ? { color } : {})}>
      ${
        current != null
          ? html`<span class="reading">
              <svg viewBox="0 0 24 24"><path d=${MDI_THERMOMETER} /></svg>
              ${new Intl.NumberFormat(numberLocale(this.hass), {
                maximumFractionDigits: 1,
              }).format(current)}
              ${this._temperatureUnit}
            </span>`
          : nothing
      }
      ${current != null && humidity != null ? html`<span class="sep">·</span>` : nothing}
      ${
        humidity != null
          ? html`<span class="reading">
              <svg viewBox="0 0 24 24"><path d=${MDI_WATER_PERCENT} /></svg>
              ${new Intl.NumberFormat(numberLocale(this.hass), {
                maximumFractionDigits: 0,
              }).format(humidity)}
              %
            </span>`
          : nothing
      }
    </div>`
  }

  protected render() {
    if (!this.stateObj || !this.offsetObj) return nothing

    const target = this._target
    const color = actionColor(this.stateObj)

    return html`
      <div
        class="wrap"
        style=${styleMap({
          '--cgh-slider-color': stateColor(this.stateObj),
          '--cgh-action-color': color ?? 'transparent',
        })}
      >
        <div class="dial ${this.buttons ? '' : 'no-buttons'}">
          <div class="glow"></div>
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${'origin'}
            .origin=${0}
            .value=${target ?? nothing}
            .disabled=${target == null}
            @value-changed=${(e: CustomEvent) =>
              e.detail.value != null && this._set(e.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action" style=${styleMap(color ? { color } : {})}>
              ${this.t('offset.label')}
            </div>
            <div class="primary">
              ${bigNumber(this.hass, target, {
                digits: this._digits,
                unit: this._unit,
                signed: true,
              })}
            </div>
            ${this._renderTarget()}
            ${this._renderReadings(color)}
          </div>

          ${
            this.buttons
              ? html`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .disabled=${target == null}
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
        min-height: 1.5em;
      }
      .primary {
        color: inherit;
      }
      .target {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--secondary-text-color);
        font-weight: var(--ha-font-weight-medium, 500);
        font-size: 1rem;
      }
      .target svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
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
    `,
  ]
}
