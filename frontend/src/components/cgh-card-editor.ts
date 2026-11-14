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
  boostEnabled,
  boostLimits,
  boostParams,
  defaultBoost,
  defaultBoostTemperature,
  RESET_FIELDS,
  RESET_LABEL_KEYS,
  STATUS_SECTIONS,
  controls,
  featureTiles,
  resetEnabled,
  resetFields,
  showBattery,
  showHumidityView,
  showMainSwitch,
  showMoreInfo,
  showOffset,
  showTemperatureView,
  showTitle,
  statusSections,
} from '../lib/config'
import { preloadHaComponents } from '../lib/ha-helpers'
import { MDI_CHEVRON_RIGHT, MDI_INFORMATION_OUTLINE } from '../lib/icons'
import { LocalizeMixin, type TranslationKey } from '../lib/i18n'
import type { View as DialView } from './cgh-climate-control'
import type {
  BoostConfig,
  Control,
  FeatureTile,
  HomeAssistant,
  LovelaceCardConfig,
  ResetField,
  StatusSection,
} from '../types'

const SECTION_LABEL_KEYS: Record<StatusSection, TranslationKey> = {
  panel: 'editor.section.panel',
  badges: 'editor.section.badges',
  deviations: 'editor.section.deviations',
}

const CONTROL_LABEL_KEYS: Record<Control, TranslationKey> = {
  slider: 'editor.control.slider',
  buttons: 'editor.control.buttons',
  toggle: 'editor.control.toggle',
}

/** Rows of the Header and Controls lists that expand to their options. */
type Branch = 'title' | 'slider' | 'boost' | 'reset'

const BRANCH_LABEL_KEYS: Record<Branch, TranslationKey> = {
  title: 'editor.name',
  slider: 'editor.control.slider',
  boost: 'editor.boost',
  reset: 'editor.reset',
}

/** The dial's own options, shown under "Slider". */
const DIAL_OPTIONS: Control[] = CONTROLS.filter((control) => control !== 'slider')

