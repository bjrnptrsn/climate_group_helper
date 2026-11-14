import { LitElement, css, html, nothing } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { tileStyles } from '../lib/shared-styles'

/**
 * A feature-row tile that triggers an action instead of opening a dropdown:
 * same size and fill as `cgh-select-tile`, one vertically centred line of text.
 *
 * Emits `cgh-action` on a tap. `description` becomes the tooltip and the
 * accessible name, for what the label alone does not say.
 */
@customElement('cgh-action-tile')
export class CghActionTile extends LitElement {
  @property() public icon?: string
  @property() public label = ''
  @property() public description = ''
  /** Highlighted: what the tile starts is running (a tap would end it). */
  @property({ type: Boolean }) public active = false

  private _tap(): void {
    this.dispatchEvent(
      new CustomEvent('cgh-action', { bubbles: true, composed: true })
    )
  }

  protected render() {
    const description = this.description || this.label
    return html`
      <button
        class="tile ${this.active ? 'active' : ''}"
        title=${description}
        aria-label=${description}
        @click=${this._tap}
      >
        ${
          this.icon
            ? html`<span class="chip"
                ><svg viewBox="0 0 24 24"><path d=${this.icon} /></svg
              ></span>`
            : nothing
        }
        <span class="label">${this.label}</span>
      </button>
    `
  }

  // The look is shared with `cgh-select-tile` so the row reads as one set.
  static styles = [
    tileStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        font-size: var(--ha-font-size-m, 0.875rem);
      }
      .label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: var(--ha-font-weight-medium, 500);
      }
    `,
  ]
}
