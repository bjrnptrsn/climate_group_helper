import { LitElement, css, html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { LocalizeMixin, type TranslationKey } from '../lib/i18n'
import { MDI_PLUS_MINUS_VARIANT, MDI_THERMOMETER, MDI_WATER_PERCENT } from '../lib/icons'
import './cgh-climate-humidity'
import './cgh-climate-offset'
import './cgh-climate-temperature'
import type { Control, HassEntity, HomeAssistant } from '../types'

// ClimateEntityFeature bit (kept local — no HA frontend package dependency).
const FEATURE_TARGET_HUMIDITY = 4

export type View = 'offset' | 'temperature' | 'humidity'

const SEGMENTS: Record<View, { icon: string; label: TranslationKey }> = {
  offset: { icon: MDI_PLUS_MINUS_VARIANT, label: 'offset.label' },
  temperature: { icon: MDI_THERMOMETER, label: 'common.temperature' },
  humidity: { icon: MDI_WATER_PERCENT, label: 'common.humidity' },
}

/**
 * Composed climate control: the offset, temperature or humidity dial plus a
 * segmented toggle between them (only when there are at least two). Which
 * views take part is the card's choice; the entity decides what exists.
 *
 * Mirrors the more-info dialog, which swaps `ha-state-control-climate-temperature`
 * and `ha-state-control-climate-humidity` behind a segmented control.
 */
@customElement('cgh-climate-control')
export class CghClimateControl extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public stateObj?: HassEntity
  @property({ attribute: false }) public controls: Control[] = ['slider', 'buttons', 'toggle']
  /** The group offset entity; set only when its segment should show. */
  @property({ attribute: false }) public offsetObj?: HassEntity
  /** `false` leaves out the temperature view. */
  @property({ attribute: false }) public showTemperature = true
  /** `false` leaves out the humidity view, even where the entity offers it. */
  @property({ attribute: false }) public showHumidity = true

  @state() private _view: View = 'temperature'

  private get _hasHumidity(): boolean {
    // Show the humidity view only when the entity offers a humidity setpoint
    // (`TARGET_HUMIDITY`). A current reading alone is shown on the temperature
    // view's secondary line, not as a separate view.
    const features = (this.stateObj?.attributes.supported_features as number) ?? 0
    return (features & FEATURE_TARGET_HUMIDITY) !== 0
  }

  /**
   * The dial's views, in segment order. Never empty: with nothing selected
   * left (e.g. only humidity on an entity without a humidity setpoint) the
   * dial falls back to temperature, which every climate entity has.
   */
  private get _views(): View[] {
    const views: View[] = [
      ...(this.offsetObj ? (['offset'] as const) : []),
      ...(this.showTemperature ? (['temperature'] as const) : []),
      ...(this.showHumidity && this._hasHumidity ? (['humidity'] as const) : []),
    ]
    return views.length ? views : ['temperature']
  }

  private _dial(view: View, buttons: boolean) {
    switch (view) {
      case 'offset':
        return html`<cgh-climate-offset
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .offsetObj=${this.offsetObj}
          .buttons=${buttons}
        ></cgh-climate-offset>`
      case 'humidity':
        return html`<cgh-climate-humidity
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .buttons=${buttons}
        ></cgh-climate-humidity>`
      default:
        return html`<cgh-climate-temperature
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .buttons=${buttons}
        ></cgh-climate-temperature>`
    }
  }

  protected render() {
    // `slider` is the whole dial block (ring, readings, buttons); the card
    // drops its cell then. The view selection belongs to the switch: without
    // it the dial shows temperature alone, whatever views are configured. A
    // single view needs no switch. Start on temperature, or the first view
    // when temperature is left out — and go there when the selected view has
    // gone.
    const dial = this.controls.includes('slider')
    const views: View[] = this.controls.includes('toggle') ? this._views : ['temperature']
    const toggle = dial && views.length >= 2
    const home: View = views.includes('temperature') ? 'temperature' : views[0]
    const view: View = toggle && views.includes(this._view) ? this._view : home
    if (!dial) return nothing

    return html`
      <div class="control">
        ${this._dial(view, this.controls.includes('buttons'))}
        ${
          toggle
            ? html`<div class="toggle">
                ${views.map(
                  (v) => html`<button
                    class="seg ${v} ${view === v ? 'active' : ''}"
                    aria-label=${this.t(SEGMENTS[v].label)}
                    @click=${() => (this._view = v)}
                  >
                    <svg viewBox="0 0 24 24"><path d=${SEGMENTS[v].icon} /></svg>
                  </button>`
                )}
              </div>`
            : nothing
        }
      </div>
    `
  }

  static styles = css`
    :host {
      display: block;
    }
    /* The −/+ buttons sit 10px above the dial's bottom edge: 6px more makes
       the card's 16px between blocks. */
    .control {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .toggle {
      align-self: center;
      display: flex;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      /* Smoked glass: one fixed lightness step below the card, slightly
         translucent, and a soft top shadow — the switch reads as set into the
         card on any theme. A step, not a black overlay: the same black alpha
         that is subtle on a dark card turns a light one heavy grey. The first
         declaration is the fallback for browsers without relative colours. */
      border: 1px solid color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      background: rgb(0 0 0 / 0.22);
      background: oklch(
        from var(--ha-card-background, var(--card-background-color, #fff))
          calc(l - 0.05) c h / 0.9
      );
      box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.15);
    }
    .seg {
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        background-color 150ms ease,
        color 150ms ease,
        box-shadow 150ms ease;
    }
    .seg:not(.active):hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    /* Light glass on the smoked track: a translucent tint with a brighter
       hairline, the icon at full text colour — the inactive ones are muted. */
    .seg.active {
      background: color-mix(in srgb, var(--primary-text-color) 15%, transparent);
      color: var(--primary-text-color);
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 10%, transparent),
        0 1px 3px rgb(0 0 0 / 0.2);
    }
    .seg svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
  `
}
