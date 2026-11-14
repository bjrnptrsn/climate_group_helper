import { LitElement, css, html, nothing, svg } from 'lit'
import { property, state } from 'lit/decorators.js'
import { customElement } from '../lib/define'
import {
  CENTER,
  RADIUS,
  ROTATE_ANGLE,
  VIEW,
  angle,
  clamp,
  dash,
  isLowDemand,
  nearestSlider,
  percentFromPoint,
  trackPath,
  type ActiveSlider,
  type SliderMode,
} from '../lib/slider'

const KEY_CODES = ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End']

/**
 * SVG temperature slider — single setpoint or dual (low/high range).
 *
 * Emits `value-changed` (single) or `low-changed` / `high-changed` (dual), plus
 * the corresponding `*-changing` events while dragging. `*-changed` fires only
 * when the value differs from the committed property — every service call has
 * side effects on the group (offset reset, boost abort, schedule hold), so a tap
 * on the handle must not send one.
 *
 * Only a band along the arc takes pointer input, like HA's own dial: a tap in
 * the centre must not set a value. A finger on that band is usually a scroll
 * that starts there, so touch input moves a value only from its handle's grip;
 * the rest of the arc scrolls the page. Mouse and pen keep the whole band.
 */
@customElement('cgh-circular-slider')
export class CghCircularSlider extends LitElement {
  @property({ type: Number }) public min = 5
  @property({ type: Number }) public max = 35
  @property({ type: Number }) public step = 0.5
  @property({ type: Number }) public value?: number
  @property({ type: Number }) public low?: number
  @property({ type: Number }) public high?: number
  @property({ type: Number }) public current?: number
  @property({ type: Boolean }) public dual = false
  @property({ type: Boolean, reflect: true }) public disabled = false
  @property({ type: String }) public mode: SliderMode = 'full'
  /** Where the fill starts in `origin` mode. */
  @property({ type: Number }) public origin = 0
  @property({ type: Boolean, reflect: true }) public inactive = false
  /** The range bound the keyboard moves (dual only). */
  @property({ type: String }) public bound: 'low' | 'high' = 'low'

  @state() private _localValue?: number
  @state() private _localLow?: number
  @state() private _localHigh?: number
  @state() private _active?: ActiveSlider

