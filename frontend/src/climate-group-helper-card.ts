import { LitElement, css, html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement, registerCustomCard } from './lib/define'
import {
  boostParams,
  controls,
  dialViews,
  featureTiles,
  isAdvancedGroup,
  isGroupEntity,
  resetFields,
  showBattery,
  showDeviationsBadge,
  showHistory,
  showMainSwitch,
  showMoreInfo,
  showSettings,
  showTitle,
  statusSections,
} from './lib/config'
import { CONFIG_VERSION, migrateConfig } from './lib/config-migrations'
import { DEMO_ENTITIES, DEMO_ENTITY, DEMO_TICK_MS, demoStates } from './lib/demo'
import { LocalizeMixin } from './lib/i18n'
import { MDI_CHART_BOX_OUTLINE, MDI_COG_OUTLINE, MDI_DOTS_VERTICAL } from './lib/icons'
import './components/cgh-card-editor'
import './components/cgh-climate-control'
import './components/cgh-feature-tiles'
import './components/cgh-status'
import './components/cgh-toggle'
import type { HassEntity, HomeAssistant, LovelaceCardConfig } from './types'

const KNOWN_CONFIG_KEYS = new Set([
  'type',
  'config_version',
  'entity',
  'name',
  'title',
  'more_info',
  'history',
  'settings',
  'status',
  'features',
  'controls',
  'views',
  'battery',
  'deviations_badge',
  'main_switch',
  'boost',
  'reset',
  'demo',
  // Home Assistant's own keys on every card; it passes them to setConfig() too.
  'grid_options',
  'layout_options',
  'visibility',
  'view_layout',
])

/**
 * Lovelace wrapper for the Climate Group Helper card.
 *
 * Thin on purpose: configuration/registration live here, the actual UI is
 * composed from the `cgh-*` components.
 */
