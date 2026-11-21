import { LitElement, css, html, nothing } from 'lit'
import { live } from 'lit/directives/live.js'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import {
  CONTROLS,
  DEFAULT_BOOST_DURATION,
  DEFAULT_RESET_FIELDS,
  FEATURE_TILES,
  MAX_BOOST_DURATION,
  VIEWS,
  boostEnabled,
  boostLimits,
  boostParams,
  boostValues,
  defaultBoost,
  defaultBoostTemperature,
  dialViews,
  RESET_FIELDS,
  RESET_LABEL_KEYS,
  STATUS_SECTIONS,
  controls,
  featureTiles,
  resetEnabled,
  resetFields,
  showBattery,
  showDeviationsBadge,
  showHistory,
  showMainSwitch,
  showMoreInfo,
  showSettings,
  showTitle,
  statusSections,
} from '../lib/config'
import { migrateConfig } from '../lib/config-migrations'
import { preloadHaComponents } from '../lib/ha-helpers'
import { MDI_CHEVRON_RIGHT, MDI_INFORMATION_OUTLINE } from '../lib/icons'
import { LocalizeMixin, type TranslationKey } from '../lib/i18n'
import type {
  BoostConfig,
  Control,
  FeatureTile,
  HomeAssistant,
  LovelaceCardConfig,
  ResetField,
  StatusSection,
  View,
} from '../types'

const SECTION_LABEL_KEYS: Record<StatusSection, TranslationKey> = {
  panel: 'editor.section.panel',
  badges: 'editor.section.badges',
  deviations: 'editor.section.deviations',
}

const CONTROL_LABEL_KEYS: Record<Control, TranslationKey> = {
  slider: 'editor.control.slider',
  buttons: 'editor.control.buttons',
}

/** Rows that expand to their options. */
type Branch = 'title' | 'slider' | 'views' | 'features' | 'boost' | 'reset' | 'panel'

const BRANCH_LABEL_KEYS: Record<Branch, TranslationKey> = {
  title: 'editor.name',
  slider: 'editor.control.slider',
  views: 'editor.control.toggle',
  features: 'editor.features',
  boost: 'editor.boost',
  reset: 'editor.reset',
  panel: 'editor.section.panel',
}

/** The dial's own options besides the view switch, shown under "Slider". */
const DIAL_OPTIONS: Control[] = CONTROLS.filter((control) => control !== 'slider')

const VIEW_LABEL_KEYS: Record<View, TranslationKey> = {
  offset: 'editor.offset',
  temperature: 'common.temperature',
  humidity: 'common.humidity',
}

/** Boolean options: on is the default, so only `false` is ever written. */
const OPT_OUT_KEYS = [
  'title',
  'more_info',
  'history',
  'settings',
  'battery',
  'deviations_badge',
  'main_switch',
] as const

/** List options, each with the selection that absence stands for. */
const LIST_DEFAULTS = {
  status: STATUS_SECTIONS,
  features: FEATURE_TILES,
  views: VIEWS,
  reset: DEFAULT_RESET_FIELDS,
} as const

/** The same selection, whatever the order — a hand-written list may repeat items. */
const sameItems = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a.every((item) => b.includes(item)) && b.every((item) => a.includes(item))

const FEATURE_LABEL_KEYS: Record<FeatureTile, TranslationKey> = {
  mode: 'tile.mode',
  preset: 'tile.preset',
  fan: 'tile.fan',
  swing: 'tile.swing',
  swing_horizontal: 'tile.swing_horizontal',
}

/**
 * Visual editor for the card (returned by the wrapper's `getConfigElement`).
 * Emits `config-changed` with the merged config on every change.
 */
@customElement('climate-group-helper-card-editor')
export class ClimateGroupHelperCardEditor extends LocalizeMixin(LitElement) {
  @property({ attribute: false }) public hass?: HomeAssistant
  @property({ attribute: false }) public lovelace?: unknown