/** The dial's views, the children of the view switch in the editor. */
const NO_VIEWS: Record<DialView, boolean> = { offset: false, temperature: false, humidity: false }
const ALL_VIEWS: Record<DialView, boolean> = { offset: true, temperature: true, humidity: true }

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
    boost: false,
    reset: false,
  }

  public setConfig(config: LovelaceCardConfig): void {
    this._config = config
  }

  connectedCallback(): void {
    super.connectedCallback()
    preloadHaComponents().then(() => this.requestUpdate())
  }

  private _emit(patch: Partial<LovelaceCardConfig>): void {
    if (!this._config) return
    const config: LovelaceCardConfig = { ...this._config, ...patch }
    if (config.name === '') delete config.name
    // Shown is the default: only `false` is written.
    if (config.title !== false) delete config.title
    if (config.more_info !== false) delete config.more_info
    if (config.battery !== false) delete config.battery
    if (config.temperature !== false) delete config.temperature
    if (config.humidity !== false) delete config.humidity
    // Off is the default: unticking removes the key instead of leaving
    // `reset: undefined` behind.
    if (config.reset === undefined) delete config.reset
    if (config.boost === undefined) delete config.boost
    if (config.main_switch !== true) delete config.main_switch
    if (config.offset !== true) delete config.offset
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

  // `status: false` from YAML resolves to no sections, so ticking one starts a
  // list with just that section.
  private _sectionChanged(section: StatusSection, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    const current = statusSections(this._config) ?? []
    this._emit({
      status: on
        ? [...current, section]
        : current.filter((s) => s !== section),
    })
  }

  private _batteryChanged(ev: Event): void {
    this._emit({ battery: (ev.target as HTMLInputElement).checked })
  }

  private _controlChanged(control: Control, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    if (control === 'toggle') {
      // The view switch is the parent of the views: ticked, all of them are
      // on; unticked, it is the same as no view ticked.
      this._emit(this._viewsPatch(on ? ALL_VIEWS : NO_VIEWS))
      return
    }
    const current = controls(this._config)
    this._emit({
      controls: on ? [...current, control] : current.filter((c) => c !== control),
    })
  }

  /**
   * The views as ticked in the editor: none while the view switch is off —
   * the dial then shows temperature alone. Like the feature tiles, a view
   * the entity cannot show stays selectable; the card leaves it out.
   */
  private _viewsOn(): Record<DialView, boolean> {
    const switchOn = controls(this._config).includes('toggle')
    return {
      offset: switchOn && showOffset(this._config),
      temperature: switchOn && showTemperatureView(this._config),
      humidity: switchOn && showHumidityView(this._config),
    }
  }

  /**
   * The view switch and its views as one config patch. No view ticked is the
   * switch off; the views are then left at their defaults, so a switched-off
   * card carries no stale view keys.
   */
  private _viewsPatch(views: Record<DialView, boolean>): Partial<LovelaceCardConfig> {
    const others = controls(this._config).filter((c) => c !== 'toggle')
    if (!Object.values(views).some(Boolean)) {
      return { controls: others, offset: false, temperature: undefined, humidity: undefined }
    }
    return {
      controls: [...others, 'toggle'],
      offset: views.offset,
      temperature: views.temperature,
      humidity: views.humidity,
    }
  }

  /** Ticking a view while the switch is off switches it on with that view alone. */
  private _viewChanged(view: DialView, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked
    const switchOn = controls(this._config).includes('toggle')
    const views = switchOn ? this._viewsOn() : { ...NO_VIEWS }
    views[view] = checked
    this._emit(this._viewsPatch(views))
  }

  private _mainSwitchChanged(ev: Event): void {
    this._emit({ main_switch: (ev.target as HTMLInputElement).checked })
  }

  private get _unit(): string {
    return (this.hass?.config?.unit_system?.temperature as string) ?? '°C'
  }

  /** The boost as configured, read leniently: a hand-written one may be off. */
  private get _boostRaw(): Record<string, unknown> {
    return boostEnabled(this._config) ? (this._config!.boost as Record<string, unknown>) : {}
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

  // A copy, so the config never shares the default object.
  private _boostChanged(ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    this._emit({ boost: on ? { ...defaultBoost(this._unit) } : undefined })
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

  // A copy, so the config never shares the constant's array.
  private _resetChanged(ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    this._emit({ reset: on ? [...DEFAULT_RESET_FIELDS] : undefined })
  }

  // Written in canonical order. The list stays even when the last field goes:
  // the tile is still switched on, it just has nothing to send (the editor
  // says so).
  private _resetFieldChanged(field: ResetField, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    const current = resetFields(this._config)
    this._emit({
      reset: RESET_FIELDS.filter((f) => (f === field ? on : current.includes(f))),
    })
  }

  private _tileChanged(tile: FeatureTile, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked
    const current = featureTiles(this._config)
    this._emit({
      features: on ? [...current, tile] : current.filter((t) => t !== tile),
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
    // The views are the view switch's children: ticked only while it is on.
    const viewsOn = this._viewsOn()
    const resetOn = resetEnabled(this._config)
    const reset = resetFields(this._config)
    const boostOn = boostEnabled(this._config)
    const boostAbsolute = this._boostAbsolute
    const boostRaw = this._boostRaw
    const boostValue = boostAbsolute ? boostRaw.temperature : boostRaw.temperature_offset
    const boostDuration = boostRaw.duration

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
          </div>
        </fieldset>

        <fieldset class="controls">
          <legend>${this.t('editor.controls')}</legend>
          <div class="sub">
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
                class="more-info-toggle"
                .checked=${showMoreInfo(this._config)}
                @change=${this._moreInfoChanged}
              />
              <span>${this.t('editor.more_info')}</span>
            </label>`)}
            ${this._row(
              html`<label class="check">
                <input
                  type="checkbox"
                  .checked=${dialShown}
                  @change=${(e: Event) => this._controlChanged('slider', e)}
                />
                <span>${this.t(CONTROL_LABEL_KEYS.slider)}</span>
              </label>`,
              'slider'
            )}
            ${
              this._open.slider
                ? html`<div class="children">
                    ${DIAL_OPTIONS.map(
                      (control) => html`
                        <label class="check ${dialShown ? '' : 'off'}">
                          <input
                            type="checkbox"
                            .checked=${shownControls.includes(control)}
                            ?disabled=${!dialShown}
                            @change=${(e: Event) => this._controlChanged(control, e)}
                          />
                          <span>${this.t(CONTROL_LABEL_KEYS[control])}</span>
                        </label>
                      `
                    )}
                    <label class="check nested ${dialShown ? '' : 'off'}">
                      <input
                        type="checkbox"
                        class="offset"
                        .checked=${viewsOn.offset}
                        ?disabled=${!dialShown}
                        @change=${(e: Event) => this._viewChanged('offset', e)}
                      />
                      <span>${this.t('editor.offset')}</span>
                    </label>
                    <label class="check nested ${dialShown ? '' : 'off'}">
                      <input
                        type="checkbox"
                        class="view-temperature"
                        .checked=${viewsOn.temperature}
                        ?disabled=${!dialShown}
                        @change=${(e: Event) => this._viewChanged('temperature', e)}
                      />
                      <span>${this.t('common.temperature')}</span>
                    </label>
                    <label class="check nested ${dialShown ? '' : 'off'}">
                      <input
                        type="checkbox"
                        class="view-humidity"
                        .checked=${viewsOn.humidity}
                        ?disabled=${!dialShown}
                        @change=${(e: Event) => this._viewChanged('humidity', e)}
                      />
                      <span>${this.t('common.humidity')}</span>
                    </label>
                  </div>`
                : nothing
            }
            ${FEATURE_TILES.map(
              (tile) => this._row(html`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${tiles.includes(tile)}
                    @change=${(e: Event) => this._tileChanged(tile, e)}
                  />
                  <span>${this.t(FEATURE_LABEL_KEYS[tile])}</span>
                </label>
              `)
            )}
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
            ${
              resetOn && !reset.length
                ? html`<div class="hint reset-hint indent">${this.t('editor.reset_empty')}</div>`
                : nothing
            }
          </div>
        </fieldset>

        <fieldset class="status">
          <legend>${this.t('editor.status_cell')}</legend>
          <div class="sub">
            ${STATUS_SECTIONS.map(
              (section) => html`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${sections?.includes(section) ?? false}
                    @change=${(e: Event) => this._sectionChanged(section, e)}
                  />
                  <span>${this.t(SECTION_LABEL_KEYS[section])}</span>
                </label>
              `
            )}
            <label class="check">
              <input
                type="checkbox"
                class="battery"
                .checked=${showBattery(this._config)}
                @change=${this._batteryChanged}
              />
              <span>${this.t('editor.battery')}</span>
            </label>
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
    /* The views are the view switch's segments. */
    .nested {
      padding-left: 24px;
    }
    /* Hints stay outside the collapsed options, at their level. */
    .indent {
      padding-left: 48px;
    }
    .indent-2 {
      padding-left: 72px;
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
