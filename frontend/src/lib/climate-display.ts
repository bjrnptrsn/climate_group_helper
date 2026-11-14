import { html, type TemplateResult } from 'lit'
import { numberLocale } from './format'
import type { HassEntity, HomeAssistant } from '../types'

// Shared by the dial views that show the climate group: arc colour, glow
// colour and the big centre number. Styles for the last two live in
// `shared-styles.ts` (`bigNumberStyles`, `glowStyles`).

const inactive = (stateObj?: HassEntity): boolean => {
  const state = stateObj?.state
  return state === 'off' || state === 'unavailable' || state === 'unknown'
}

/** Arc colour: the group's HVAC mode. */
export const stateColor = (stateObj?: HassEntity): string => {
  switch (stateObj?.state) {
    case 'heat':
      return 'var(--state-climate-heat-color, #ff5722)'
    case 'cool':
      return 'var(--state-climate-cool-color, #2196f3)'
    case 'heat_cool':
      return 'var(--state-climate-heat-cool-color, var(--state-climate-heat-color, #ffb300))'
    case 'auto':
      return 'var(--state-climate-auto-color, #4caf50)'
    case 'dry':
      return 'var(--state-climate-dry-color, #ff9800)'
    case 'fan_only':
      return 'var(--state-climate-fan_only-color, #00bcd4)'
    default:
      return 'var(--state-inactive-color, var(--disabled-color, #9e9e9e))'
  }
}

/** Colour of the active hvac_action (glow + labels); undefined when idle/off. */
export const actionColor = (stateObj?: HassEntity): string | undefined => {
  const action = stateObj?.attributes.hvac_action
  if (!action || action === 'idle' || action === 'off' || inactive(stateObj)) {
    return undefined
  }
  switch (action) {
    case 'cooling':
      return 'var(--state-climate-cool-color, #2196f3)'
    case 'drying':
      return 'var(--state-climate-dry-color, #ff9800)'
    case 'fan':
      return 'var(--state-climate-fan_only-color, #00bcd4)'
    default:
      return 'var(--state-climate-heat-color, #ff5722)'
  }
}

/**
 * The group's setpoint step. Same fallback as HA's own climate control: no
 * member reporting a step leaves the group without one.
 */
export const targetStep = (hass?: HomeAssistant, stateObj?: HassEntity): number => {
  const reported = stateObj?.attributes.target_temp_step as number | undefined
  if (reported) return reported
  return hass?.config?.unit_system?.temperature === '°F' ? 1 : 0.5
}

/** Decimal places a step implies (0.5 → 1, 1 → 0). */
export const stepDigits = (step: number): number =>
  step.toString().split('.')[1]?.length ?? 0

export interface BigNumberOptions {
  digits: number
  unit: string
  /** Show a sign for non-zero values (`+1.5`, `-1.0`). */
  signed?: boolean
}

/** Big centre number: integer large, unit superscript, decimals subscript. */
export const bigNumber = (
  hass: HomeAssistant | undefined,
  value: number | null | undefined,
  { digits, unit, signed = false }: BigNumberOptions
): TemplateResult => {
  if (value == null) {
    return html`<span class="big"><span class="int">—</span></span>`
  }
  const formatted = new Intl.NumberFormat(numberLocale(hass), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    ...(signed ? { signDisplay: 'exceptZero' as const } : {}),
  }).format(value)
  const integer = formatted.includes('.')
    ? formatted.split('.')[0]
    : formatted.split(',')[0]
  const decimal = formatted.slice(integer.length)

  return html`
    <span class="big">
      <span class="int">${integer}</span>
      <span class="addon">
        <span class="decimal">${decimal}</span>
        <span class="unit">${unit}</span>
      </span>
    </span>
  `
}
