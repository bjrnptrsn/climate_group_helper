import { LitElement, css, html, nothing, type PropertyValues } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import {
  MDI_ACCOUNT_ARROW_RIGHT,
  MDI_ALERT,
  MDI_ALERT_OUTLINE,
  MDI_BATTERY_ALERT_VARIANT_OUTLINE,
  MDI_CALL_SPLIT,
  MDI_CALENDAR_CLOCK,
  MDI_GESTURE_TAP,
  MDI_LAN_DISCONNECT,
  MDI_LOCK_OUTLINE,
  MDI_PAUSE,
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
  formatEventTime,
  formatOffset,
  formatRemainingDuration,
  remainingMinutes,
} from '../lib/format'
import {
  batteryByMember,
  batteryLevelClass,
  batteryText,
  lowBatteryMembers,
  weakestBattery,
} from '../lib/battery'
import { LocalizeMixin, type TranslationKey } from '../lib/i18n'
import { BadgeFitController } from '../lib/badge-fit-controller'
import { LiveClockController } from '../lib/live-clock-controller'
import { WakeController } from '../lib/wake-controller'
import { memberDotStyles } from '../lib/shared-styles'
import {
  BADGE_FEATURES,
  deviatesFromTarget,
  deviatingMembers,
  deviationQuietRemaining,
  divergenceValue,
  hasDivergence,
  memberDotClass,
  memberDots,
  unavailableMembers,
  scheduleLayerKey,
  selectPanelItem,
  settledDivergence,
} from '../lib/status'
import './cgh-member-list'
import type { HassEntity, HomeAssistant, StatusSection } from '../types'

interface Item {
  kind: string
  icon: string
  label: string
  /** What the blocker does (the main switch's action); a short fixed word. */
  action?: string
  /** The member a sync or mirror took the target from; wraps like a name. */
  device?: string
  /** Kept on one line (a duration) — never a free-length name. */
  detail?: string
  /** The schedule entity's name (calendar or helper); wraps like the label. */
  scheduleName?: string
  /** Short marker right after the label — a fixed spot a long name cannot push
   * around; never split. */
  pill?: string
}

/** One kind of deviation: shown in the deviations area and the badge's popover. */
interface DeviationGroup {
  kind: 'isolation' | 'oob' | 'devices' | 'sensors' | 'battery' | 'divergence'
  icon: string
  head: string
  names: string
  /** Divergence only: one row per disputed setting, in place of `names`. */
  rows?: DivergenceRow[]
}

/** One disputed setting: its members grouped by the value they report. */
interface DivergenceRow {
  label: string
  values: { text: string; members: { name: string; deviates: boolean }[] }[]
}

// Keep the member strip compact: beyond this many members the rest is summed up.
const MAX_DOTS = 10

const BLOCK_META: Record<string, { labelKey: TranslationKey; icon: string }> = {
  switch: { labelKey: 'block.switch', icon: MDI_POWER },
  window: { labelKey: 'block.window', icon: MDI_WINDOW_OPEN_VARIANT },
  presence: { labelKey: 'block.presence', icon: MDI_ACCOUNT_ARROW_RIGHT },
}

const switchActionKey = (action: unknown): TranslationKey => {
  if (action === 'temperature') return 'block.switch_temperature'
  if (action === 'release') return 'block.switch_release'
  return 'block.switch_off'
}

// Typed by the badge list, so a feature added there must get its meta here.
const FEATURE_META: Record<
  (typeof BADGE_FEATURES)[number],
  { labelKey: TranslationKey; icon: string }