  private _svg?: SVGSVGElement
  private _pointerId?: number

  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('value') && this._active !== 'value') {
      this._localValue = this.value
    }
    if (changed.has('low') && this._active !== 'low') {
      this._localLow = this.low
    }
    if (changed.has('high') && this._active !== 'high') {
      this._localHigh = this.high
    }
  }

  private _valueFromEvent(e: PointerEvent): number {
    const rect = this._svg?.getBoundingClientRect()
    if (!rect) return this.min
    return (
      this.min +
      percentFromPoint(e.clientX, e.clientY, rect) * (this.max - this.min)
    )
  }

  private _setActiveValue(value: number): void {
    const v = clamp(value, this.min, this.max, this.step)
    if (this._active === 'low') {
      this._localLow = Math.min(v, this._localHigh ?? this.max)
    } else if (this._active === 'high') {
      this._localHigh = Math.max(v, this._localLow ?? this.min)
    } else {
      this._localValue = v
    }
  }

  private _activeValue(): number | undefined {
    if (this._active === 'low') return this._localLow
    if (this._active === 'high') return this._localHigh
    if (this._active === 'value') return this._localValue
    return undefined
  }

  private _committedValue(): number | undefined {
    if (this._active === 'low') return this.low
    if (this._active === 'high') return this.high
    return this.value
  }

  /** End the interaction; emit `changed` only for an actual change. */
  private _commit(): void {
    if (!this._active) return
    if (this._activeValue() !== this._committedValue()) this._emit('changed')
    this._active = undefined
  }

  private _emit(type: 'changing' | 'changed'): void {
    if (!this._active) return
    const value = type === 'changed' ? this._activeValue() : undefined
    this.dispatchEvent(
      new CustomEvent(`${this._active}-${type}`, {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    )
  }

  private _onPointerDown(e: PointerEvent): void {
    if (this.disabled || this._active || e.pointerType === 'touch') return
    const value = this._valueFromEvent(e)
    this._active = nearestSlider(
      value,
      this._localLow ?? this.min,
      this._localHigh ?? this.max,
      this.dual
    )
    this._pointerId = e.pointerId
    this._setActiveValue(value)
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    this._emit('changing')
  }

  /** Grabbing a handle moves nothing yet: a tap on it must not send. */
  private _onGripDown(e: PointerEvent, slider: ActiveSlider): void {
    if (this.disabled || this._active) return
    this._active = slider
    this._pointerId = e.pointerId
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    this._emit('changing')
  }

  private _onPointerMove(e: PointerEvent): void {
    if (!this._active || e.pointerId !== this._pointerId) return
    this._setActiveValue(this._valueFromEvent(e))
    this._emit('changing')
  }

  private _onPointerUp(e: PointerEvent): void {
    if (!this._active || e.pointerId !== this._pointerId) return
    ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
    this._pointerId = undefined
    this._commit()
  }

  /** The browser took the gesture over (e.g. a system gesture): send nothing. */
  private _onPointerCancel(e: PointerEvent): void {
    if (!this._active || e.pointerId !== this._pointerId) return
    this._pointerId = undefined
    if (this._active === 'low') this._localLow = this.low
    else if (this._active === 'high') this._localHigh = this.high
    else this._localValue = this.value
    this._active = undefined
  }

  // Keydown only moves the handle; the release sends — a held arrow key would
  // otherwise fire a service call per auto-repeat.
  private _onKeyDown(e: KeyboardEvent): void {
    if (this.disabled || this._pointerId !== undefined) return
    if (!KEY_CODES.includes(e.code)) return
    e.preventDefault()
    if (!this._active) this._active = this.dual ? this.bound : 'value'
    const current = this._activeValue() ?? this.min
    switch (e.code) {
      case 'ArrowRight':
      case 'ArrowUp':
        this._setActiveValue(current + this.step)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        this._setActiveValue(current - this.step)
        break
      case 'Home':
        this._setActiveValue(this.min)
        break
      case 'End':
        this._setActiveValue(this.max)
        break
    }
    this._emit('changing')
  }

  private _onKeyUp(e: KeyboardEvent): void {
    if (this._pointerId !== undefined || !KEY_CODES.includes(e.code)) return
    this._commit()
  }

  // Focus lost with a key still held: no keyup will follow.
  private _onBlur(): void {
    if (this._pointerId === undefined) this._commit()
  }

  /**
   * A coloured arc segment. Translucent over the card, with no opaque
   * underlay: HA lays `--clear-background-color` under it, which a theme
   * without a dark mode leaves white — the arc turns pastel and hides the
   * sheen.
   */
  private _fill(from: number, to: number, cls: string, active = false): unknown {
    const [dasharray, dashoffset] = dash(from, to, this.min, this.max)
    return svg`
      <path
        class="fill ${cls}${active ? ' active' : ''}"
        d=${trackPath}
        stroke-dasharray=${dasharray}
        stroke-dashoffset=${dashoffset}
      />
    `
  }

  /**
   * Fill between `origin` and the value, towards either side. Nothing at the
   * origin itself: a zero-length segment's round cap would paint a dot.
   */
  private _originFill(value: number): unknown {
    const origin = Math.min(this.max, Math.max(this.min, this.origin))
    if (value === origin) return nothing
    return this._fill(Math.min(origin, value), Math.max(origin, value), 'value')
  }

  private _handle(value: number, cls: string): unknown {
    return svg`
      <circle
        class="handle-ring ${cls}"
        transform="rotate(${angle(value, this.min, this.max)} 0 0)"
        cx=${RADIUS}
        cy="0"
        r="12"
      />
      <circle
        class="handle"
        transform="rotate(${angle(value, this.min, this.max)} 0 0)"
        cx=${RADIUS}
        cy="0"
        r="9"
      />
    `
  }

  /**
   * Mobile browsers ignore `touch-action` on SVG elements and start scrolling,
   * which cancels the drag: only a prevented `touchstart` keeps the page still.
   * Pointer events go on regardless.
   */
  private _gripTouch = {
    handleEvent: (e: TouchEvent) => {
      if (!this.disabled) e.preventDefault()
    },
    passive: false,
  }

  /** Invisible touch target over a handle, as wide as the input band. */
  private _grip(value: number, slider: ActiveSlider): unknown {
    return svg`<circle
      class="grip ${slider}"
      transform="rotate(${angle(value, this.min, this.max)} 0 0)"
      cx=${RADIUS}
      cy="0"
      r="24"
      @touchstart=${this._gripTouch}
      @pointerdown=${(e: PointerEvent) => this._onGripDown(e, slider)}
      @pointermove=${this._onPointerMove}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
    />`
  }

  /**
   * Glass sheen over the whole ring, drawn after the fills: a radial gradient
   * across the 24px band (ring radius ± 12) — a thin lit rim at both edges,
   * like the tiles' hairline, and a soft highlight towards the outer one. White
   * on purpose: light on glass, not a theme tint.
   */
  private _glass(): unknown {
    const inner = (RADIUS - 12) / (RADIUS + 12)
    return svg`
      <defs>
        <radialGradient
          id="cgh-glass"
          gradientUnits="userSpaceOnUse"
          cx="0"
          cy="0"
          r=${RADIUS + 12}
        >
          <stop offset=${inner} stop-color="#fff" stop-opacity="0.09" />
          <stop offset=${inner + 0.012} stop-color="#fff" stop-opacity="0" />
          <stop offset="0.91" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.96" stop-color="#fff" stop-opacity="0.1" />
          <stop offset="0.99" stop-color="#fff" stop-opacity="0.04" />
          <stop offset="1" stop-color="#fff" stop-opacity="0.09" />
        </radialGradient>
      </defs>
      <path class="glass" d=${trackPath} />
    `
  }

  private _currentMarker(value: number): unknown {
    return svg`<circle
      class="current"
      transform="rotate(${angle(value, this.min, this.max)} 0 0)"
      cx=${RADIUS}
      cy="0"
      r="4"
    />`
  }

  protected render() {
    const current = this.current
    const currentVisible =
      current != null && current >= this.min && current <= this.max
    // Only an arc towards the setpoint counts as demand. When the setpoint is
    // behind the current temperature (heat below current, cool above), the
    // segment is zero-length and its round cap would paint a stray dot.
    const active = currentVisible && !this.inactive

    const lowValue = this.dual ? this._localLow : this._localValue
    const highValue = this.dual ? this._localHigh : undefined

    const lowDemand =
      active &&
      lowValue != null &&
      isLowDemand(current!, lowValue, this.dual, this.mode)
    const highDemand = active && highValue != null && highValue <= current!

    return html`
      <svg
        viewBox="0 0 ${VIEW} ${VIEW}"
        class="slider"
        @keydown=${this._onKeyDown}
        @keyup=${this._onKeyUp}
        @blur=${this._onBlur}
        tabindex="0"
        role="slider"
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuenow=${(this.dual && this.bound === 'high' ? highValue : lowValue) ?? nothing}
        aria-disabled=${this.disabled}
      >
        <g
          class=${this.inactive ? 'inactive' : ''}
          transform="translate(${CENTER} ${CENTER}) rotate(${ROTATE_ANGLE})"
        >
          <path class="track" d=${trackPath} />
          ${
            this.dual
              ? svg`
                  ${
                    lowValue != null
                      ? this._fill(this.min, lowValue, 'low')
                      : nothing
                  }
                  ${
                    highValue != null
                      ? this._fill(highValue, this.max, 'high')
                      : nothing
                  }
                  ${
                    lowDemand
                      ? this._fill(current!, lowValue!, 'low', true)
                      : nothing
                  }
                  ${
                    highDemand
                      ? this._fill(highValue!, current!, 'high', true)
                      : nothing
                  }
                  ${this._glass()}
                  ${currentVisible ? this._currentMarker(current!) : nothing}
                  ${lowValue != null ? this._handle(lowValue, 'low') : nothing}
                  ${highValue != null ? this._handle(highValue, 'high') : nothing}
                `
              : svg`
                  ${
                    lowValue != null
                      ? this.mode === 'end'
                        ? this._fill(lowValue, this.max, 'value')
                        : this.mode === 'full'
                          ? this._fill(this.min, this.max, 'value')
                          : this.mode === 'origin'
                            ? this._originFill(lowValue)
                            : this._fill(this.min, lowValue, 'value')
                      : nothing
                  }
                  ${
                    lowDemand
                      ? this.mode === 'end'
                        ? this._fill(lowValue!, current!, 'value', true)
                        : this._fill(current!, lowValue!, 'value', true)
                      : nothing
                  }
                  ${this._glass()}
                  ${currentVisible ? this._currentMarker(current!) : nothing}
                  ${lowValue != null ? this._handle(lowValue, 'value') : nothing}
                `
          }
          <path
            class="interaction"
            d=${trackPath}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerCancel}
          />
          ${
            this.dual
              ? svg`
                  ${lowValue != null ? this._grip(lowValue, 'low') : nothing}
                  ${highValue != null ? this._grip(highValue, 'high') : nothing}
                `
              : lowValue != null
                ? this._grip(lowValue, 'value')
                : nothing
          }
        </g>
      </svg>
    `
  }

  protected firstUpdated(): void {
    this._svg = this.renderRoot.querySelector('svg') ?? undefined
  }

  static styles = css`
    :host {
      display: block;
      --cgh-slider-track: var(--primary-text-color);
    }
    .slider {
      width: 100%;
      display: block;
      outline: none;
    }
    .interaction {
      stroke: transparent;
      stroke-width: 48;
      stroke-linecap: round;
      pointer-events: stroke;
      cursor: pointer;
    }
    /* The only place a finger can grab; the scroll itself is stopped in
       touchstart, as mobile browsers ignore this on SVG elements. */
    .grip {
      fill: transparent;
      pointer-events: all;
      touch-action: none;
      cursor: grab;
    }
    :host([disabled]) .interaction {
      cursor: default;
    }
    :host([disabled]) .grip {
      pointer-events: none;
    }
    g {
      fill: none;
    }
    /* The text colour, faint — like the tiles' glass surface, so the
       background shows through instead of a flat grey. */
    .track {
      stroke: var(--cgh-slider-track);
      stroke-opacity: 0.07;
      stroke-width: 24;
      stroke-linecap: round;
    }
    .fill {
      stroke-width: 24;
      stroke-linecap: round;
      opacity: 0.5;
      transition: opacity 180ms ease-in-out;
    }
    .fill.active {
      opacity: 1;
    }
    .fill.value {
      stroke: var(--cgh-slider-color, var(--primary-color));
    }
    .fill.low {
      stroke: var(--cgh-slider-low, var(--state-climate-heat-color, #ff5722));
    }
    .fill.high {
      stroke: var(--cgh-slider-high, var(--state-climate-cool-color, #2196f3));
    }
    .glass {
      stroke: url(#cgh-glass);
      stroke-width: 24;
      stroke-linecap: round;
      pointer-events: none;
    }
    .handle {
      fill: #fff;
    }
    .handle-ring {
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.35));
    }
    .handle-ring.value {
      fill: var(--cgh-slider-color, var(--primary-color));
    }
    .handle-ring.low {
      fill: var(--cgh-slider-low, var(--state-climate-heat-color, #ff5722));
    }
    .handle-ring.high {
      fill: var(--cgh-slider-high, var(--state-climate-cool-color, #2196f3));
    }
    .inactive .handle-ring {
      fill: var(--state-inactive-color, var(--disabled-color, #9e9e9e));
    }
    .current {
      fill: var(--primary-text-color);
      opacity: 0.5;
    }
    .inactive .fill {
      opacity: 0;
    }
  `
}
