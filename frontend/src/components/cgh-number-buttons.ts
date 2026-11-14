import { LitElement, css, html, nothing } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { styleMap } from 'lit/directives/style-map.js'
import { LocalizeMixin } from '../lib/i18n'
import type { HomeAssistant } from '../types'

/** Step buttons (−/+). Emits `cgh-step` with `{ direction: -1 | 1 }`. */
@customElement('cgh-number-buttons')
export class CghNumberButtons extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ type: Boolean }) public disabled = false
  @property() public color?: string

  private get _outlineStyle() {
    return this.color ? styleMap({ '--cgh-btn-outline': this.color }) : nothing
  }

  private _emit(direction: number): void {
    this.dispatchEvent(
      new CustomEvent('cgh-step', {
        detail: { direction },
        bubbles: true,
        composed: true,
      })
    )
  }

  protected render() {
    return html`
      <button
        class="btn"
        style=${this._outlineStyle}
        ?disabled=${this.disabled}
        aria-label=${this.t('common.decrease')}
        @click=${() => this._emit(-1)}
      >
        <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z" /></svg>
      </button>
      <button
        class="btn"
        style=${this._outlineStyle}
        ?disabled=${this.disabled}
        aria-label=${this.t('common.increase')}
        @click=${() => this._emit(1)}
      >
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    `
  }

  static styles = css`
    :host {
      display: flex;
      gap: 24px;
      justify-content: center;
    }
    .btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      /* The tiles' quiet surface and hairline, so the controls read as one set. */
      border: 1px solid
        var(
          --cgh-btn-outline,
          color-mix(in srgb, var(--primary-text-color) 14%, transparent)
        );
      background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
      color: var(--primary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition:
        background-color 150ms ease,
        transform 100ms ease;
    }
    .btn:hover {
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    }
    .btn:active:not(:disabled) {
      transform: scale(0.95);
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
  `
}