> = {
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
  /**
   * The panel carries a badge that opens the deviations as a popover
   * (`deviations_badge` in the card config) — shown only while there are any.
   */
  @property({ attribute: false }) public deviationsBadge = true
  /**
   * A divergence that appears waits out the quiet window before it shows. Off
   * where states jump instead of evolving (the demo), or every new situation
   * would hide its divergence.
   */
  @property({ attribute: false }) public quietWindow = true

  private _clock = new LiveClockController(this)
  // Divergence waits out the quiet window; re-render when it ends.
  private _wake = new WakeController(this, () => this._quietRemaining())
  // One line of badges: boost and hold come and go, and a second line would
  // make the card jump.
  private _badgeFit = new BadgeFitController(this, () =>
    this.renderRoot?.querySelector<HTMLElement>('.badges')
  )
  /**
   * Whether the last update had a divergence, and when it appeared where there
   * was none. The first state seen sets no moment: what is already there when
   * the card loads shows at once.
   */
  private _divergence?: { entity: string; diverged: boolean; since?: number }

  protected willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    const stateObj = this.stateObj
    if (!stateObj || !this.quietWindow) {
      this._divergence = undefined
      return
    }
    const diverged = hasDivergence(stateObj.attributes)
    const previous = this._divergence
    if (previous?.entity !== stateObj.entity_id) {
      this._divergence = { entity: stateObj.entity_id, diverged }
    } else if (diverged !== previous.diverged) {
      this._divergence = {
        entity: stateObj.entity_id,
        diverged,
        since: diverged ? Date.now() : undefined,
      }
    }
  }

  private _quietRemaining(): number {
    return deviationQuietRemaining(this._divergence?.since)
  }

  @state() private _membersOpen = false
  @state() private _membersUp = false
  private _membersOpener?: HTMLElement
  // Plain fields, so render can close a popover whose badge has gone without
  // scheduling another update; every other change calls requestUpdate().
  private _deviationsOpen = false
  private _deviationsUp = false

  // A click outside a menu closes it; inside (or on its own toggle) it stays.
  private _onDocumentClick = (e: Event): void => {
    const path = e.composedPath()
    const outside = (...selectors: string[]) =>
      selectors.every((s) => {
        const el = this.renderRoot.querySelector(s)
        return !el || !path.includes(el)
      })
    if (this._membersOpen && outside('.members', '.battery-toggle')) this._membersOpen = false
    if (this._deviationsOpen && outside('.dev-badge', '.deviations-menu')) {
      this._deviationsOpen = false
      this.requestUpdate()
    }
  }

  // Escape closes an open menu like a click outside. Focus inside the menu
  // goes back to its toggle, so it is not lost with the menu.
  private _onDocumentKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || !(this._membersOpen || this._deviationsOpen)) return
    const root = this.renderRoot as ShadowRoot
    const focused = root.activeElement
    const refocus = (menu: string, toggle: HTMLElement | null | undefined) => {
      if (focused && root.querySelector(menu)?.contains(focused)) toggle?.focus()
    }
    if (this._membersOpen) {
      refocus(
        '.members-menu',
        this._membersOpener?.isConnected
          ? this._membersOpener
          : root.querySelector<HTMLElement>('.members-toggle')
      )
      this._membersOpen = false
    }
    if (this._deviationsOpen) {
      refocus('.deviations-menu', root.querySelector<HTMLElement>('.dev-badge'))
      this._deviationsOpen = false
      this.requestUpdate()
    }
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this._onDocumentClick)
    document.addEventListener('keydown', this._onDocumentKeyDown)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this._onDocumentClick)
    document.removeEventListener('keydown', this._onDocumentKeyDown)
  }
  // A row opened a member's details: the click landed inside the menu, so the
  // outside-click handler does not close it. The event goes on to HA.
  private _closeMembers(): void {
    this._membersOpen = false
  }

  private _toggleMembers(e: Event): void {
    if (this._membersOpen) {
      this._membersOpen = false
      return
    }
    // The strip or the battery: Escape hands the focus back to this one.
    this._membersOpener = e.currentTarget as HTMLElement | undefined
    // Upwards by default, like the deviations: over the controls rather than
    // past the card's bottom edge. Down only when there is too little room
    // above and more below.
    const rect = this.renderRoot
      .querySelector('.members')
      ?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      this._membersUp = rect.top >= 320 || rect.top >= spaceBelow
    }
    this._deviationsOpen = false
    this._membersOpen = true
  }

  /** The deviations popover, anchored to the panel; one menu open at a time. */
  private _toggleDeviations(): void {
    if (this._deviationsOpen) {
      this._deviationsOpen = false
      this.requestUpdate()
      return
    }
    // Upwards by default, over the controls: the panel sits low in the card,
    // and below it the menu would run past the card's edge. Down only when
    // there is too little room above and more below.
    const rect = this.renderRoot.querySelector('.panel')?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      this._deviationsUp = rect.top >= 240 || rect.top >= spaceBelow
    }
    this._membersOpen = false
    this._deviationsOpen = true
    this.requestUpdate()
  }

  private _deviationGroups(
    isolated: string[],
    oob: string[],
    offline: string[],
    unavailable: string[],
    lowBattery: string[],
    divergence: Record<string, Record<string, unknown>>
  ): DeviationGroup[] {
    const divAttrs = Object.keys(divergence)
    const groups: DeviationGroup[] = []
    if (isolated.length) {
      groups.push({
        kind: 'isolation',
        icon: MDI_LOCK_OUTLINE,
        head: this.t('status.isolated', { count: isolated.length }),
        names: this._names(isolated),
      })
    }
    if (oob.length) {
      groups.push({
        kind: 'oob',
        icon: MDI_ALERT_OUTLINE,
        head: this.t('status.oob', { count: oob.length }),
        names: this._names(oob),
      })
    }
    // Devices before sensors: an unreachable member takes no commands and
    // drops out of the group's values.
    if (offline.length) {
      groups.push({
        kind: 'devices',
        icon: MDI_LAN_DISCONNECT,
        head: this.t(
          offline.length === 1 ? 'status.device_unavailable' : 'status.devices_unavailable',
          { count: offline.length }
        ),
        names: this._names(offline),
      })
    }
    if (unavailable.length) {
      groups.push({
        kind: 'sensors',
        icon: MDI_LAN_DISCONNECT,
        head: this.t(
          unavailable.length === 1
            ? 'status.sensor_unavailable'
            : 'status.sensors_unavailable',
          { count: unavailable.length }
        ),
        names: this._names(unavailable),
      })
    }
    if (lowBattery.length) {
      groups.push({
        kind: 'battery',
        icon: MDI_BATTERY_ALERT_VARIANT_OUTLINE,
        head: this.t('status.low_battery', { count: lowBattery.length }),
        names: this._names(lowBattery),
      })
    }
    if (divAttrs.length) {
      groups.push({
        kind: 'divergence',
        icon: MDI_CALL_SPLIT,
        head: this.t(
          divAttrs.length === 1 ? 'status.setting_divergent' : 'status.settings_divergent',
          { count: divAttrs.length }
        ),
        names: '',
        rows: divAttrs.map((a) => this._divergenceRow(a, divergence[a])),
      })
    }
    return groups
  }

  /**
   * Members grouped by the value they report, as the devices show it (offsets
   * not taken out). A member that misses the group target is marked by name —
   * per member, as the member list does: with member offsets one value can be
   * right for one device and wrong for another. Values nobody is marked for
   * come first, then the rest, each in member order.
   */
  private _divergenceRow(attr: string, members: Record<string, unknown>): DivergenceRow {
    const group = this.stateObj?.attributes
    const byText = new Map<string, DivergenceRow['values'][number]>()
    for (const [id, value] of Object.entries(members)) {
      const text = divergenceValue(this.hass, id, attr, value)
      const entry = byText.get(text) ?? { text, members: [] }
      entry.members.push({
        name: this._name(id),
        deviates: deviatesFromTarget(group, id, attr, value, this.hass?.states[id]?.attributes),
      })
      byText.set(text, entry)
    }
    const marked = (v: DivergenceRow['values'][number]) => v.members.some((m) => m.deviates)
    // Array.prototype.sort is stable: first-seen order within each half.
    const values = [...byText.values()].sort((a, b) => Number(marked(a)) - Number(marked(b)))
    return { label: this._divergenceLabel(attr), values }
  }

  private _renderDeviation(group: DeviationGroup) {
    return html`<div class="deviation ${group.kind}">
      <div class="dev-head">
        <svg viewBox="0 0 24 24"><path d=${group.icon} /></svg>
        <span>${group.head}</span>
      </div>
      ${group.rows
        ? group.rows.map(
            (row) => html`<div class="dev-row">
              <span class="dev-label">${row.label}</span>
              ${row.values.map(
                (v, i) => html`${i ? ' · ' : ''}<span class="dev-value"
                    >${v.text}:
                    ${v.members.map(
                      (m, j) =>
                        html`${j ? ', ' : ''}<span class=${m.deviates ? 'deviates' : ''}
                            >${m.name}</span
                          >`
                    )}</span
                  >`
              )}
            </div>`
          )
        : html`<div class="dev-names">${group.names}</div>`}
    </div>`
  }

  // Its label sums up what the popover holds, so the tooltip already answers
  // "what is wrong" without a click.
  private _renderDeviationsBadge(groups: DeviationGroup[]) {
    const summary = groups.map((g) => g.head).join(' · ')
    return html`<button
      class="dev-badge"
      title=${summary}
      aria-label=${summary}
      aria-expanded=${this._deviationsOpen}
      @click=${this._toggleDeviations}
    >
      <svg viewBox="0 0 24 24"><path d=${MDI_ALERT} /></svg>
    </button>`
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
      const started = reason.since ? Date.parse(reason.since) : NaN
      const elapsed = Number.isNaN(started)
        ? undefined
        : Math.floor((Date.now() - started) / 60000)
      items.push({
        kind: reason.source,
        icon: meta.icon,
        label: this.t(meta.labelKey),
        action:
          reason.source === 'switch'
            ? this.t(switchActionKey(attrs.main_switch_action))
            : undefined,
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
        label: this.t('boost.label'),
        detail: this._remaining(boost),
      })
    }
    const hold = remainingMinutes(attrs.schedule_hold_until)
    if (hold != null) {
      items.push({
        kind: 'hold',
        icon: MDI_TIMER_SAND,
        label: this.t('feature.hold'),
        detail: this._remaining(hold),
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
        device: this._sourceDevice(source),
      }
    }
    return undefined
  }

  /** A countdown's time left: "left" sets it apart from a blocker's "for". */
  private _remaining(minutes: number): string {
    return this.t('status.remaining', {
      duration: formatRemainingDuration(minutes, this.hass),
    })
  }

  /**
   * The member a sync or mirror took the target from. `last_entity` is the
   * group itself for its own changes, which names nothing worth showing.
   */
  private _sourceDevice(source: string): string | undefined {
    if (source !== 'sync_mode' && source !== 'adopt_only') return undefined
    const attrs = this.stateObj?.attributes ?? {}
    const entity = attrs.last_entity as string | undefined
    const members = (attrs.member_entities as string[] | undefined) ?? []
    return entity && members.includes(entity) ? this._name(entity) : undefined
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

  /**
   * The info line, read from the schedule entity of the shown layer: the
   * running slot with its end, or — none running — the next one with its
   * start. Home Assistant exposes one event at a time (the running one while
   * `on`, the next while `off`), so the line never shows both. Under a bypass
   * the main schedule's next event does not take effect, so it is not shown.
   */
  private _scheduleInfo(): { text: string; time?: string } | undefined {
    const attrs = this.stateObj?.attributes ?? {}
    const entityId = (
      attrs.active_schedule_layer === 'bypass'
        ? attrs.active_schedule_bypass_entity
        : attrs.active_schedule_entity
    ) as string | undefined
    const entity = entityId ? this.hass?.states[entityId] : undefined
    if (entity?.state !== 'on' && entity?.state !== 'off') return undefined
    const running = entity.state === 'on'
    const time = this._eventTime(entity, running)
    if (running) {
      // The backend's title, which also raises the schedule panel.
      const title = attrs.active_schedule_slot_title as string | undefined
      if (title) {
        return {
          text: this.t('status.slot', { title }),
          time: time && this.t('status.until', { time }),
        }
      }
      return { text: time ? this.t('status.active_until', { time }) : this.t('status.active') }
    }
    // A calendar names its next event; a schedule helper has no titles.
    const title = entity.attributes.message as string | undefined
    if (title) {
      return {
        text: this.t('status.next_slot', { title }),
        time: time && this.t('status.starts_at', { time }),
      }
    }
    return time ? { text: this.t('status.next_at', { time }) } : undefined
  }

  /** The running event's end, or the next event's start. */
  private _eventTime(entity: HassEntity, running: boolean): string | undefined {
    const attrs = entity.attributes
    if (entity.entity_id.startsWith('calendar.')) {
      // Local wall-clock time without an offset ("2026-11-17 18:30:00"); the
      // `T` makes it ISO, which every browser reads as local time.
      const raw = (running ? attrs.end_time : attrs.start_time) as string | undefined
      const date = raw ? new Date(raw.replace(' ', 'T')) : undefined
      if (!date || isNaN(date.getTime())) return undefined
      const allDay = attrs.all_day === true
      // An all-day event ends at the following midnight: its last day is the one before.
      if (allDay && running) date.setDate(date.getDate() - 1)
      return formatEventTime(date, this.hass, allDay)
    }
    const next = attrs.next_event as string | undefined
    const date = next ? new Date(next) : undefined
    if (!date || isNaN(date.getTime())) return undefined
    return formatEventTime(date, this.hass)
  }

  private _name(id: string): string {
    return (this.hass?.states[id]?.attributes.friendly_name as string) ?? id
  }

  private _batteryText(battery: HassEntity): string {
    return batteryText(battery, this.hass, this.t('member.low_battery'))
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

  /** A qualifier after the panel's label: its dot bound to the text by a no-break space. */
  private _aside(kind: string, text: string) {
    return html` <span class="aside ${kind}"
      >·&nbsp;<span class="text">${text}</span></span
    >`
  }

  protected render() {
    const attrs = this.stateObj?.attributes
    if (!attrs) return nothing

    const items = this._items()
    const panel = this._panel(items)
    const showPanel = this.sections.includes('panel')
    const showBadges = this.sections.includes('badges')
    // Icons only, each name in its tooltip, when the labels do not fit one line.
    const compact = this._badgeFit.fit.compact
    const showDeviations = this.sections.includes('deviations')
    const enabled = (attrs.enabled_features as string[]) ?? []
    const features = BADGE_FEATURES.filter((f) => enabled.includes(f))
    const isolated = (attrs.isolated_members as string[]) ?? []
    const oob = (attrs.oob_members as string[]) ?? []
    const unavailable = (attrs.unavailable_sensors as string[]) ?? []
    const quiet = this._quietRemaining() > 0
    const divergence = settledDivergence(attrs, quiet)
    const members = (attrs.member_entities as string[]) ?? []
    const lowBattery = this.battery ? lowBatteryMembers(members, this.hass) : {}
    const lowBatteryIds = Object.keys(lowBattery)
    const batteries = this.battery ? batteryByMember(members, this.hass) : {}
    const weakest = this.battery ? weakestBattery(members, this.hass) : undefined
    const offline = unavailableMembers(members, this.hass?.states ?? {})
    const groups = this._deviationGroups(
      isolated,
      oob,
      offline,
      unavailable,
      lowBatteryIds,
      divergence
    )
    const hasDeviations = groups.length > 0
    // The badge needs the panel; it shows only while there is something to open.
    const badge = showPanel && this.deviationsBadge && hasDeviations
    if (!badge) this._deviationsOpen = false

    const master = attrs.master_entity_id as string | undefined
    const dots = memberDots(
      members,
      this.hass?.states ?? {},
      isolated,
      oob,
      master,
      deviatingMembers(attrs, this.hass?.states, quiet)
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

    const scheduleInfo = this._scheduleInfo()
    const offset = this._offset()

    return html`
      <div class="status">
        ${
          showPanel
            ? html`<div class="panel ${panel?.kind ?? ''}">
                ${
                  offset || totalCount || badge
                    ? html`<div class="panel-top">
                <div class="panel-left">
                ${weakest
                  ? html`<button
                      class="battery-toggle"
                      aria-expanded=${this._membersOpen}
                      @click=${this._toggleMembers}
                    >
                      <svg
                        class="battery ${batteryLevelClass(weakest.level)}"
                        viewBox="0 0 24 24"
                      >
                        <title
                          >${this._name(weakest.member)}: ${this._batteryText(
                            weakest.state
                          )}</title
                        >
                        <path d=${batteryLevelIcon(weakest.level)} />
                      </svg>
                    </button>`
                  : nothing}
                ${offset ? html`<span class="offset">${offset}</span>` : nothing}
                </div>
                ${badge ? this._renderDeviationsBadge(groups) : nothing}
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
                                  .batteries=${batteries}
                                  .master=${master}
                                  .group=${attrs}
                                  .divergenceSince=${this._divergence?.since}
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
                            ? html` <span class="pill"
                                  >${panel.pill}</span
                                >`
                            : nothing}${panel.scheduleName
                            ? this._aside('schedule-name', panel.scheduleName)
                            : nothing}${panel.device
                            ? this._aside('device', panel.device)
                            : nothing}${panel.action
                            ? this._aside('action', panel.action)
                            : nothing}${panel.detail
                            ? this._aside('detail', panel.detail)
                            : nothing}</span
                        >
                      </div>`
                    : nothing
                }
                ${
                  scheduleInfo
                    ? html`<div class="panel-info">
                        <span class="slot">${scheduleInfo.text}</span>
                        ${scheduleInfo.time
                          ? html`<span class="time">·&nbsp;${scheduleInfo.time}</span>`
                          : nothing}
                      </div>`
                    : nothing
                }
                ${
                  badge && this._deviationsOpen
                    ? html`<div class="deviations-menu ${this._deviationsUp ? 'up' : ''}">
                        ${groups.map((g) => this._renderDeviation(g))}
                      </div>`
                    : nothing
                }
              </div>`
            : nothing
        }
        ${
          showBadges && (features.length || items.some((i) => i.kind === 'boost'))
            ? html`<div
                class="badges ${compact ? 'compact' : ''}"
                style="column-gap: ${this._badgeFit.fit.gap}px"
              >
                ${features.map(
                  (f) => {
                    const state = this._featureActive(f)
                      ? 'on'
                      : this._featurePaused(f)
                        ? 'paused'
                        : ''
                    const label = this.t(FEATURE_META[f].labelKey)
                    return html`<div
                      class="badge feature ${f} ${state}"
                      title=${compact ? label : nothing}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d=${FEATURE_META[f].icon} />
                      </svg>
                      ${state === 'paused'
                        ? html`<svg class="pause-mark" viewBox="0 0 24 24">
                            <title>${this.t('status.paused')}</title>
                            <path d=${MDI_PAUSE} />
                          </svg>`
                        : nothing}
                      <span>${label}</span>
                    </div>`
                  }
                )}
                ${items
                  .filter((i) => i.kind === 'boost' || i.kind === 'hold')
                  .map((i) => {
                    // The name only, like the feature badges: the time
                    // left is the panel's.
                    const label = this.t(i.kind === 'boost' ? 'boost.label' : 'feature.hold')
                    return html`<div
                      class="badge ${i.kind} on"
                      title=${compact ? label : nothing}
                    >
                      <svg viewBox="0 0 24 24"><path d=${i.icon} /></svg>
                      <span>${label}</span>
                    </div>`
                  })}
              </div>`
            : nothing
        }
        ${
          showDeviations
            ? html`<div class="deviations ${hasDeviations ? '' : 'empty'}">
                ${groups.map((g) => this._renderDeviation(g))}
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
      /* Follows a rounder card like the tiles (--cgh-surface-radius), but
         only so far: a box this tall turns into a lozenge where a tile turns
         into a pill. */
      border-radius: min(var(--cgh-surface-radius, var(--ha-border-radius-md, 12px)), 12px);
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
    /* Battery and offset on the left, the deviations badge in the middle,
       the member strip on the right; any may be absent. Two equal side
       columns keep the badge centred in the panel, whatever stands beside
       it. The battery's height as a floor: the row keeps it when the battery
       is hidden or unknown, so the panel does not change height with it. */
    .panel-top {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
      min-width: 0;
      min-height: 16px;
    }
    .panel-left {
      grid-column: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    /* Opens the member list, where each member's battery is shown. */
    .battery-toggle {
      display: flex;
      flex: none;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
    }
    .battery-toggle:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 2px;
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
      /* Like every secondary text in the panel: the size of the asides. */
      font-size: calc(var(--ha-font-size-l, 1.05rem) * 0.95 * 0.75);
      color: var(--secondary-text-color);
    }
    .members {
      grid-column: 3;
      justify-self: end;
      position: relative;
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
      font-size: calc(var(--ha-font-size-l, 1.05rem) * 0.95 * 0.75);
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
    }
    /* Both menus float over the card in exactly its colour, lifted by their
       edge and depth: a clear edge with a brighter rim at the top, a wide soft
       shadow plus a close dense one. A surface of their own read as part of
       the panel (darker) or washed out (lighter), and so did a sheen, which
       lightens the whole surface. Opaque on purpose: the panel's
       backdrop-filter would keep a glass menu from blurring what lies behind
       it. */
    .members-menu,
    .deviations-menu {
      border: 1px solid color-mix(in srgb, var(--primary-text-color) 20%, transparent);
      border-radius: var(--ha-border-radius-md, 12px);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow:
        0 16px 40px rgb(0 0 0 / 0.55),
        0 4px 12px rgb(0 0 0 / 0.4),
        inset 0 1px 0 color-mix(in srgb, var(--primary-text-color) 14%, transparent);
    }
    .members-menu.up {
      top: auto;
      bottom: calc(100% + 6px);
    }
    /* No taller than the battery, so the row keeps its height when it comes
       and goes. A wider invisible ring makes it easy to tap. */
    .dev-badge {
      grid-column: 2;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--warning-color, #ff9800);
      cursor: pointer;
    }
    .dev-badge::before {
      content: '';
      position: absolute;
      inset: -8px;
    }
    /* A ring for the keyboard only, round like the icon — not the browser's
       square one after every tap. */
    .dev-badge:focus {
      outline: none;
    }
    .dev-badge:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 50%;
    }
    .dev-badge svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      filter: drop-shadow(0 0 3px color-mix(in srgb, currentColor 50%, transparent));
    }
    /* The deviations as a menu over the card, anchored to the whole panel:
       the card keeps its height. Taller than the member menu — a long
       divergence list is the usual content. */
    .deviations-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: min(480px, 70vh);
      overflow-y: auto;
      padding: 8px 10px;
      font-size: var(--ha-font-size-s, 0.75rem);
      font-weight: var(--ha-font-weight-normal, 400);
      color: var(--secondary-text-color);
    }
    .deviations-menu.up {
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
    /* Qualifiers of the label — the schedule's name, the switch's action, the
       duration — not a second headline: the label alone stays large, so a
       blocker fits one line. Only the text is set small; the dot keeps
       nearly the label's size and stays bound to the text by a no-break
       space. A duration never splits between number and unit; a name wraps. */
    .panel-main .aside {
      color: var(--secondary-text-color);
      font-size: 0.95em;
      font-weight: var(--ha-font-weight-normal, 400);
    }
    .panel-main .detail,
    .panel-main .action {
      white-space: nowrap;
    }
    /* Pill, dot and text are centred on the middle of the label's capitals.
       The dot sits there by itself; the smaller text is raised by half the
       difference of the cap heights (the label is 1 / 0.95 / 0.75 times its
       size), so the two cap middles meet. */
    .panel-main .aside .text {
      font-size: 0.75em;
      vertical-align: calc(1cap * (1 / 0.95 / 0.75 - 1) / 2);
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
      /* Centred on the label's capitals: middle puts it on half the x-height,
         the shift lifts it by half the gap to the cap height (Roboto: cap
         height 0.711em, x-height 0.528em of the label). */
      vertical-align: middle;
      position: relative;
      top: calc(var(--ha-font-size-l, 1.05rem) * -0.0915);
    }
    .panel-main svg {
      flex: none;
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    /* The size of the label's asides (0.95 × 0.75 of the label): secondary
       information in the same grey, one level, not a third size. */
    .panel-info {
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
      font-size: calc(var(--ha-font-size-l, 1.05rem) * 0.95 * 0.75);
      color: var(--secondary-text-color);
    }
    /* A long title gives way; the time beside it stays whole. */
    .panel-info .slot {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .panel-info .time {
      flex: none;
      white-space: nowrap;
    }
    .panel.source .panel-main {
      font-weight: var(--ha-font-weight-normal, 400);
    }
    /* The column gap comes from the fit measurement; wrapping is only the
       last resort for a row that does not fit even as icons. Stretched, not
       centred like its siblings: the measurement reads the room from the
       row's own width, which would otherwise shrink to its icons. */
    .badges {
      align-self: stretch;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 16px;
    }
    .badge {
      position: relative;
      flex: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-xs, 0.7rem);
    }
    .badge > span {
      white-space: nowrap;
    }
    /* Icons only: the label keeps its line, so the row keeps its height and
       the icons do not move, but takes no width. Clipped, not hidden: a
       screen reader still reads the name. */
    .badges.compact .badge > span {
      width: 0;
      overflow: hidden;
    }
    /* 22px: the fit measurement counts a badge at least this wide
       (BADGE_ICON). */
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
    /* Active badges glow in their own colour (icon via drop-shadow), at half
       strength: a full-colour halo turns neon in bright theme colours. */
    .badge.on svg {
      filter: drop-shadow(0 0 3px color-mix(in srgb, currentColor 50%, transparent));
    }
    /* Paused by a slot or preset: the plain badge's colour, only quieter —
       --disabled-color is a dark grey in HA's dark mode and vanished. The
       dimming alone was too subtle, so a pause mark carries the state. */
    .badge.paused {
      opacity: 0.45;
    }
    /* Two bars in the badge's own grey on the icon's upper right, out of the
       column so the badge keeps its size. */
    .badge svg.pause-mark {
      position: absolute;
      top: -3px;
      left: calc(50% + 6px);
      width: 12px;
      height: 12px;
    }
    /* A transparent ring around the mark: the icon is cut away under it, so
       the bars never touch the icon whatever lies behind the card. The
       centre is the mark's, in the 22px icon's own coordinates (icon left at
       50% - 11px, mark centre at 50% + 12px and 3px down). */
    .badge.paused > svg:not(.pause-mark) {
      -webkit-mask-image: radial-gradient(circle at 23px 3px, transparent 5.5px, #000 6.5px);
      mask-image: radial-gradient(circle at 23px 3px, transparent 5.5px, #000 6.5px);
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
      /* Capped like the panel. */
      border-radius: min(var(--cgh-surface-radius, var(--ha-border-radius-md, 12px)), 12px);
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
    /* Flat like every icon in this box; the glow is the OOB dot's. */
    .deviation.oob,
    .deviation.devices,
    .deviation.sensors {
      color: var(--warning-color, #ff9800);
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
    /* One disputed setting per row; a wrapped line hangs under the values, so
       the label stays the row's left edge. */
    .dev-row {
      padding-left: 1em;
      text-indent: -1em;
      overflow-wrap: anywhere;
    }
    .dev-label {
      color: var(--primary-text-color);
      font-weight: var(--ha-font-weight-medium, 500);
      margin-right: 4px;
    }
    .dev-row .deviates {
      color: var(--warning-color, #ff9800);
    }
    `,
  ]
}
