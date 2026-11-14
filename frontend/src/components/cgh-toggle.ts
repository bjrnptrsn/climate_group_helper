import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'

/**
 * An on/off switch in the look of HA's `ha-switch` (track, thumb, border,
 * hover, focus ring, disabled), built in-house: `ha-switch` is internal to HA's
 * frontend, loaded on demand and has changed its base before.
 *
 * Emits `cgh-toggle` with `{ checked }` — the new value — on a tap; it does not
 * flip itself, the owner sets `checked` from the entity's state.
 */
@customElement('cgh-toggle')
export class CghToggle extends LitElement {
  @property({ type: Boolean }) public checked = false
  @property({ type: Boolean }) public disabled = false
  @property() public label = ''

  private _tap(): void {
    if (this.disabled) return
    this.dispatchEvent(
      new CustomEvent('cgh-toggle', {
        detail: { checked: !this.checked },
        bubbles: true,
        composed: true,
      })
    )
  }

  protected render() {
    return html`
      <button
        class="toggle ${this.checked ? 'checked' : ''}"
        role="switch"
        aria-checked=${this.checked ? 'true' : 'false'}
        aria-label=${this.label}
        title=${this.label}
        ?disabled=${this.disabled}
        @click=${this._tap}
      >
        <span class="track"><span class="thumb"></span></span>
      </button>
    `
  }

  // Values and theme variables follow `ha-switch`; the fallbacks keep it
  // visible on themes and HA versions without the `--ha-color-*` tokens.
  static styles = css`
    :host {
      display: inline-block;
      /* A notch smaller than ha-switch's 48×24: it sits next to the title. */
      --cgh-toggle-width: 40px;
      --cgh-toggle-height: 20px;
      --cgh-toggle-thumb: 14px;
    }
    .toggle {
      /* At least 40px to tap, like ha-switch. */
      min-width: 40px;
      min-height: 40px;
      padding: 0;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .toggle:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .track {
      position: relative;
      box-sizing: border-box;
      width: var(--cgh-toggle-width);
      height: var(--cgh-toggle-height);
      border-radius: calc(var(--cgh-toggle-height) / 2);
      border: 1px solid
        var(--ha-color-border-neutral-normal, var(--secondary-text-color));
      background-color: var(
        --ha-color-fill-disabled-quiet-resting,
        color-mix(in srgb, var(--primary-text-color) 15%, transparent)
      );
      transition: background-color 150ms, border-color 150ms;
    }
    .thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      width: var(--cgh-toggle-thumb);
      height: var(--cgh-toggle-thumb);
      border-radius: 50%;
      transform: translateY(-50%);
      background-color: var(--ha-color-on-neutral-normal, var(--secondary-text-color));
      box-shadow: var(--ha-box-shadow-s, 0 1px 2px rgba(0, 0, 0, 0.3));
      transition: left 150ms, background-color 150ms;
    }
    .toggle:not(:disabled):hover .track,
    .toggle:focus-visible .track {
      background-color: var(
        --ha-color-fill-disabled-quiet-hover,
        color-mix(in srgb, var(--primary-text-color) 22%, transparent)
      );
    }
    .checked .track {
      border-color: var(--ha-color-border-primary-loud, var(--primary-color));
      background-color: var(--ha-color-fill-primary-normal-resting, var(--primary-color));
    }
    .checked:not(:disabled):hover .track,
    .checked:focus-visible .track {
      background-color: var(
        --ha-color-fill-primary-normal-hover,
        color-mix(in srgb, var(--primary-color) 85%, var(--primary-text-color))
      );
    }
    .checked .thumb {
      left: calc(var(--cgh-toggle-width) - var(--cgh-toggle-thumb) - 4px);
      background-color: var(
        --ha-color-on-primary-normal,
        var(--text-primary-color, #fff)
      );
    }
    .toggle:focus-visible {
      outline: none;
    }
    .toggle:focus-visible .track {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
  `
}
