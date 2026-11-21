import { LitElement, css, html, nothing } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { formatOffset, formatTarget } from '../lib/format'
import { LocalizeMixin, translateHvacAction } from '../lib/i18n'
import { type MemberBattery, batteryLevelClass, batteryText } from '../lib/battery'
import {
  MDI_ALERT_OUTLINE,
  MDI_CROWN_OUTLINE,
  MDI_LOCK_OUTLINE,
  batteryLevelIcon,
} from '../lib/icons'
import { memberDotStyles } from '../lib/shared-styles'
import {
  MEMBER_DIVERGENCE_ATTRS,
  deviatesFromTarget,
  deviatingMembers,
  deviationQuietRemaining,
  divergenceValue,
  memberDotClass,
  memberDots,
  settledDivergence,
} from '../lib/status'
import { WakeController } from '../lib/wake-controller'
import type { HassEntity, HomeAssistant } from '../types'

const SETPOINT_ATTRS = ['temperature', 'target_temp_low', 'target_temp_high']

/**
 * Member list opened from the status panel's dot strip: one row per member with
 * its current action and target, isolated/OOB/master marked, its battery level
 * at the end (the reading as tooltip). With
 * `navigable`, a tap on a row opens that member's more-info dialog.
 *
 * While the group disagrees, each row also carries the member's own value for
 * every disputed attribute. The values come from the `member_divergence`
 * snapshot, not from `hass.states`, so the list matches the deviations area
 * exactly. A disputed value (or setpoint) that misses the group's target is
 * marked — see `deviatesFromTarget()`.
 */