  @state() private _config?: LovelaceCardConfig
  /** Expanded branches; collapsed on open, never written to the config. */
  @state() private _open: Record<Branch, boolean> = {
    title: false,
    slider: false,
    views: false,
    features: false,
    boost: false,
    reset: false,
    panel: false,
  }

  // Edits build on the current schema: the first change writes the migrated
  // config, `config_version` included.
  public setConfig(config: LovelaceCardConfig): void {
    this._config = migrateConfig(config)
  }

  connectedCallback(): void {
    super.connectedCallback()
    preloadHaComponents().then(() => this.requestUpdate())
  }

  private _emit(patch: Partial<LovelaceCardConfig>): void {
    if (!this._config) return
    const config: LovelaceCardConfig = { ...this._config, ...patch }
    if (config.name === '') delete config.name
    for (const key of OPT_OUT_KEYS) if (config[key] !== false) delete config[key]
    // A list that is empty is the option off; one that is the standard
    // selection is no key at all, so a later standard reaches this card too.
    for (const key of Object.keys(LIST_DEFAULTS) as (keyof typeof LIST_DEFAULTS)[]) {
      const value = config[key]
      if (!Array.isArray(value)) continue
      if (!value.length) config[key] = false
      else if (sameItems(value, LIST_DEFAULTS[key])) delete config[key]
    }
    // `[]` hides the dial, so only the full set goes.
    if (Array.isArray(config.controls) && sameItems(config.controls, CONTROLS)) {
      delete config.controls
    }
    // `boost`: `false` and a custom object stay; `undefined` restores the default.
    for (const key of Object.keys(config) as (keyof LovelaceCardConfig)[]) {
      if (config[key] === undefined) delete config[key]
    }
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    )
  }

  private _entityChanged(ev: CustomEvent): void {
    this._emit({ entity: ev.detail.value })
  }

  private _titleChanged(ev: Event): void {
    this._emit({ title: (ev.target as HTMLInputElement).checked })
  }

  /** One of the top right corner's buttons: history, settings, ⋮. */
  private _cornerChanged(key: 'history' | 'settings', ev: Event): void {
    this._emit({ [key]: this._checked(ev) })
  }

  private _moreInfoChanged(ev: Event): void {
    this._emit({ more_info: (ev.target as HTMLInputElement).checked })
  }

  private _nameChanged(ev: Event): void {
    this._emit({ name: (ev.target as HTMLInputElement).value })
  }

  private _demoChanged(ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    // Leaving demo needs an entity; keep the toggle on if there is none.
    // live() in the template makes this re-render reset the rejected box.
    if (!on && !this._config?.entity) {
      this.requestUpdate()
      return
    }
    this._emit({ demo: on })
  }

  /**
   * A list option's next selection after one item was (un)ticked, in canonical
   * order. Off (`false`) reads as nothing selected, so ticking an item there
   * starts a list with just that item. `_emit()` turns an empty list into
   * `false` and the standard selection into no key.
   */
  private static _toggled<T>(all: readonly T[], current: readonly T[], item: T, on: boolean): T[] {
    return all.filter((i) => (i === item ? on : current.includes(i)))
  }

  private _checked(ev: Event): boolean {
    return (ev.target as HTMLInputElement).checked
  }

  private _sectionChanged(section: StatusSection, ev: Event): void {
    const current = statusSections(this._config) ?? []
    this._emit({
      status: ClimateGroupHelperCardEditor._toggled(STATUS_SECTIONS, current, section, this._checked(ev)),
    })
  }

  private _batteryChanged(ev: Event): void {
    this._emit({ battery: this._checked(ev) })
  }

  private _deviationsBadgeChanged(ev: Event): void {
    this._emit({ deviations_badge: this._checked(ev) })
  }

  private _controlChanged(control: Control, ev: Event): void {
    const current = controls(this._config)
    this._emit({
      controls: ClimateGroupHelperCardEditor._toggled(CONTROLS, current, control, this._checked(ev)),
    })
  }

  /**
   * The view switch is its views' parent: ticked, all of them (the default);
   * unticked, none — the dial shows temperature alone. Like the feature
   * tiles, a view the entity cannot show stays selectable; the card leaves it
   * out.
   */
  private _viewsChanged(ev: Event): void {
    this._emit({ views: this._checked(ev) ? undefined : false })
  }

  private _viewChanged(view: View, ev: Event): void {
    this._emit({
      views: ClimateGroupHelperCardEditor._toggled(VIEWS, dialViews(this._config), view, this._checked(ev)),
    })
  }

  private _mainSwitchChanged(ev: Event): void {
    this._emit({ main_switch: this._checked(ev) })
  }

  private _featuresChanged(ev: Event): void {
    this._emit({ features: this._checked(ev) ? undefined : false })
  }

  private get _unit(): string {
    return (this.hass?.config?.unit_system?.temperature as string) ?? '°C'
  }

  /** The boost as configured (the default while absent), read leniently. */
  private get _boostRaw(): Record<string, unknown> {
    return boostEnabled(this._config) ? boostValues(this._config, this._unit) : {}
  }

  private get _boostAbsolute(): boolean {
    const raw = this._boostRaw
    return raw.temperature !== undefined && raw.temperature_offset === undefined
  }

  /** The configured duration while it is valid, else the default. */
  private get _boostDuration(): number {
    const duration = this._boostRaw.duration
    return typeof duration === 'number' && Number.isInteger(duration) && duration >= 1
      ? duration
      : DEFAULT_BOOST_DURATION
  }

  // Ticked again, the tile starts from the default (no key) — in the unit of
  // whichever system the card is shown on.
  private _boostChanged(ev: Event): void {
    this._emit({ boost: this._checked(ev) ? undefined : false })
  }

  // Switching the kind starts it on its default value; the duration stays.
  private _boostKindChanged(absolute: boolean): void {
    const duration = this._boostDuration
    this._emit({
      boost: absolute
        ? { temperature: defaultBoostTemperature(this._unit), duration }
        : { temperature_offset: defaultBoost(this._unit).temperature_offset, duration },
    })
  }

  /** The field's number, or `undefined` (re-rendering it back) when it holds none. */
  private _number(ev: Event): number | undefined {
    const input = ev.target as HTMLInputElement
    const value = input.value.trim() === '' ? NaN : Number(input.value)
    if (Number.isFinite(value)) return value
    this.requestUpdate()
    return undefined
  }

  private get _boostLimit(): readonly [number, number] {
    const limits = boostLimits(this._unit)
    return this._boostAbsolute ? limits.temperature : limits.temperature_offset
  }

  private _boostValueChanged(ev: Event): void {
    const raw = this._number(ev)
    if (raw === undefined) return
    const [min, max] = this._boostLimit
    const value = Math.min(max, Math.max(min, raw))
    const duration = this._boostDuration
    const boost: BoostConfig = this._boostAbsolute
      ? { temperature: value, duration }
      : { temperature_offset: value, duration }
    this._emit({ boost })
    // A clamped value would otherwise stay in the field as typed.
    this.requestUpdate()
  }

  private _boostDurationChanged(ev: Event): void {
    const value = this._number(ev)
    if (value === undefined) return
    const duration = Math.min(MAX_BOOST_DURATION, Math.max(1, Math.round(value)))
    const raw = this._boostRaw
    const boost: BoostConfig = this._boostAbsolute
      ? {
          temperature:
            typeof raw.temperature === 'number' && Number.isFinite(raw.temperature)
              ? raw.temperature
              : defaultBoostTemperature(this._unit),
          duration,
        }
      : {
          temperature_offset:
            typeof raw.temperature_offset === 'number' && Number.isFinite(raw.temperature_offset)
              ? raw.temperature_offset
              : defaultBoost(this._unit).temperature_offset,
          duration,
        }
    this._emit({ boost })
    // A clamped value would otherwise stay in the field as typed.
    this.requestUpdate()
  }

  private _resetChanged(ev: Event): void {
    this._emit({ reset: this._checked(ev) ? undefined : false })
  }

  // The last field unticked switches the tile off: it would have nothing to send.
  private _resetFieldChanged(field: ResetField, ev: Event): void {
    this._emit({
      reset: ClimateGroupHelperCardEditor._toggled(
        RESET_FIELDS,
        resetFields(this._config),
        field,
        this._checked(ev)
      ),
    })
  }

  private _tileChanged(tile: FeatureTile, ev: Event): void {
    this._emit({
      features: ClimateGroupHelperCardEditor._toggled(
        FEATURE_TILES,
        featureTiles(this._config),
        tile,
        this._checked(ev)
      ),
    })
  }

  private _toggleOpen(branch: Branch): void {
    this._open = { ...this._open, [branch]: !this._open[branch] }
  }

  /**
   * One row of the Header or Controls list. Every row keeps the chevron's
   * column, so the checkboxes line up whether or not a row can expand.
   */
  private _row(content: unknown, branch?: Branch) {
    const open = branch ? this._open[branch] : false
    return html`<div class="row">
      ${
        branch
          ? html`<button
              type="button"
              class="chevron ${branch} ${open ? 'open' : ''}"
              aria-expanded=${open ? 'true' : 'false'}
              aria-label=${this.t(BRANCH_LABEL_KEYS[branch])}
              @click=${() => this._toggleOpen(branch)}
            >
              <svg viewBox="0 0 24 24"><path d=${MDI_CHEVRON_RIGHT} /></svg>
            </button>`
          : html`<span class="gutter"></span>`
      }
      ${content}
    </div>`
  }

  protected render() {
    if (!this._config) return nothing

    const titleOn = showTitle(this._config)
    const sections = statusSections(this._config)
    const tiles = featureTiles(this._config)
    const shownControls = controls(this._config)
    const dialShown = shownControls.includes('slider')
    const mainSwitchOn = showMainSwitch(this._config)
    const views = dialViews(this._config)
    const viewsOn = views.length > 0
    const featuresOn = tiles.length > 0
    const panelOn = sections?.includes('panel') ?? false
    const resetOn = resetEnabled(this._config)
    const reset = resetFields(this._config)
    const boostOn = boostEnabled(this._config)
    const boostAbsolute = this._boostAbsolute
    const boostRaw = this._boostRaw
    const boostValue = boostAbsolute ? boostRaw.temperature : boostRaw.temperature_offset
    const boostDuration = boostRaw.duration
    // A row that is on but has a ticked-off box somewhere below it shows the
    // mixed mark, so a collapsed row still tells. Display only: the box stays
    // checked underneath, and a click switches the row off as before.
    const viewsMixed = viewsOn && views.length < VIEWS.length
    const sliderMixed =
      dialShown &&
      (DIAL_OPTIONS.some((control) => !shownControls.includes(control)) || !viewsOn || viewsMixed)
    const featuresMixed = featuresOn && tiles.length < FEATURE_TILES.length
    const resetMixed = resetOn && reset.length < RESET_FIELDS.length
    const panelMixed =
      panelOn && !(showBattery(this._config) && showDeviationsBadge(this._config))

    return html`
      <div class="form">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity ?? ''}
          .includeDomains=${['climate']}
          allow-custom-entity
          .label=${this.t('editor.group_entity')}
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>

        <label class="check">
          <input
            type="checkbox"
            .checked=${live(this._config.demo === true)}
            @change=${this._demoChanged}
          />
          <span>${this.t('editor.demo')}</span>
        </label>

        <div class="hint advanced-note">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${MDI_INFORMATION_OUTLINE} /></svg>
          <span>${this.t('editor.advanced_note')}</span>
        </div>

        <fieldset class="header">
          <legend>${this.t('editor.header')}</legend>
          <div class="sub">
            ${this._row(
              html`<label class="check">
                <input
                  type="checkbox"
                  class="title-toggle"
                  .checked=${titleOn}
                  @change=${this._titleChanged}
                />
                <span>${this.t('editor.name')}</span>
              </label>`,
              'title'
            )}
            ${
              this._open.title
                ? html`<div class="children">
                    <label class="field ${titleOn ? '' : 'off'}">
                      <span>${this.t('editor.custom_name')}</span>
                      <input
                        type="text"
                        class="name-input"
                        .value=${this._config.name ?? ''}
                        placeholder=${this.t('editor.title_placeholder')}
                        ?disabled=${!titleOn}
                        @input=${this._nameChanged}
                      />
                    </label>
                  </div>`
                : nothing
            }
            ${this._row(html`<label class="check">
              <input
                type="checkbox"
                class="main-switch"
                .checked=${mainSwitchOn}
                @change=${this._mainSwitchChanged}
              />
              <span>${this.t('editor.main_switch')}</span>
            </label>`)}
            ${this._row(html`<label class="check">
              <input
                type="checkbox"
                class="history-toggle"
                .checked=${showHistory(this._config)}
                @change=${(e: Event) => this._cornerChanged('history', e)}
              />
              <span>${this.t('editor.history')}</span>
            </label>`)}
            ${this._row(html`<label class="check">
              <input
                type="checkbox"
                class="settings-toggle"
                .checked=${showSettings(this._config)}
                @change=${(e: Event) => this._cornerChanged('settings', e)}
              />
              <span>${this.t('editor.settings')}</span>
            </label>`)}
            ${this._row(html`<label class="check">
              <input
                type="checkbox"
                class="more-info-toggle"
                .checked=${showMoreInfo(this._config)}
                @change=${this._moreInfoChanged}
              />
              <span>${this.t('editor.more_info')}</span>
            </label>`)}
          </div>
        </fieldset>

        <fieldset class="controls">
          <legend>${this.t('editor.controls')}</legend>
          <div class="sub">
            ${this._row(
              html`<label class="check">
                <input
                  type="checkbox"
                  class="slider-toggle"
                  .checked=${dialShown}
                  .indeterminate=${live(sliderMixed)}
                  @change=${(e: Event) => this._controlChanged('slider', e)}
                />
                <span>${this.t(CONTROL_LABEL_KEYS.slider)}</span>
              </label>`,
              'slider'
            )}
            ${
              this._open.slider
                ? html`<div class="children">
                    ${DIAL_OPTIONS.map((control) =>
                      this._row(html`
                        <label class="check ${dialShown ? '' : 'off'}">
                          <input
                            type="checkbox"
                            class="control-${control}"
                            .checked=${shownControls.includes(control)}
                            ?disabled=${!dialShown}
                            @change=${(e: Event) => this._controlChanged(control, e)}
                          />
                          <span>${this.t(CONTROL_LABEL_KEYS[control])}</span>
                        </label>
                      `)
                    )}
                    ${this._row(
                      html`<label class="check ${dialShown ? '' : 'off'}">
                        <input
                          type="checkbox"
                          class="views-toggle"
                          .checked=${viewsOn}
                          .indeterminate=${live(viewsMixed)}
                          ?disabled=${!dialShown}
                          @change=${this._viewsChanged}
                        />
                        <span>${this.t('editor.control.toggle')}</span>
                      </label>`,
                      'views'
                    )}
                    ${
                      this._open.views
                        ? html`<div class="children">
                            ${VIEWS.map(
                              (view) => html`
                                <label class="check ${dialShown && viewsOn ? '' : 'off'}">
                                  <input
                                    type="checkbox"
                                    class="view-${view}"
                                    .checked=${views.includes(view)}
                                    ?disabled=${!dialShown || !viewsOn}
                                    @change=${(e: Event) => this._viewChanged(view, e)}
                                  />
                                  <span>${this.t(VIEW_LABEL_KEYS[view])}</span>
                                </label>
                              `
                            )}
                          </div>`
                        : nothing
                    }
                  </div>`
                : nothing
            }
            ${this._row(
              html`<label class="check">
                <input
                  type="checkbox"
                  class="features-toggle"
                  .checked=${featuresOn}
                  .indeterminate=${live(featuresMixed)}
                  @change=${this._featuresChanged}
                />
                <span>${this.t('editor.features')}</span>
              </label>`,
              'features'
            )}
            ${
              this._open.features
                ? html`<div class="children">
                    ${FEATURE_TILES.map(
                      (tile) => html`
                        <label class="check ${featuresOn ? '' : 'off'}">
                          <input
                            type="checkbox"
                            class="tile-${tile}"
                            .checked=${tiles.includes(tile)}
                            ?disabled=${!featuresOn}
                            @change=${(e: Event) => this._tileChanged(tile, e)}
                          />
                          <span>${this.t(FEATURE_LABEL_KEYS[tile])}</span>
                        </label>
                      `
                    )}
                  </div>`
                : nothing
            }
            ${this._row(
              html`<label class="check">
                <input
                  type="checkbox"
                  class="boost"
                  .checked=${boostOn}
                  @change=${this._boostChanged}
                />
                <span>${this.t('editor.boost')}</span>
              </label>`,
              'boost'
            )}
            ${
              this._open.boost
                ? html`<div class="children ${boostOn ? '' : 'off'}">
                    <label class="check">
                      <input
                        type="radio"
                        name="boost-kind"
                        class="boost-relative"
                        .checked=${live(!boostAbsolute)}
                        ?disabled=${!boostOn}
                        @change=${() => this._boostKindChanged(false)}
                      />
                      <span>${this.t('editor.boost_relative')}</span>
                    </label>
                    <label class="check">
                      <input
                        type="radio"
                        name="boost-kind"
                        class="boost-absolute"
                        .checked=${live(boostAbsolute)}
                        ?disabled=${!boostOn}
                        @change=${() => this._boostKindChanged(true)}
                      />
                      <span>${this.t('editor.boost_absolute')}</span>
                    </label>
                    <label class="number">
                      <span>${this.t(boostAbsolute ? 'common.temperature' : 'offset.label')}</span>
                      <input
                        type="number"
                        class="boost-value"
                        min=${this._boostLimit[0]}
                        max=${this._boostLimit[1]}
                        step="0.5"
                        .value=${live(typeof boostValue === 'number' ? String(boostValue) : '')}
                        ?disabled=${!boostOn}
                        @change=${this._boostValueChanged}
                      />
                      <span class="unit">${this._unit}</span>
                    </label>
                    <label class="number">
                      <span>${this.t('editor.boost_duration')}</span>
                      <input
                        type="number"
                        class="boost-duration"
                        min="1"
                        max=${MAX_BOOST_DURATION}
                        step="1"
                        .value=${live(typeof boostDuration === 'number' ? String(boostDuration) : '')}
                        ?disabled=${!boostOn}
                        @change=${this._boostDurationChanged}
                      />
                      <span class="unit">min</span>
                    </label>
                  </div>`
                : nothing
            }
            ${
              boostOn && !boostParams(this._config, this._unit)
                ? html`<div class="hint boost-invalid-hint indent">
                    ${this.t('editor.boost_invalid')}
                  </div>`
                : nothing
            }
            ${this._row(
              html`<label class="check">
                <input
                  type="checkbox"
                  class="reset"
                  .checked=${resetOn}
                  .indeterminate=${live(resetMixed)}
                  @change=${this._resetChanged}
                />
                <span>${this.t('editor.reset')}</span>
              </label>`,
              'reset'
            )}
            ${
              this._open.reset
                ? html`<div class="children">
                    ${RESET_FIELDS.map(
                      (field) => html`
                        <label class="check ${resetOn ? '' : 'off'}">
                          <input
                            type="checkbox"
                            class="reset-field"
                            .checked=${reset.includes(field)}
                            ?disabled=${!resetOn}
                            @change=${(e: Event) => this._resetFieldChanged(field, e)}
                          />
                          <span>${this.t(RESET_LABEL_KEYS[field])}</span>
                        </label>
                      `
                    )}
                  </div>`
                : nothing
            }
          </div>
        </fieldset>

        <fieldset class="status">
          <legend>${this.t('editor.status_cell')}</legend>
          <div class="sub">
            ${STATUS_SECTIONS.map(
              (section) => html`
                ${this._row(
                  html`<label class="check">
                    <input
                      type="checkbox"
                      class="section-${section}"
                      .checked=${sections?.includes(section) ?? false}
                      .indeterminate=${live(section === 'panel' && panelMixed)}
                      @change=${(e: Event) => this._sectionChanged(section, e)}
                    />
                    <span>${this.t(SECTION_LABEL_KEYS[section])}</span>
                  </label>`,
                  section === 'panel' ? 'panel' : undefined
                )}
                ${
                  section === 'panel' && this._open.panel
                    ? html`<div class="children">
                        <label class="check ${panelOn ? '' : 'off'}">
                          <input
                            type="checkbox"
                            class="battery"
                            .checked=${showBattery(this._config)}
                            ?disabled=${!panelOn}
                            @change=${this._batteryChanged}
                          />
                          <span>${this.t('editor.battery')}</span>
                        </label>
                        <label class="check ${panelOn ? '' : 'off'}">
                          <input
                            type="checkbox"
                            class="deviations-badge"
                            .checked=${showDeviationsBadge(this._config)}
                            ?disabled=${!panelOn}
                            @change=${this._deviationsBadgeChanged}
                          />
                          <span>${this.t('editor.deviations_badge')}</span>
                        </label>
                      </div>`
                    : nothing
                }
              `
            )}
          </div>
        </fieldset>
      </div>
    `
  }

  static styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    ha-entity-picker {
      display: block;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field span,
    legend {
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .field input,
    .number input {
      padding: 8px 10px;
      border: 1px solid
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 20%, transparent));
      border-radius: var(--ha-border-radius-sm, 8px);
      background: var(--secondary-background-color, transparent);
      color: var(--primary-text-color);
      font: inherit;
    }
    .number {
      display: flex;
      align-items: center;
      gap: 8px;
      /* Starts where a checkbox or radio does: theirs carry the browser's
         default left margin. */
      padding-left: 4px;
    }
    .number > span:first-child {
      min-width: 6em;
    }
    .number input {
      width: 6em;
      padding: 4px 8px;
    }
    .children.off .number,
    .children.off .check {
      opacity: 0.5;
    }
    fieldset {
      margin: 0;
      padding: 8px 12px;
      border: 1px solid
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 12%, transparent));
      border-radius: var(--ha-border-radius-md, 12px);
    }
    .sub {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
    }
    .check.off,
    .field.off {
      opacity: 0.5;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .gutter,
    .chevron {
      flex: none;
      width: 20px;
      height: 20px;
    }
    .chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .chevron.open {
      transform: rotate(90deg);
    }
    .chevron svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    /* An expanded row's options: one step in from its checkbox (24px), along
       a dashed guide below the chevron. */
    .children {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-left: 9px;
      padding-left: 38px;
      border-left: 1px dashed
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 20%, transparent));
    }
    /* A row inside the options (one that expands further, and its siblings)
       puts its chevron column into the indent, so its checkbox lines up with
       every other option at that level (gutter 20px + gap 4px). Its own
       options then hang off that chevron: 9px in from it, not from the
       checkbox. */
    .children > .row {
      margin-left: -24px;
    }
    .children > .children {
      margin-left: -15px;
    }
    /* Hints stay outside the collapsed options, at their level. */
    .indent {
      padding-left: 48px;
    }
    .hint {
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .advanced-note {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .advanced-note svg {
      flex: none;
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
  `
}
