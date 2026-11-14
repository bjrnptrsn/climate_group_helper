import { LitElement } from 'lit'
import { translations, type TranslationKey } from '../lang'
import type { HomeAssistant } from '../types'

export type { TranslationKey }

const languageOf = (locale?: string): string =>
  (locale ?? 'en').split('-')[0].toLowerCase()

/** Look up a translation for the given language, falling back to English. */
export const translate = (
  locale: string | undefined,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string => {
  const dict = translations[languageOf(locale)] ?? translations.en
  const template = dict[key] ?? translations.en[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  )
}

/** Look up a translation for a state value, falling back to the raw value. */
export const translateState = (
  hass: HomeAssistant | undefined,
  prefix: string,
  value: string | undefined
): string => {
  if (!value) return ''
  const key = `${prefix}.${value}`
  const locale = hass?.locale?.language ?? hass?.language
  return key in translations.en
    ? translate(locale, key as TranslationKey)
    : value
}

/**
 * What a climate entity is doing, localized. Falls back to the mode when no
 * `hvac_action` is reported (the group omits it while no member does) — the
 * mode has its own labels, so it must not be looked up among the actions.
 */
export const translateHvacAction = (
  hass: HomeAssistant | undefined,
  action: string | undefined,
  mode: string | undefined
): string =>
  action ? translateState(hass, 'action', action) : translateState(hass, 'mode', mode)

type LitConstructor = new (...args: any[]) => LitElement & {
  hass?: HomeAssistant
}

/** Adds `this.t(key, vars?)` to a LitElement, driven by `hass`/`hass.locale`. */
export function LocalizeMixin<T extends LitConstructor>(superClass: T) {
  return class extends superClass {
    protected t(
      key: TranslationKey,
      vars?: Record<string, string | number>
    ): string {
      const locale = this.hass?.locale?.language ?? this.hass?.language
      return translate(locale, key, vars)
    }
  }
}
