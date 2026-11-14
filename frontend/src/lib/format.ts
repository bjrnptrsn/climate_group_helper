import type { HomeAssistant } from '../types'

/**
 * Locale for `Intl.NumberFormat`, honouring HA's number-format preference
 * (`hass.locale.number_format`), mirroring HA's `numberFormatToLocale()`.
 */
export const numberLocale = (
  hass?: HomeAssistant
): string | string[] | undefined => {
  const locale = hass?.locale
  if (!locale) return hass?.language
  switch (locale.number_format) {
    case 'comma_decimal':
      return ['en-US', 'en']
    case 'decimal_comma':
      return ['de', 'es', 'it']
    case 'space_comma':
      return ['fr', 'sv', 'cs']
    case 'quote_decimal':
      return ['de-CH']
    case 'system':
      return undefined
    default:
      return locale.language
  }
}

/**
 * Format a time-of-day value honouring HA's time-format preference
 * (`hass.locale.time_format`: 12 / 24 / system / language), mirroring HA's
 * `useAmPm()`: for `language`/`system` it sniffs whether the resolved locale
 * renders 22:00 as 12-hour rather than hardcoding a per-language table. The
 * sniff uses the raw language tag so `en-GB` resolves as its own 24-hour locale
 * instead of falling back to 12-hour `en`. `hourCycle: 'h23'` (not
 * `hour12: false`) keeps midnight as `00`, never `24`.
 */
export const formatTime = (
  date: Date | string | number,
  hass?: HomeAssistant,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = date instanceof Date ? date : new Date(date)
  const timeFormat = hass?.locale?.time_format
  const language = hass?.locale?.language ?? hass?.language
  const sniffLang = timeFormat === 'system' ? undefined : language
  const amPm =
    timeFormat === '12' ||
    ((timeFormat === 'language' || timeFormat === 'system' || !timeFormat) &&
      new Date('January 1, 2026 22:00:00')
        .toLocaleString(sniffLang)
        .includes('10'))
  try {
    return new Intl.DateTimeFormat(timeFormat === 'system' ? undefined : language, {
      hourCycle: amPm ? 'h12' : 'h23',
      ...options,
    }).format(d)
  } catch {
    return d.toLocaleTimeString()
  }
}

/**
 * A localized "elapsed time" of a whole number of minutes, in the largest
 * sensible unit (minutes < 60, hours < 24 h, else days) via `Intl` unit style.
 * Elapsed time **floors** — unlike the countdown's `remainingMinutes()`, which
 * ceilings — so 90 s reads "1 min", not "2 min". It never shows less than 1, so
 * a block that has just begun reads "1 min", not "0 min".
 *
 * The locale is the UI language, not `numberLocale()`: unit style renders the
 * unit *words*, which must match the surrounding sentence, while the number is
 * always a small integer the number format has nothing to act on.
 */
export const formatElapsedDuration = (
  minutes: number,
  hass?: HomeAssistant
): string => {
  const unit = minutes < 60 ? 'minute' : minutes < 1440 ? 'hour' : 'day'
  const value =
    unit === 'minute' ? minutes : unit === 'hour' ? minutes / 60 : minutes / 1440
  return new Intl.NumberFormat(hass?.locale?.language ?? hass?.language, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
  }).format(Math.max(1, Math.floor(value)))
}

/**
 * A member's target temperature as a short label: a single setpoint (`21 °C`)
 * or a range (`18–22 °C`). `undefined` when the entity has no target.
 */
export const formatTarget = (
  attrs: Record<string, unknown> | undefined,
  hass?: HomeAssistant
): string | undefined => {
  if (!attrs) return undefined
  const unit = (hass?.config?.unit_system?.temperature as string) ?? '°C'
  const fmt = (v: number) =>
    new Intl.NumberFormat(numberLocale(hass), {
      maximumFractionDigits: 1,
    }).format(v)
  const low = attrs.target_temp_low as number | undefined
  const high = attrs.target_temp_high as number | undefined
  if (low != null && high != null) return `${fmt(low)}–${fmt(high)} ${unit}`
  const target = attrs.temperature as number | undefined
  return target != null ? `${fmt(target)} ${unit}` : undefined
}

/**
 * A temperature offset with its sign and one decimal: `+1.5 °C`, or `+1.5°`
 * with `compact` for the member list, next to the member's own setpoint.
 * The unit comes from the same system setting as `formatTarget()` — the group
 * takes its `temperature_unit` from there too.
 */
export const formatOffset = (
  value: number,
  hass?: HomeAssistant,
  compact = false
): string => {
  const number = new Intl.NumberFormat(numberLocale(hass), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value)
  if (compact) return `${number}°`
  const unit = (hass?.config?.unit_system?.temperature as string) ?? '°C'
  return `${number} ${unit}`
}

/**
 * Whole minutes until an ISO timestamp, or `null` when it is missing, invalid
 * or already past. `Math.ceil` so an active countdown never reads `0`.
 */
export const remainingMinutes = (
  until: unknown,
  now: number = Date.now()
): number | null => {
  if (typeof until !== 'string') return null
  const ms = new Date(until).getTime() - now
  return ms > 0 ? Math.ceil(ms / 60000) : null
}