@customElement('climate-group-helper-card')
export class ClimateGroupHelperCard extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant

  @state() private _config?: LovelaceCardConfig

  private _demoTimer?: number

  public setConfig(raw: LovelaceCardConfig): void {
    if (!raw.entity && !raw.demo) {
      throw new Error('climate-group-helper-card: "entity" is required')
    }
    // Before the key check: an older config's retired keys are no mistake.
    const config = migrateConfig(raw)
    for (const key of Object.keys(config)) {
      if (!KNOWN_CONFIG_KEYS.has(key)) {
        console.warn(
          `[climate-group-helper-card] ignoring unknown config key: ${key}`
        )
      }
    }
    this._config = config
    this._syncDemoTimer()
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._syncDemoTimer()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this._demoTimer !== undefined) {
      window.clearInterval(this._demoTimer)
      this._demoTimer = undefined
    }
  }

  /** Run/stop the demo re-render ticker (`DEMO_TICK_MS`) to match the current config. */
  private _syncDemoTimer(): void {
    const want = !!this._config?.demo
    if (want && this._demoTimer === undefined) {
      this._demoTimer = window.setInterval(
        () => this.requestUpdate(),
        DEMO_TICK_MS
      )
      this.requestUpdate()
    } else if (!want && this._demoTimer !== undefined) {
      window.clearInterval(this._demoTimer)
      this._demoTimer = undefined
    }
  }

  private _entityId(): string | undefined {
    if (this._config?.demo) return DEMO_ENTITY
    return this._config?.entity
  }

  /**
   * The `hass` the children render against. In demo mode the synthetic states
   * are merged over the real ones and `callService` becomes a no-op, so every
   * child works unchanged.
   */
  private _effectiveHass(): HomeAssistant | undefined {
    if (!this.hass) return undefined
    if (!this._config?.demo) return this.hass
    return {
      ...this.hass,
      states: {
        ...this.hass.states,
        ...demoStates(Date.now(), this.hass.locale?.language ?? this.hass.language),
      },
      // The constant itself, not merged into the real registry: a fresh object
      // per render would defeat the battery lookup's per-registry cache.
      entities: DEMO_ENTITIES,
      callService: async () => undefined,
    }
  }

  public getCardSize(): number {
    return 6
  }

  public static getStubConfig(
    hass?: HomeAssistant,
    entities: string[] = [],
    entitiesFallback: string[] = []
  ): LovelaceCardConfig {
    const type = 'custom:climate-group-helper-card'
    const config_version = CONFIG_VERSION
    const all = [...entities, ...entitiesFallback]
    // Prefer an actual group, then any climate entity; fall back to the demo
    // so the picker preview always works. Every option is on by default; what
    // needs Advanced Mode shows only there.
    const group = all.find((id) => isGroupEntity(hass, id))
    const entity = group ?? all.find((id) => id.startsWith('climate.'))
    if (entity) return { type, config_version, entity }
    return { type, config_version, demo: true }
  }

  /**
   * The main switch's own state, when the card should show it: configured,
   * reported by the group (Advanced Mode) and present in `hass`.
   */
  private _mainSwitch(hass: HomeAssistant, stateObj: HassEntity): HassEntity | undefined {
    if (!showMainSwitch(this._config)) return undefined
    const switchId = stateObj.attributes.main_switch_entity_id as string | undefined
    return switchId ? hass.states[switchId] : undefined
  }

  /**
   * The group offset entity's state, when the group reports one (Advanced
   * Mode) and it is present in `hass`. Whether its view shows is the dial's
   * call, from `views`.
   */
  private _offsetEntity(hass: HomeAssistant, stateObj: HassEntity): HassEntity | undefined {
    const offsetId = stateObj.attributes.offset_entity_id as string | undefined
    return offsetId ? hass.states[offsetId] : undefined
  }

  // Sends what the user sees: off when it shows on, otherwise on — never a
  // blind `toggle` against a state the card may not have caught up with.
  private _handleMainSwitch(mainSwitch: HassEntity): void {
    const hass = this._effectiveHass()
    if (!hass) return
    hass.callService('switch', mainSwitch.state === 'on' ? 'turn_off' : 'turn_on', {
      entity_id: mainSwitch.entity_id,
    })
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('climate-group-helper-card-editor')
  }

  private _renderStatus(
    hass: HomeAssistant,
    stateObj: HassEntity
  ): unknown {
    const sections = statusSections(this._config)
    if (!sections || !sections.length) return nothing
    return html`
      <div class="status">
        <cgh-status
          .hass=${hass}
          .stateObj=${stateObj}
          .sections=${sections}
          .battery=${showBattery(this._config)}
          .deviationsBadge=${showDeviationsBadge(this._config)}
          .navigable=${!this._config?.demo}
          .quietWindow=${!this._config?.demo}
        ></cgh-status>
      </div>
    `
  }

  /**
   * The entity's more-info dialog, on its info view (⋮) or straight on its
   * history or settings view — the dialog's own header buttons. HA's back
   * arrow from a view leads to the info view. `tab` is the older name of
   * `view`, still read.
   */
  private _openMoreInfo(view?: 'history' | 'settings'): void {
    const entityId = this._entityId()
    // The demo entity does not exist in HA: the dialog would find nothing.
    if (!entityId || this._config?.demo) return
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: view ? { entityId, view, tab: view } : { entityId },
        bubbles: true,
        composed: true,
      })
    )
  }

  /** The buttons of the top right corner, in the more-info dialog's order. */
  // Shown in the demo too, for its look; there `_openMoreInfo()` opens nothing.
  private _cornerButtons(): { cls: string; icon: string; label: string; view?: 'history' | 'settings' }[] {
    return [
      ...(showHistory(this._config)
        ? [{ cls: 'history', icon: MDI_CHART_BOX_OUTLINE, label: this.t('card.history'), view: 'history' as const }]
        : []),
      // HA offers the settings view to admins only: others lack registry
      // access and would land on a misleading warning.
      ...(showSettings(this._config) && this.hass?.user?.is_admin !== false
        ? [{ cls: 'settings', icon: MDI_COG_OUTLINE, label: this.t('card.settings'), view: 'settings' as const }]
        : []),
      ...(showMoreInfo(this._config)
        ? [{ cls: 'more-info', icon: MDI_DOTS_VERTICAL, label: this.t('card.more_info') }]
        : []),
    ]
  }

  protected render() {
    const hass = this._effectiveHass()
    const entityId = this._entityId()
    if (!this._config || !hass || !entityId) {
      return nothing
    }
    const stateObj = hass.states[entityId]
    const shownControls = controls(this._config)
    if (!stateObj) {
      return html`<ha-card class="warning"
        >${this.t('card.entity_not_found', { entity: entityId })}</ha-card
      >`
    }
    const mainSwitch = this._mainSwitch(hass, stateObj)
    // The boost and reset services exist in Advanced Mode only: elsewhere
    // their tiles would do nothing, whatever the config says.
    const advanced = isAdvancedGroup(stateObj)
    const title = this._config.name ?? stateObj.attributes.friendly_name ?? entityId
    // The header row is the name's: switch and buttons join it while it shows.
    // Without it, more than one button on the right would reach into the
    // ring: then both corners take the row above the dial.
    const headerShown = showTitle(this._config)
    const buttons = this._cornerButtons()
    const corner = headerShown ? 'in-header' : buttons.length > 1 ? 'in-row' : ''
    // The title stays centred: as far in on both sides as the wider corner
    // reaches (switch: 16px edge + 40px + 8px air; buttons: 8px edge + 40px
    // each + 8px air), at least 48px.
    const inset = Math.max(48, mainSwitch ? 64 : 0, buttons.length ? buttons.length * 40 + 16 : 0)

    return html`
      <ha-card>
        <div class="grid ${headerShown ? '' : 'no-header'}">
          ${
            headerShown
              ? html`<div class="title" style="--cgh-title-inset: ${inset}px" title=${title}>
                  ${title}
                </div>`
              : html`<span class="sr-only">${title}</span>`
          }
          ${
            mainSwitch
              ? html`<cgh-toggle
                  class="main-switch ${corner}"
                  .checked=${mainSwitch.state === 'on'}
                  .disabled=${mainSwitch.state === 'unavailable' ||
                  mainSwitch.state === 'unknown'}
                  .label=${this.t('main_switch.label')}
                  @cgh-toggle=${() => this._handleMainSwitch(mainSwitch)}
                ></cgh-toggle>`
              : nothing
          }
          ${
            buttons.length
              ? html`<div class="corner-end ${corner}">
                  ${buttons.map(
                    (b) => html`<button
                      class="corner-button ${b.cls}"
                      aria-label=${b.label}
                      title=${b.label}
                      @click=${() => this._openMoreInfo(b.view)}
                    >
                      <svg viewBox="0 0 24 24"><path d=${b.icon} /></svg>
                    </button>`
                  )}
                </div>`
              : nothing
          }
          ${
            // Like the status cell: without the dial the whole cell goes.
            shownControls.includes('slider')
              ? html`<div class="center">
                  <cgh-climate-control
                    .hass=${hass}
                    .stateObj=${stateObj}
                    .controls=${shownControls}
                    .offsetObj=${this._offsetEntity(hass, stateObj)}
                    .views=${dialViews(this._config)}
                  ></cgh-climate-control>
                </div>`
              : nothing
          }
          <div class="features">
            <cgh-feature-tiles
              .hass=${hass}
              .stateObj=${stateObj}
              .tiles=${featureTiles(this._config)}
              .boost=${advanced
                ? boostParams(
                    this._config,
                    hass.config?.unit_system?.temperature as string | undefined
                  )
                : null}
              .reset=${advanced ? resetFields(this._config) : []}
            ></cgh-feature-tiles>
          </div>
          ${this._renderStatus(hass, stateObj)}
        </div>
      </ha-card>
    `
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      /* Shared content column: the dial and everything below it stay within
         this width, centred — nothing is drawn past the slider's edges. */
      --cgh-content-width: 320px;
      /* The corner a theme gives its card, for the card's own surfaces (the
         tiles, the status panel, the deviations box — the two boxes capped):
         its controls radius as HA's tile features take it, else the card's
         own. Left without a value when the theme sets neither — each surface
         then keeps its own default, so the standard theme looks as before. */
      --cgh-surface-radius: var(
        --ha-card-features-border-radius,
        var(--ha-card-border-radius)
      );
    }
    /* HA's own ha-card is a block already; outside HA (the dev demo) it is an
       unknown inline element, on which the height would not apply. */
    ha-card {
      display: block;
      padding: 0;
      height: 100%;
    }
    /* Blocks carry 8px padding each, so 16px between them; the grid's 8px
       give the last block, whichever it is, the same 16px to the edge — and
       the first one at the top unless the header leads (its padding and the
       title's line height make that space already). */
    .grid {
      box-sizing: border-box;
      padding-bottom: 8px;
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto auto 1fr auto auto;
      grid-template-areas:
        "header"
        "switch"
        "center"
        "features"
        "status";
      height: 100%;
    }
    .grid.no-header {
      padding-top: 8px;
    }
    /* The right corner: history, settings, ⋮ — 40px each, so three leave
       the name room. */
    .corner-end {
      display: flex;
    }
    .corner-button {
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .corner-button:hover,
    .corner-button:focus-visible {
      /* Light, theme-adaptive fill (like HA's own header buttons) — not the
         dark secondary surface, which read as a black circle. */
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      color: var(--primary-text-color);
      outline: none;
    }
    .corner-button svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    /* The title alone sets the header row's height, at least 48px — also for
       a blank name. Its line sits 4px low (12px above, 4px below), on the
       middle of the corners, which stand 8px from the top like they do
       without a header. Symmetrical side padding, as wide as the wider
       corner (set by the card), keeps it centred and clear of both. */
    .title {
      grid-area: header;
      box-sizing: border-box;
      min-height: 48px;
      padding: 12px var(--cgh-title-inset, 48px) 4px;
      /* One line, cut with an ellipsis: with three buttons a wrapped name
         would stack up and stretch the row. The full name is its tooltip. */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ha-font-size-l, 1.1rem);
      font-weight: 400;
      line-height: var(--ha-line-height-expanded, 2);
      text-align: center;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
    .center,
    .features,
    .status {
      justify-self: center;
      width: 100%;
      max-width: calc(var(--cgh-content-width) + 16px);
      box-sizing: border-box;
    }
    .center {
      grid-area: center;
      align-self: center;
      min-width: 0;
      padding: 8px;
    }
    /* The switch top left, 16px from the card edge, the buttons top right,
       all centred on the same line. Without the name they go to the corners
       of the dial's area, clear of the ring from 320px card width on; without
       the dial they stand above the feature tiles. */
    .main-switch,
    .corner-end {
      grid-area: center;
      align-self: start;
      z-index: 1;
    }
    /* No top margin: both corners are 40px boxes on one line, and the row
       keeps the header's height whether the switch is there or not. */
    .main-switch {
      justify-self: start;
      margin-left: 16px;
    }
    /* 8px edge: with the icon's own 9px inside its 40px box, it stands about
       as far from the edge as the switch. */
    .corner-end {
      justify-self: end;
      margin-right: 8px;
    }
    /* Narrower, the ring reaches the corners: they take a row of their own. */
    @container (max-width: 319px) {
      .main-switch,
      .corner-end {
        grid-area: switch;
      }
    }
    /* More than one button on the right reaches into the ring at any width.
       The grid's 8px and the 40px boxes make the header's 48px, so the dial
       starts at the same height either way. */
    .main-switch.in-row,
    .corner-end.in-row {
      grid-area: switch;
    }
    /* After the container query: the header row wins at every width. The
       corners stand 8px from the top here too, as everywhere else, on the
       same line as the name (see .title). */
    .main-switch.in-header,
    .corner-end.in-header {
      grid-area: header;
      margin-top: 8px;
    }
    /* No padding here: the tiles' row carries it, so a card whose tiles all
       drop out leaves no gap. */
    .features {
      grid-area: features;
    }
    .status {
      grid-area: status;
    }
    .warning {
      color: var(--error-color, #db4437);
    }
  `
}

registerCustomCard({
  type: 'climate-group-helper-card',
  name: 'Climate Group Helper Card',
  description: 'Dial, status and controls for a Climate Group Helper group.',
  preview: true,
  // The picker's "By entity" tab: offered for the integration's groups only.
  getEntitySuggestion: (hass, entityId) =>
    isGroupEntity(hass, entityId)
      ? {
          label: 'Climate Group Helper',
          config: {
            type: 'custom:climate-group-helper-card',
            config_version: CONFIG_VERSION,
            entity: entityId,
          },
        }
      : null,
})
