import { LitElement, css, html, nothing } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import { formatOffset, formatTarget } from '../lib/format'
import { LocalizeMixin, translateHvacAction } from '../lib/i18n'
import {
  MDI_ALERT_OUTLINE,
  MDI_BATTERY_ALERT_VARIANT_OUTLINE,
  MDI_CROWN_OUTLINE,
  MDI_LOCK_OUTLINE,
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
} from '../lib/status'
import { WakeController } from '../lib/wake-controller'
import type { HassEntity, HomeAssistant } from '../types'

const SETPOINT_ATTRS = ['temperature', 'target_temp_low', 'target_temp_high']

/**
 * Member list opened from the status panel's dot strip: one row per member with
 * its current action and target, isolated/OOB/master/low battery marked. With
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
  /** Members with a low battery → that battery's state (`lowBatteryMembers()`). */
  @property({ attribute: false }) public lowBattery: Record<string, HassEntity> = {}
  /**
   * The group's attributes: `member_divergence`, `member_offsets`, and
   * `target_state` with what shifts or suspends it.
   */
  @property({ attribute: false }) public group?: Record<string, unknown>
  /** Rows open the member's more-info dialog; off in the demo, whose ids HA lacks. */
  @property({ type: Boolean }) public navigable = false

  // Marks wait out the quiet window after a target change; re-render when it ends.
  private _wake = new WakeController(this, () => deviationQuietRemaining(this.group))

  private get _divergence(): Record<string, Record<string, unknown>> {
    return (
      (this.group?.member_divergence as Record<string, Record<string, unknown>> | undefined) ?? {}
    )
  }

  private _deviates(id: string, attr: string): boolean {
    const members = this._divergence[attr]
    return (
      !!members &&
      id in members &&
      deviatesFromTarget(this.group, id, attr, members[id], this.hass?.states[id]?.attributes)
    )
  }

  private _values(id: string): { text: string; deviates: boolean }[] {
    const divergence = this._divergence
    return MEMBER_DIVERGENCE_ATTRS.filter((attr) => id in (divergence[attr] ?? {})).map(
      (attr) => ({
        text: divergenceValue(this.hass, id, attr, divergence[attr][id]),
        deviates: this._deviates(id, attr),
      })
    )
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

  /** The battery mark's tooltip: the level where the sensor has one. */
  private _batteryText(battery: HassEntity): string {
    if (battery.entity_id.startsWith('binary_sensor.')) return this.t('member.low_battery')
    return this.hass?.formatEntityState?.(battery, battery.state) ?? `${battery.state} %`
  }

  protected render() {
    if (!this.members.length) return nothing

    const dots = memberDots(
      this.members,
      this.hass?.states ?? {},
      this.isolated,
      this.oob,
      this.master,
      deviatingMembers(this.group, this.hass?.states)
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
          // Every row renders all seven cells, empty ones without any content
          // (`nothing`, so `:empty` holds and they add no spacing). The details
          // button is positioned absolutely over the row: it takes no grid cell,
          // and the row stays a `listitem`.
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
                : nothing}${d.id in this.lowBattery
                ? html`<svg class="mark battery" viewBox="0 0 24 24">
                    <title>${this._batteryText(this.lowBattery[d.id])}</title>
                    <path d=${MDI_BATTERY_ALERT_VARIANT_OUTLINE} />
                  </svg>`
                : nothing}</span>
              <span class="values">${values.length
                ? values.map(
                    (v, i) =>
                      html`${i ? ' · ' : nothing}<span
                          class="value ${v.deviates ? 'deviates' : ''}"
                          >${v.text}</span
                        >`
                  )
                : nothing}</span>
              <span class="action">${this._action(d.id)}</span>
              <span class="offset">${offset
                ? formatOffset(offset, this.hass, true)
                : nothing}</span>
              <span class="target ${targetDeviates ? 'deviates' : ''}"
                >${target ?? nothing}</span
              >
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
         dot | name | marks | values | action | offset | target.
         The menu sizes itself to this content, so the name column must report
         its real width (max-content), not 0. When the menu hits its maximum
         width, disputed values wrap between entries and a name gives way
         only down to its minimum. */
      .list {
        display: grid;
        grid-template-columns: auto minmax(auto, max-content) auto auto auto auto auto;
        row-gap: 2px;
      }
      .member {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        align-items: center;
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
      .values:not(:empty),
      .action,
      .offset:not(:empty),
      .target:not(:empty) {
        padding-left: 8px;
      }
      .name {
        min-width: 5em;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--primary-text-color);
      }
      .values {
        white-space: normal;
      }
      .value {
        white-space: nowrap;
      }
      /* Above the details button, so the marks keep their tooltips. */
      .marks {
        display: inline-flex;
        gap: 4px;
        position: relative;
        z-index: 1;
      }
      .mark {
        width: 14px;
        height: 14px;
        fill: var(--secondary-text-color);
      }
      .mark.oob {
        fill: var(--warning-color, #ff9800);
      }
      .mark.battery {
        fill: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
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
      /* Misses the group's target. */
      .deviates {
        color: var(--warning-color, #ff9800);
      }
    `,
  ]
}
