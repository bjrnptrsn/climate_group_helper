import { LitElement, css, html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import {
  MDI_ACCOUNT_ARROW_RIGHT,
  MDI_ALERT_OUTLINE,
  MDI_BATTERY_ALERT_VARIANT_OUTLINE,
  MDI_CALL_SPLIT,
  MDI_CALENDAR_CLOCK,
  MDI_GESTURE_TAP,
  MDI_LOCK_OUTLINE,
  MDI_POWER,
  MDI_ROCKET_LAUNCH,
  MDI_SYNC,
  MDI_TIMER_SAND,
  MDI_TUNE,
  MDI_WINDOW_OPEN_VARIANT,
  batteryLevelIcon,
} from '../lib/icons'
import {
  formatElapsedDuration,
  formatOffset,
  formatTime,
  remainingMinutes,
} from '../lib/format'
import { batteryLevelClass, lowBatteryMembers, weakestBattery } from '../lib/battery'
import { LocalizeMixin, type TranslationKey } from '../lib/i18n'
import { LiveClockController } from '../lib/live-clock-controller'
import { WakeController } from '../lib/wake-controller'
import { memberDotStyles } from '../lib/shared-styles'
import {
  deviatingMembers,
  deviationQuietRemaining,
  divergenceValue,
  memberDotClass,
  memberDots,
  scheduleLayerKey,
  selectPanelItem,
} from '../lib/status'
import './cgh-member-list'
import type { HassEntity, HomeAssistant, StatusSection } from '../types'

interface Item {
  kind: string
  icon: string
  label: string
  /** Kept on one line (a duration) — never a free-length name. */
  detail?: string
  /** The schedule entity's name (calendar or helper); wraps like the label. */
  scheduleName?: string
  /** Short marker right after the label — a fixed spot a long name cannot push
   * around; never split. */
  pill?: string
}

// Keep the member strip compact: beyond this many members the rest is summed up.
const MAX_DOTS = 10

// Features with a runtime state worth a badge. Range Template and Master are
// configuration only — a failed master shows on its member dot instead.
const FEATURE_ORDER = ['window', 'presence', 'schedule', 'sync', 'isolation', 'calibration']

const BLOCK_META: Record<string, { labelKey: TranslationKey; icon: string }> = {
  switch: { labelKey: 'block.switch', icon: MDI_POWER },
  window: { labelKey: 'block.window', icon: MDI_WINDOW_OPEN_VARIANT },
  presence: { labelKey: 'block.presence', icon: MDI_ACCOUNT_ARROW_RIGHT },
}

const switchLabelKey = (action: unknown): TranslationKey => {
  if (action === 'temperature') return 'block.switch_temperature'
  if (action === 'release') return 'block.switch_release'
  return 'block.switch'
}

const FEATURE_META: Record<string, { labelKey: TranslationKey; icon: string }> =
  {
    window: { labelKey: 'feature.window', icon: MDI_WINDOW_OPEN_VARIANT },
    presence: { labelKey: 'feature.presence', icon: MDI_ACCOUNT_ARROW_RIGHT },
    schedule: { labelKey: 'feature.schedule', icon: MDI_CALENDAR_CLOCK },
    sync: { labelKey: 'feature.sync', icon: MDI_SYNC },
    isolation: { labelKey: 'feature.isolation', icon: MDI_LOCK_OUTLINE },
    calibration: { labelKey: 'feature.calibration', icon: MDI_TUNE },
  }

const SOURCE_META: Record<string, { labelKey: TranslationKey; icon: string }> = {
  ui: { labelKey: 'source.manual', icon: MDI_GESTURE_TAP },
  group: { labelKey: 'source.manual', icon: MDI_GESTURE_TAP },
  sync_mode: { labelKey: 'source.sync', icon: MDI_SYNC },
  adopt_only: { labelKey: 'source.mirror', icon: MDI_SYNC },
  window_control: { labelKey: 'source.window', icon: MDI_WINDOW_OPEN_VARIANT },
  schedule: { labelKey: 'source.schedule', icon: MDI_CALENDAR_CLOCK },
}

/**
 * Status cell: a panel with three stacked rows — members (dots + active count,
 * clicking opens the member list), the main status or who writes the target
 * (with slot/next info below) — plus a row of feature badges and a deviations
 * area shown only when present.
 *
 * Fixed row order so the panel never reflows with width; empty rows drop out.
 * Display-only (see the card scope); the clock keeps the countdowns live.
 */
@customElement('cgh-status')
export class CghStatus extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public stateObj?: HassEntity
  @property({ attribute: false }) public sections: StatusSection[] = [
    'panel',
    'badges',
    'deviations',
  ]
  /** `false` hides every battery display (`battery: false` in the card config). */
  @property({ attribute: false }) public battery = true
  /** Member rows open the member's more-info dialog (off in the demo). */
  @property({ attribute: false }) public navigable = false

  private _clock = new LiveClockController(this)
  // The dots' deviation rings wait out the quiet window after a target change.
  private _wake = new WakeController(this, () =>
    deviationQuietRemaining(this.stateObj?.attributes)
  )

  @state() private _membersOpen = false
  @state() private _membersUp = false

  private _onDocumentClick = (e: Event): void => {
    if (!this._membersOpen) return
    const wrapper = this.renderRoot.querySelector('.members')
    if (wrapper && !e.composedPath().includes(wrapper)) {
      this._membersOpen = false
    }
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this._onDocumentClick)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this._onDocumentClick)
  }
  // A row opened a member's details: the click landed inside the menu, so the
  // outside-click handler does not close it. The event goes on to HA.
  private _closeMembers(): void {
    this._membersOpen = false
  }

  private _toggleMembers(): void {
    if (this._membersOpen) {
      this._membersOpen = false
      return
    }
    // Open upwards when the list would not fit below (the strip sits near the
    // card's bottom edge).
    const rect = this.renderRoot
      .querySelector('.members')
      ?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      this._membersUp = spaceBelow < 320 && rect.top > spaceBelow
    }
    this._membersOpen = true
  }

  private _items(): Item[] {
    const attrs = this.stateObj?.attributes
    if (!attrs) return []

    const items: Item[] = []
    // The backend resolves the dominant blocker; render that instead of
    // re-deriving the priority from the raw array (backend-first).
    const reason = attrs.blocking_reason as
      | { source?: string; since?: string }
      | undefined
    if (reason?.source && BLOCK_META[reason.source]) {
      const meta = BLOCK_META[reason.source]
      const labelKey =
        reason.source === 'switch'
          ? switchLabelKey(attrs.main_switch_action)
          : meta.labelKey
      const started = reason.since ? Date.parse(reason.since) : NaN
      const elapsed = Number.isNaN(started)
        ? undefined
        : Math.floor((Date.now() - started) / 60000)
      items.push({
        kind: reason.source,
        icon: meta.icon,
        label: this.t(labelKey),
        detail:
          elapsed == null
            ? undefined
            : this.t('status.blocking_for', {
                duration: formatElapsedDuration(elapsed, this.hass),
              }),
      })
    }

    const boost = remainingMinutes(attrs.boost_until)
    if (boost != null) {
      items.push({
        kind: 'boost',
        icon: MDI_ROCKET_LAUNCH,
        label: this.t('status.boost', { minutes: boost }),
      })
    }
    const hold = remainingMinutes(attrs.schedule_hold_until)
    if (hold != null) {
      items.push({
        kind: 'hold',
        icon: MDI_TIMER_SAND,
        label: this.t('status.hold', { minutes: hold }),
      })
    }
    // A calendar slot title still raises the schedule panel; the title itself
    // sits in the info line below, the label names the layer.
    if (attrs.active_schedule_slot_title) {
      items.push({
        kind: 'schedule',
        icon: MDI_CALENDAR_CLOCK,
        label: this._scheduleLabel(),
        ...this._scheduleSource(),
      })
    }

    return items
  }

  private _panel(items: Item[]): Item | undefined {
    const found = selectPanelItem(items)
    if (found) return found
    const source = this.stateObj?.attributes.last_source as string | undefined
    if (source && SOURCE_META[source]) {
      // A schedule helper has no title, so a bypass or fallback without one
      // is only named here.
      if (source === 'schedule') {
        return {
          kind: 'source',
          icon: SOURCE_META[source].icon,
          label: this._scheduleLabel(),
          ...this._scheduleSource(),
        }
      }
      return {
        kind: 'source',
        icon: SOURCE_META[source].icon,
        label: this.t(SOURCE_META[source].labelKey),
      }
    }
    return undefined
  }

  private _scheduleLabel(): string {
    return this.t(scheduleLayerKey(this.stateObj?.attributes.active_schedule_layer))
  }

  /**
   * The entity behind the shown layer — the bypass's own while it runs, the
   * main schedule's otherwise (also before the first slot read) — and whether a
   * service set it in place of the configured one.
   */
  private _scheduleSource(): Pick<Item, 'scheduleName' | 'pill'> {
    const attrs = this.stateObj?.attributes ?? {}
    const bypass = attrs.active_schedule_layer === 'bypass'
    const entityId = (
      bypass ? attrs.active_schedule_bypass_entity : attrs.active_schedule_entity
    ) as string | undefined
    if (!entityId) return {}
    const overridden = bypass
      ? attrs.schedule_bypass_entity_overridden
      : attrs.schedule_entity_overridden
    return {
      scheduleName: this._name(entityId),
      pill: overridden ? this.t('status.via_service') : undefined,
    }
  }

  /** The group offset, while the backend applies it (not during a boost or block). */
  private _offset(): string | undefined {
    const attrs = this.stateObj?.attributes
    const offset = attrs?.group_offset as number | undefined
    if (!offset) return undefined
    const blocks = (attrs?.blocking_sources as string[] | undefined) ?? []
    if (blocks.length || attrs?.boost_until) return undefined
    return this.t('status.offset', { value: formatOffset(offset, this.hass) })
  }

  /**
   * Lit: the feature acts right now. Schedule and sync run all the time, so for
   * them it means "the current target came from here" — a running slot the user
   * has overridden by hand is not lit.
   */
  private _featureActive(feature: string): boolean {
    const attrs = this.stateObj?.attributes ?? {}
    const blocks = (attrs.blocking_sources as string[]) ?? []
    switch (feature) {
      case 'window':
        return blocks.includes('window')
      case 'presence':
        return blocks.includes('presence')
      case 'schedule':
        return attrs.last_source === 'schedule'
      case 'sync':
        return attrs.last_source === 'sync_mode' || attrs.last_source === 'adopt_only'
      case 'isolation':
        return ((attrs.isolated_members as string[]) ?? []).length > 0
      default:
        return false
    }
  }

  /** Grey: a slot or preset has paused the feature (its meta-key override). */
  private _featurePaused(feature: string): boolean {
    const attrs = this.stateObj?.attributes ?? {}
    const overrides = (attrs.config_overrides as Record<string, unknown>) ?? {}
    switch (feature) {
      case 'window':
        return overrides.window_mode === 'disabled'
      case 'presence':
        return overrides.presence_mode === 'disabled'
      case 'calibration':
        return overrides.calibration_mode === 'disabled'
      case 'sync':
        return attrs.effective_sync_mode === 'disabled'
      case 'isolation':
        // A partial bypass leaves the other rules working.
        return overrides.isolation_bypass === 'all'
      default:
        return false
    }
  }

  /** A slot is running: the schedule entity is `on` — calendar or helper alike. */
  private _scheduleOn(): boolean {
    const entityId = this.stateObj?.attributes.active_schedule_entity as string | undefined
    return !!entityId && this.hass?.states[entityId]?.state === 'on'
  }

  private _nextEvent(entityId?: string): string | undefined {
    if (!entityId) return undefined
    const next = this.hass?.states[entityId]?.attributes
      .next_event as string | undefined
    if (!next) return undefined
    const date = new Date(next)
    if (isNaN(date.getTime())) return undefined
    return formatTime(date, this.hass, { hour: '2-digit', minute: '2-digit' })
  }

  private _name(id: string): string {
    return (this.hass?.states[id]?.attributes.friendly_name as string) ?? id
  }

  /** A battery's reading as HA formats it (level, or Low/Normal). */
  private _batteryText(battery: HassEntity): string {
    const formatted = this.hass?.formatEntityState?.(battery, battery.state)
    if (formatted) return formatted
    if (!battery.entity_id.startsWith('binary_sensor.')) return `${battery.state} %`
    return battery.state === 'on' ? this.t('member.low_battery') : battery.state
  }

  private _names(ids: string[]): string {
    return ids.map((id) => this._name(id)).join(', ')
  }

  // `hvac_mode` is a climate entity's state, not an attribute: HA has no
  // attribute name for it, and its values are state translations.
  private _divergenceLabel(attr: string): string {
    if (attr === 'hvac_mode') return this.t('tile.mode')
    const stateObj = this.stateObj
    return (stateObj && this.hass?.formatEntityAttributeName?.(stateObj, attr)) || attr
  }

  private _divergenceText(attr: string, members: Record<string, unknown>): string {
    return Object.entries(members)
      .map(
        ([id, value]) => `${this._name(id)} ${divergenceValue(this.hass, id, attr, value)}`
      )
      .join(', ')
  }

  protected render() {
    const attrs = this.stateObj?.attributes
    if (!attrs) return nothing

    const items = this._items()
    const panel = this._panel(items)
    const showPanel = this.sections.includes('panel')
    const showBadges = this.sections.includes('badges')
    const showDeviations = this.sections.includes('deviations')
    const enabled = (attrs.enabled_features as string[]) ?? []
    const features = FEATURE_ORDER.filter((f) => enabled.includes(f))
    const isolated = (attrs.isolated_members as string[]) ?? []
    const oob = (attrs.oob_members as string[]) ?? []
    const divergence =
      (attrs.member_divergence as Record<string, Record<string, unknown>>) ?? {}
    const divAttrs = Object.keys(divergence)
    const members = (attrs.member_entities as string[]) ?? []
    const lowBattery = this.battery ? lowBatteryMembers(members, this.hass) : {}
    const lowBatteryIds = Object.keys(lowBattery)
    const weakest = this.battery ? weakestBattery(members, this.hass) : undefined
    const hasDeviations = !!(
      isolated.length ||
      oob.length ||
      divAttrs.length ||
      lowBatteryIds.length
    )

    const master = attrs.master_entity_id as string | undefined
    const dots = memberDots(
      members,
      this.hass?.states ?? {},
      isolated,
      oob,
      master,
      deviatingMembers(attrs, this.hass?.states)
    )
    const shownDots = dots.slice(0, MAX_DOTS)
    const extraDots = dots.length - shownDots.length
    const totalCount = (attrs.total_member_count as number) ?? dots.length
    const activeCount =
      (attrs.active_member_count as number) ??
      dots.filter(
        (d) =>
          d.state !== 'off' &&
          d.state !== 'unavailable' &&
          d.state !== 'unknown'
      ).length

    const slotTitle = attrs.active_schedule_slot_title as string | undefined
    const scheduleEntity = attrs.active_schedule_entity as string | undefined
    // Calendar slots carry a title; a schedule helper has none, so a running
    // block falls back to a plain label rather than leaving the cell empty.
    const slotLabel = slotTitle || (this._scheduleOn() ? this.t('status.active') : undefined)
    // The next event is always the main schedule's; while a bypass runs it is
    // not the next change that takes effect.
    const next =
      attrs.active_schedule_layer === 'bypass' ? undefined : this._nextEvent(scheduleEntity)
    const offset = this._offset()

    return html`
      <div class="status">
        ${
          showPanel
            ? html`<div class="panel ${panel?.kind ?? ''}">
                ${
                  offset || totalCount
                    ? html`<div class="panel-top">
                ${weakest
                  ? html`<svg
                      class="battery ${batteryLevelClass(weakest.level)}"
                      viewBox="0 0 24 24"
                    >
                      <title
                        >${this._name(weakest.member)}: ${this._batteryText(
                          weakest.state
                        )}</title
                      >
                      <path d=${batteryLevelIcon(weakest.level)} />
                    </svg>`
                  : nothing}
                ${offset ? html`<span class="offset">${offset}</span>` : nothing}
                ${
                  totalCount
                    ? html`<div class="members">
                        <button
                          class="members-toggle"
                          aria-expanded=${this._membersOpen}
                          @click=${this._toggleMembers}
                        >
                          <span class="dots">
                            ${shownDots.map(
                              (d) =>
                                html`<span
                                  class="dot ${memberDotClass(d)}"
                                  title=${this._name(d.id)}
                                ></span>`
                            )}
                            ${extraDots > 0
                              ? html`<span class="more">+${extraDots}</span>`
                              : nothing}
                          </span>
                          <span class="count">${activeCount}/${totalCount}</span>
                        </button>
                        ${
                          this._membersOpen
                            ? html`<div
                                class="members-menu ${this._membersUp
                                  ? 'up'
                                  : ''}"
                                @hass-more-info=${this._closeMembers}
                              >
                                <cgh-member-list
                                  .hass=${this.hass}
                                  .members=${members}
                                  .isolated=${isolated}
                                  .oob=${oob}
                                  .lowBattery=${lowBattery}
                                  .master=${master}
                                  .group=${attrs}
                                  .navigable=${this.navigable}
                                ></cgh-member-list>
                              </div>`
                            : nothing
                        }
                      </div>`
                    : nothing
                }
                      </div>`
                    : nothing
                }
                ${
                  panel
                    ? html`<div class="panel-main">
                        <svg viewBox="0 0 24 24"><path d=${panel.icon} /></svg>
                        <span
                          >${panel.label}${panel.pill
                            ? html` <span class="pill">${panel.pill}</span>`
                            : nothing}${panel.scheduleName
                            ? html` <span class="schedule-name"
                                  >·&nbsp;<span class="name">${panel.scheduleName}</span></span
                                >`
                            : nothing}${panel.detail
                            ? html` <span class="detail">· ${panel.detail}</span>`
                            : nothing}</span
                        >
                      </div>`
                    : nothing
                }
                ${
                  slotLabel || next
                    ? html`<div class="panel-info">
                        ${slotLabel
                          ? html`<span class="slot">${slotLabel}</span>`
                          : nothing}
                        ${next
                          ? html`<span class="next"
                              >${this.t('status.next', { time: next })}</span
                            >`
                          : nothing}
                      </div>`
                    : nothing
                }
              </div>`
            : nothing
        }
        ${
          showBadges && (features.length || items.some((i) => i.kind === 'boost'))
            ? html`<div class="badges">
                ${features.map(
                  (f) => html`<div
                    class="badge feature ${f} ${this._featureActive(f)
                      ? 'on'
                      : this._featurePaused(f)
                        ? 'paused'
                        : ''}"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d=${FEATURE_META[f].icon} />
                    </svg>
                    <span>${this.t(FEATURE_META[f].labelKey)}</span>
                  </div>`
                )}
                ${items
                  .filter((i) => i.kind === 'boost' || i.kind === 'hold')
                  .map(
                    // The name only, like the feature badges: the time
                    // left is the panel's.
                    (i) => html`<div class="badge ${i.kind} on">
                      <svg viewBox="0 0 24 24"><path d=${i.icon} /></svg>
                      <span>${this.t(i.kind === 'boost' ? 'boost.label' : 'feature.hold')}</span>
                    </div>`
                  )}
              </div>`
            : nothing
        }
        ${
          showDeviations
            ? html`<div class="deviations ${hasDeviations ? '' : 'empty'}">
                ${
                  isolated.length
                    ? html`<div class="deviation isolation">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${MDI_LOCK_OUTLINE} />
                          </svg>
                          <span
                            >${this.t('status.isolated', {
                              count: isolated.length,
                            })}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(isolated)}</div>
                      </div>`
                    : nothing
                }
                ${
                  oob.length
                    ? html`<div class="deviation oob">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${MDI_ALERT_OUTLINE} />
                          </svg>
                          <span
                            >${this.t('status.oob', {
                              count: oob.length,
                            })}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(oob)}</div>
                      </div>`
                    : nothing
                }
                ${
                  lowBatteryIds.length
                    ? html`<div class="deviation battery">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${MDI_BATTERY_ALERT_VARIANT_OUTLINE} />
                          </svg>
                          <span
                            >${this.t('status.low_battery', {
                              count: lowBatteryIds.length,
                            })}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(lowBatteryIds)}</div>
                      </div>`
                    : nothing
                }
                ${
                  divAttrs.length
                    ? html`<div class="deviation divergence">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${MDI_CALL_SPLIT} />
                          </svg>
                          <span
                            >${this.t('status.divergence', {
                              count: divAttrs.length,
                            })}</span
                          >
                        </div>
                        <div class="dev-names">
                          ${divAttrs
                            .map(
                              (a) =>
                                `${this._divergenceLabel(a)}: ${this._divergenceText(a, divergence[a])}`
                            )
                            .join(' · ')}
                        </div>
                      </div>`
                    : nothing
                }
                ${
                  hasDeviations
                    ? nothing
                    : html`<div class="deviation none">
                        ${this.t('status.no_deviations')}
                      </div>`
                }
              </div>`
            : nothing
        }
      </div>
    `
  }

  static styles = [
    memberDotStyles,
    css`
    :host {
      display: block;
    }
    .status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 8px;
    }
    .panel {
      /* The backdrop-filter makes this a stacking context; lifting it over the
         later badge/deviation siblings lets the member dropdown paint above
         them instead of showing through. */
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      min-height: 40px;
      padding: 8px 12px;
      box-sizing: border-box;
      border-radius: var(--ha-border-radius-md, 12px);
      /* A display set into the card, like an LCD: opaque, one fixed
         lightness step below the card — as deep as the view switch, no
         shallower — with most of the card's hue taken out, a hairline border and a top
         inset shadow. The step keeps the same depth on every theme and a light
         theme's panel light; the low chroma keeps a tinted theme's display
         from taking the card's hue. The first declaration is the fallback for
         browsers without relative colours. */
      background: var(--secondary-background-color, #e5e5e5);
      background: oklch(
        from var(--ha-card-background, var(--card-background-color, #fff))
          calc(l - 0.04) calc(c * 0.4) h
      );
      backdrop-filter: blur(14px) saturate(1.3);
      -webkit-backdrop-filter: blur(14px) saturate(1.3);
      border: 1px solid
        color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      box-shadow: inset 0 1px 4px rgb(0 0 0 / 0.3);
    }
    /* Offset on the left, member strip on the right; either may be absent.
       The battery's height as a floor: the row keeps it when the battery is
       hidden or unknown, so the panel does not change height with it. */
    .panel-top {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      min-height: 16px;
    }
    /* Lying on its side: MDI only has upright battery icons. */
    .panel-top .battery {
      flex: none;
      width: 16px;
      height: 16px;
      transform: rotate(90deg);
    }
    .panel-top .battery.high {
      fill: var(--state-sensor-battery-high-color, var(--success-color, #43a047));
    }
    .panel-top .battery.medium {
      fill: var(--state-sensor-battery-medium-color, var(--warning-color, #ff9800));
    }
    .panel-top .battery.low {
      fill: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
    }
    .offset {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.95);
      color: var(--secondary-text-color);
    }
    .members {
      position: relative;
      margin-left: auto;
    }
    .members-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      font: inherit;
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.95);
      cursor: pointer;
    }
    .members-toggle:hover {
      color: var(--primary-text-color);
    }
    .dots {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .more {
      opacity: 0.7;
    }
    .members-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 20;
      /* Anchored to the small dot strip: without an explicit width the menu
         would shrink to the strip's width and squeeze every name. */
      width: max-content;
      min-width: 200px;
      max-width: min(380px, calc(100vw - 32px));
      max-height: 320px;
      overflow-y: auto;
      padding: 6px;
      border: 1px solid
        var(
          --divider-color,
          color-mix(in srgb, var(--primary-text-color) 12%, transparent)
        );
      border-radius: var(--ha-border-radius-md, 12px);
      background: var(
        --secondary-background-color,
        var(--card-background-color, #fff)
      );
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
    }
    .members-menu.up {
      top: auto;
      bottom: calc(100% + 6px);
    }
    .panel-main {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      font-size: var(--ha-font-size-l, 1.05rem);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    /* Wraps rather than truncates; the duration stays on one line of its own
       rather than splitting between the number and the unit. */
    .panel-main > span {
      min-width: 0;
      overflow-wrap: break-word;
    }
    .panel-main .detail {
      white-space: nowrap;
    }
    /* A qualifier of the layer, not a second headline: names run long and
       every group now shows one. Only the name is set small; the dot keeps
       the label's size, matching the detail's separator, and stays bound to
       the name by a no-break space. */
    .panel-main .schedule-name {
      color: var(--secondary-text-color);
      font-size: 0.95em;
      font-weight: var(--ha-font-weight-normal, 400);
    }
    .panel-main .schedule-name .name {
      font-size: 0.75em;
    }
    /* The schedule name wraps with the label; the pill moves to the next line
       as a whole. */
    .panel-main .pill {
      display: inline-block;
      white-space: nowrap;
      padding: 0 5px;
      border-radius: 999px;
      /* Outline only, like the card's other frames and rings: a side note,
         not a surface. The info colour, softened by mixing with the text
         colour: pastel on a dark theme, muted on a light one. */
      border: 1px solid
        color-mix(in srgb, var(--info-color, #2196f3) 35%, transparent);
      color: color-mix(
        in srgb,
        var(--info-color, #2196f3) 55%,
        var(--primary-text-color)
      );
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.8);
      font-weight: var(--ha-font-weight-normal, 400);
      line-height: 1.35;
      vertical-align: middle;
    }
    .panel-main svg {
      flex: none;
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .panel-info {
      display: flex;
      align-items: baseline;
      gap: 8px 12px;
      min-width: 0;
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.95);
      color: var(--secondary-text-color);
    }
    .panel-info span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .panel-info .next {
      margin-left: auto;
      text-align: right;
    }
    .panel.source .panel-main {
      font-weight: var(--ha-font-weight-normal, 400);
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 16px;
    }
    .badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-xs, 0.7rem);
    }
    .badge svg {
      flex: none;
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    .badge.on.window {
      color: var(--warning-color, #ff9800);
    }
    .badge.on.presence {
      color: var(--info-color, #2196f3);
    }
    .badge.on.schedule,
    .badge.on.isolation,
    .badge.on.sync,
    .badge.on.calibration,
    .badge.on.boost,
    .badge.on.hold {
      color: var(--primary-color);
    }
    /* Active badges glow in their own colour (icon via drop-shadow). */
    .badge.on svg {
      filter: drop-shadow(0 0 4px currentColor);
    }
    /* Paused by a slot or preset: the plain badge's colour, only quieter —
       --disabled-color is a dark grey in HA's dark mode and vanished. */
    .badge.paused {
      opacity: 0.45;
    }
    .deviations {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      /* One frame around all entries. Dashed (information, not a control),
         so it needs more opacity than the solid hairlines to read alike. */
      border: 1px dashed
        color-mix(in srgb, var(--primary-text-color) 20%, transparent);
      border-radius: var(--ha-border-radius-md, 12px);
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .deviations.empty {
      border: none;
      padding: 0;
    }
    .deviation {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .deviation.none {
      text-align: center;
      opacity: 0.6;
    }
    .deviation.oob {
      color: var(--warning-color, #ff9800);
    }
    .deviation.oob .dev-head svg {
      filter: drop-shadow(0 0 3px currentColor);
    }
    .deviation.battery {
      color: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
    }
    .dev-head {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dev-head svg {
      flex: none;
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    /* Wraps rather than truncates: a cut-off list hides the very members it
       is about. */
    .dev-names {
      overflow-wrap: anywhere;
    }
    `,
  ]
}
