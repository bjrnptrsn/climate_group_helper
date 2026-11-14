import { LitElement, css, html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement, registerCustomCard } from './lib/define'
import {
  DEFAULT_RESET_FIELDS,
  boostParams,
  controls,
  defaultBoost,
  featureTiles,
  isAdvancedGroup,
  resetFields,
  showBattery,
  showHumidityView,
  showMainSwitch,
  showMoreInfo,
  showOffset,
  showTemperatureView,
  showTitle,
  statusSections,
} from './lib/config'
import { DEMO_ENTITIES, DEMO_ENTITY, DEMO_TICK_MS, demoStates } from './lib/demo'
import { LocalizeMixin } from './lib/i18n'
import { MDI_DOTS_VERTICAL } from './lib/icons'
import './components/cgh-card-editor'
import './components/cgh-climate-control'
import './components/cgh-feature-tiles'
import './components/cgh-status'
import './components/cgh-toggle'
import type { HassEntity, HomeAssistant, LovelaceCardConfig } from './types'

const KNOWN_CONFIG_KEYS = new Set([
  'type',
  'entity',
  'name',
  'title',
  'more_info',
  'status',
  'features',
  'controls',
  'battery',
  'main_switch',
  'offset',
  'temperature',
  'humidity',
  'boost',
  'reset',
  'demo',
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

  public setConfig(config: LovelaceCardConfig): void {
    if (!config.entity && !config.demo) {
      throw new Error('climate-group-helper-card: "entity" is required')
    }
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
    const all = [...entities, ...entitiesFallback]
    // Prefer an actual group (`enabled_features` is CGH-specific), then any
    // climate entity; fall back to the demo so the picker preview always works.
    // A new card starts with the main switch, the offset segment and the boost
    // and reset tiles on, like every other option; a card without the keys (an
    // existing one) shows none of them. Only for a group in Advanced Mode: the
    // main switch, the offset entity and the boost and reset services exist
    // only there (`effective_sync_mode` is its marker attribute).
    const boost = defaultBoost(hass?.config?.unit_system?.temperature as string | undefined)
    const group = all.find(
      (id) => hass?.states?.[id]?.attributes?.enabled_features !== undefined
    )
    if (group) {
      return isAdvancedGroup(hass?.states?.[group])
        ? {
            type,
            entity: group,
            main_switch: true,
            offset: true,
            boost,
            reset: [...DEFAULT_RESET_FIELDS],
          }
        : { type, entity: group }
    }
    const climate = all.find((id) => id.startsWith('climate.'))
    if (climate) return { type, entity: climate }
    return {
      type,
      demo: true,
      main_switch: true,
      offset: true,
      boost,
      reset: [...DEFAULT_RESET_FIELDS],
    }
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
   * The group offset entity's state, when the dial's view switch should offer
   * it: configured, reported by the group (Advanced Mode) and present in `hass`.
   */
  private _offsetEntity(hass: HomeAssistant, stateObj: HassEntity): HassEntity | undefined {
    if (!showOffset(this._config)) return undefined
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
          .navigable=${!this._config?.demo}
        ></cgh-status>
      </div>
    `
  }

  private _handleMoreInfo(): void {
    const entityId = this._entityId()
    if (!entityId || this._config?.demo) return
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    )
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
    const title = this._config.name ?? stateObj.attributes.friendly_name ?? entityId
    // The header row is the name's: switch and ⋮ join it while it shows.
    const headerShown = showTitle(this._config)
    const corner = headerShown ? 'in-header' : ''

    return html`
      <ha-card>
        <div class="grid ${headerShown ? '' : 'no-header'}">
          ${
            headerShown
              ? html`<div class="title ${mainSwitch ? 'with-switch' : ''}">${title}</div>`
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
            // The demo has no entity to open.
            showMoreInfo(this._config) && !this._config.demo
              ? html`<button
                  class="more-info ${corner}"
                  aria-label=${this.t('card.more_info')}
                  @click=${this._handleMoreInfo}
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${MDI_DOTS_VERTICAL} />
                  </svg>
                </button>`
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
                    .showTemperature=${showTemperatureView(this._config)}
                    .showHumidity=${showHumidityView(this._config)}
                  ></cgh-climate-control>
                </div>`
              : nothing
          }
          <div class="features">
            <cgh-feature-tiles
              .hass=${hass}
              .stateObj=${stateObj}
              .tiles=${featureTiles(this._config)}
              .boost=${boostParams(
                this._config,
                hass.config?.unit_system?.temperature as string | undefined
              )}
              .reset=${resetFields(this._config)}
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
    .more-info {
      width: 48px;
      height: 48px;
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
    .more-info:hover,
    .more-info:focus-visible {
      /* Light, theme-adaptive fill (like HA's own header buttons) — not the
         dark secondary surface, which read as a black circle. */
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      color: var(--primary-text-color);
      outline: none;
    }
    .more-info svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    /* The title alone sets the header row's height, at least the 48px of the
       ⋮ — also for a blank name — and the corners centre in it. Symmetrical
       48px padding keeps it centred and clear of the ⋮. */
    .title {
      grid-area: header;
      box-sizing: border-box;
      min-height: 48px;
      padding: 8px 48px;
      font-size: var(--ha-font-size-l, 1.1rem);
      font-weight: 400;
      line-height: var(--ha-line-height-expanded, 2);
      text-align: center;
    }
    /* 12px edge + 40px switch + 8px air, mirrored to keep the title centred. */
    .title.with-switch {
      padding-left: 60px;
      padding-right: 60px;
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
    /* The switch top left, 12px from the card edge, the ⋮ top right, both
       centred on the same line. Without the name they go to the corners of
       the dial's area, clear of the ring from 320px card width on; without
       the dial they stand above the feature tiles. */
    .main-switch,
    .more-info {
      grid-area: center;
      align-self: start;
      z-index: 1;
    }
    .main-switch {
      justify-self: start;
      margin: 4px 0 0 12px;
    }
    .more-info {
      justify-self: end;
    }
    /* Narrower, the ring reaches the corners: they take a row of their own. */
    @container (max-width: 319px) {
      .main-switch,
      .more-info {
        grid-area: switch;
      }
    }
    /* After the container query: the header row wins at every width. */
    .main-switch.in-header,
    .more-info.in-header {
      grid-area: header;
      align-self: center;
      margin-top: 0;
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
})