@customElement('cgh-member-list')
export class CghMemberList extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public members: string[] = []
  @property({ attribute: false }) public isolated: string[] = []
  @property({ attribute: false }) public oob: string[] = []
  @property({ attribute: false }) public master?: string
  /** Each member's weakest battery (`batteryByMember()`); members without one are absent. */
  @property({ attribute: false }) public batteries: Record<string, MemberBattery> = {}
  /**
   * The group's attributes: `member_divergence`, `member_offsets`, and
   * `target_state` with what shifts or suspends it.
   */
  @property({ attribute: false }) public group?: Record<string, unknown>
  /** When the status panel saw the divergence appear; it waits out the quiet window from there. */
  @property({ attribute: false }) public divergenceSince?: number
  /** Rows open the member's more-info dialog; off in the demo, whose ids HA lacks. */
  @property({ type: Boolean }) public navigable = false

  // Divergence waits out the quiet window; re-render when it ends.
  private _wake = new WakeController(this, () => this._quietRemaining())

  private _quietRemaining(): number {
    return deviationQuietRemaining(this.divergenceSince)
  }

  private get _divergence(): Record<string, Record<string, unknown>> {
    return settledDivergence(this.group, this._quietRemaining() > 0)
  }

  private _deviates(id: string, attr: string): boolean {
    const members = this._divergence[attr]
    return (
      !!members &&
      id in members &&
      deviatesFromTarget(this.group, id, attr, members[id], this.hass?.states[id]?.attributes)
    )
  }

  private _values(id: string): { text: string; label: string; deviates: boolean }[] {
    const divergence = this._divergence
    return MEMBER_DIVERGENCE_ATTRS.filter((attr) => id in (divergence[attr] ?? {})).map(
      (attr) => ({
        text: divergenceValue(this.hass, id, attr, divergence[attr][id]),
        label: this._attrName(id, attr),
        deviates: this._deviates(id, attr),
      })
    )
  }

  // The values line shows bare values in a fixed order; the tooltip names the
  // attribute. `hvac_mode` is the entity's state, so HA has no name for it.
  private _attrName(id: string, attr: string): string {
    if (attr === 'hvac_mode') return this.t('tile.mode')
    const member = this.hass?.states[id]
    return (member && this.hass?.formatEntityAttributeName?.(member, attr)) || attr
  }

  private _name(id: string): string {
    return (this.hass?.states[id]?.attributes.friendly_name as string) ?? id
  }

  private _action(id: string): string {
    const state = this.hass?.states[id]
    const action = state?.attributes.hvac_action as string | undefined
    const raw = action ?? state?.state
    if (!raw || raw === 'unavailable' || raw === 'unknown') {
      return this.t('member.unavailable')
    }
    return translateHvacAction(this.hass, action, state?.state)
  }

  private _openDetails(entityId: string): void {
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    )
  }

  protected render() {
    if (!this.members.length) return nothing

    const dots = memberDots(
      this.members,
      this.hass?.states ?? {},
      this.isolated,
      this.oob,
      this.master,
      deviatingMembers(this.group, this.hass?.states, this._quietRemaining() > 0)
    )

    return html`
      <div class="list ${this.navigable ? 'navigable' : ''}" role="list">
        ${dots.map((d) => {
          const target = formatTarget(
            this.hass?.states[d.id]?.attributes,
            this.hass
          )
          const values = this._values(d.id)
          const offset = (
            this.group?.member_offsets as Record<string, number> | undefined
          )?.[d.id]
          const targetDeviates = SETPOINT_ATTRS.some((attr) => this._deviates(d.id, attr))
          const battery = this.batteries[d.id]
          // Every row renders all seven cells of its main line, empty ones without
          // any content (`nothing`, so `:empty` holds and they add no spacing);
          // the disputed values follow as a second line only when there are
          // any. The details button is positioned absolutely over the row: it
          // takes no grid cell, and the row stays a `listitem`.
          return html`
            <div class="member" role="listitem">
              <span class="dot ${memberDotClass(d)}"></span>
              <span class="name" title=${d.id}>${this._name(d.id)}</span>
              <span class="marks">${d.master
                ? html`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${MDI_CROWN_OUTLINE} />
                  </svg>`
                : nothing}${d.isolated
                ? html`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${MDI_LOCK_OUTLINE} />
                  </svg>`
                : nothing}${d.oob
                ? html`<svg class="mark oob" viewBox="0 0 24 24">
                    <path d=${MDI_ALERT_OUTLINE} />
                  </svg>`
                : nothing}</span>
              <span class="action">${this._action(d.id)}</span>
              <span class="offset">${offset
                ? formatOffset(offset, this.hass, true)
                : nothing}</span>
              <span class="target ${targetDeviates ? 'deviates' : ''}"
                >${target ?? nothing}</span
              >
              <span class="battery">${battery
                ? html`<svg class=${batteryLevelClass(battery.level)} viewBox="0 0 24 24">
                    <title>${batteryText(battery.state, this.hass, this.t('member.low_battery'))}</title>
                    <path d=${batteryLevelIcon(battery.level)} />
                  </svg>`
                : nothing}</span>
              ${
                values.length
                  ? html`<span
                      class="values"
                      @click=${this.navigable ? () => this._openDetails(d.id) : nothing}
                      >${values.map(
                        (v) =>
                          html`<span
                            class="value ${v.deviates ? 'deviates' : ''}"
                            title="${v.label}: ${v.text}"
                            >${v.text}</span
                          >`
                      )}</span
                    >`
                  : nothing
              }
              ${
                this.navigable
                  ? html`<button
                      class="open"
                      title=${d.id}
                      aria-label=${this.t('member.details', { name: this._name(d.id) })}
                      @click=${() => this._openDetails(d.id)}
                    ></button>`
                  : nothing
              }
            </div>
          `
        })}
      </div>
    `
  }

  static styles = [
    memberDotStyles,
    css`
      :host {
        display: block;
        font-size: var(--ha-font-size-s, 0.75rem);
      }
      /* One column grid shared by all rows (subgrid), so action, offset and
         target line up however many extras a row carries:
         dot | name | marks | action | offset | target | battery.
         The menu sizes itself to this content, so the name column must report
         its real width (max-content), not 0. When the menu hits its maximum
         width, a name gives way only down to its minimum. */
      .list {
        display: grid;
        grid-template-columns: auto minmax(auto, max-content) auto auto auto auto auto;
        row-gap: 3px;
      }
      /* A faint line between two devices, centred in the gap, so a values
         line clearly belongs to the device above it. Outside the row's box:
         the hover tint does not cover it. */
      .member + .member::before {
        content: '';
        position: absolute;
        top: -2px;
        left: 6px;
        right: 6px;
        height: 1px;
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        pointer-events: none;
      }
      .member {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        align-items: center;
        /* Only between the main line and the values line, so a row without
           disputed values keeps its height. */
        row-gap: 2px;
        padding: 4px 6px;
        border-radius: var(--ha-border-radius-sm, 8px);
        white-space: nowrap;
        color: var(--secondary-text-color);
        position: relative;
      }
      .navigable .member:hover,
      .navigable .member:focus-within {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .open {
        position: absolute;
        inset: 0;
        padding: 0;
        border: none;
        border-radius: inherit;
        background: transparent;
        cursor: pointer;
      }
      .open:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }
      /* Spacing lives on filled cells, so an empty column adds none. */
      .name,
      .marks:not(:empty),
      .action,
      .offset:not(:empty),
      .target:not(:empty),
      .battery:not(:empty) {
        padding-left: 8px;
      }
      .name {
        min-width: 5em;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--primary-text-color);
      }
      /* The disputed values: a quieter second line from under the name to the
         row's end. It wraps between values, never inside one, and the
         separator hangs on the value before it, so a wrapped line never starts
         with a dot. Zero width with a full minimum keeps it out of the column
         sizing: the main line sets the menu's width, the values wrap in it. */
      .values {
        grid-row: 2;
        grid-column: 2 / -1;
        display: flex;
        flex-wrap: wrap;
        column-gap: 4px;
        width: 0;
        min-width: 100%;
        box-sizing: border-box;
        padding-left: 8px;
        font-size: 0.9em;
        white-space: normal;
        /* Above the details button, so each value's tooltip (the attribute's
           name) is reachable; a tap still opens the details (click handler). */
        position: relative;
        z-index: 1;
      }
      .navigable .values {
        cursor: pointer;
      }
      .value {
        white-space: nowrap;
      }
      /* The row's colour, not a deviating value's warning colour. */
      .value:not(:last-child)::after {
        content: ' ·';
        color: var(--secondary-text-color);
      }
      .marks {
        display: inline-flex;
        gap: 4px;
      }
      .mark {
        width: 14px;
        height: 14px;
        fill: var(--secondary-text-color);
      }
      .mark.oob {
        fill: var(--warning-color, #ff9800);
      }
      .action {
        text-transform: capitalize;
      }
      .offset,
      .target {
        justify-self: end;
        font-variant-numeric: tabular-nums;
      }
      .target {
        min-width: 46px;
        text-align: right;
      }
      /* Lying on its side like the panel's battery: MDI only has upright
         ones. Above the details button, so it keeps its tooltip. */
      .battery {
        display: inline-flex;
        position: relative;
        z-index: 1;
      }
      .battery svg {
        width: 14px;
        height: 14px;
        transform: rotate(90deg);
      }
      .battery .high {
        fill: var(--state-sensor-battery-high-color, var(--success-color, #43a047));
      }
      .battery .medium {
        fill: var(--state-sensor-battery-medium-color, var(--warning-color, #ff9800));
      }
      .battery .low {
        fill: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
      }
      /* Misses the group's target. */
      .deviates {
        color: var(--warning-color, #ff9800);
      }
    `,
  ]
}
