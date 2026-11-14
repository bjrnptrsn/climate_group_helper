import { LitElement, css, html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { tileStyles } from '../lib/shared-styles'

export interface SelectOption {
  value: string
  label: string
  icon?: string
}

/**
 * A tile that shows a feature's current value and opens a dropdown of options.
 *
 * Emits `cgh-select` with `{ value }` — for the selected option only with
 * `reselect`: the group treats every command as new, so a repeat would end a
 * boost and start the schedule hold. Mirrors HA's `ha-control-select-menu`
 * (the more-info tiles): no chevron, and the selected option highlighted in the
 * primary colour. The look (`tileStyles`) is our own, kept quiet next to the
 * dial: icon chip, hairline edge, `accent` and `active` for colour.
 */
@customElement('cgh-select-tile')
export class CghSelectTile extends LitElement {
  @property() public icon?: string
  @property() public label = ''
  @property() public value?: string
  @property({ attribute: false }) public options: SelectOption[] = []
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean }) public reselect = false
  /** CSS colour of the icon chip (the mode tile: the dial's colour). */
  @property() public accent?: string
  /** Tinted: the tile shows a value other than its neutral one. */
  @property({ type: Boolean }) public active = false

  @state() private _open = false
  @state() private _up = false

  private _onDocumentClick = (e: Event): void => {
    if (!e.composedPath().includes(this)) this._open = false
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this._onDocumentClick)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this._onDocumentClick)
  }

  private get _valueLabel(): string {
    return (
      this.options.find((o) => o.value === this.value)?.label ?? this.value ?? ''
    )
  }

  private _toggle(): void {
    if (this.disabled) return
    if (this._open) {
      this._open = false
      return
    }
    // Open upwards when the menu would not fit below the tile.
    const rect = this.getBoundingClientRect()
    const estimated = Math.min(this.options.length * 48 + 8, 400)
    const spaceBelow = window.innerHeight - rect.bottom
    this._up = spaceBelow < estimated && rect.top > spaceBelow
    this._open = true
  }

  private _select(value: string): void {
    this._open = false
    if (value === this.value && !this.reselect) return
    this.dispatchEvent(
      new CustomEvent('cgh-select', {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    )
  }

  protected render() {
    return html`
      <div class="wrap">
        <button
          class="tile ${this.active ? 'active' : ''} ${this.accent ? 'accented' : ''}"
          style=${this.accent ? `--accent: ${this.accent}` : ''}
          title=${`${this.label}: ${this._valueLabel}`}
          ?disabled=${this.disabled}
          @click=${this._toggle}
        >
          ${
            this.icon
              ? html`<span class="chip"
                  ><svg viewBox="0 0 24 24"><path d=${this.icon} /></svg
                ></span>`
              : nothing
          }
          <span class="content">
            <span class="label">${this.label}</span>
            <span class="value">${this._valueLabel}</span>
          </span>
        </button>
        ${
          this._open
            ? html`<div class="menu ${this._up ? 'up' : ''}" role="listbox">
                ${this.options.map(
                  (o) => html`<button
                    class="option ${o.value === this.value ? 'selected' : ''}"
                    role="option"
                    aria-selected=${o.value === this.value}
                    @click=${() => this._select(o.value)}
                  >
                    ${
                      o.icon
                        ? html`<svg viewBox="0 0 24 24">
                            <path d=${o.icon} />
                          </svg>`
                        : nothing
                    }
                    <span>${o.label}</span>
                  </button>`
                )}
              </div>`
            : nothing
        }
      </div>
    `
  }

  static styles = [
    tileStyles,
    css`
    :host {
      display: block;
      min-width: 0;
      font-size: var(--ha-font-size-m, 0.875rem);
    }
    .wrap {
      position: relative;
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      flex: 1;
      min-width: 0;
    }
    /* One line each: a long label (Horizontal swing, longer in other
       languages) would wrap and push the value out of the tile. */
    .label {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ha-font-size-s, 0.75rem);
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
    }
    .value {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      max-height: 400px;
      overflow-y: auto;
      padding: 4px;
      border: 1px solid var(--wa-color-surface-border, var(--divider-color));
      border-radius: var(--ha-border-radius-md, 12px);
      background: var(--card-background-color, #fff);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
    }
    .menu.up {
      top: auto;
      bottom: calc(100% + 4px);
    }
    .option {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 6px 12px;
      border: none;
      border-radius: var(--ha-border-radius-sm, 8px);
      background: transparent;
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .option:hover {
      background: color-mix(
        in srgb,
        var(--disabled-color, #bdbdbd) 20%,
        transparent
      );
    }
    .option.selected {
      color: var(--primary-color);
      background: var(--ha-color-fill-primary-quiet-resting, transparent);
    }
    .option svg {
      flex: none;
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
  `,
  ]
}
