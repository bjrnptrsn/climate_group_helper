import en, { TranslationKey } from './en'
import cs from './cs'
import da from './da'
import de from './de'
import es from './es'
import fi from './fi'
import fr from './fr'
import it from './it'
import nb from './nb'
import nl from './nl'
import pl from './pl'
import pt from './pt'
import sk from './sk'
import sv from './sv'
import tr from './tr'
import uk from './uk'
import zhHans from './zh-Hans'

export { en, cs, da, de, es, fi, fr, it, nb, nl, pl, pt, sk, sv, tr, uk, zhHans }
export type { TranslationKey }

// Keyed by the language part of `hass.locale.language` (see lib/i18n.ts), so
// `zh-Hans` is reached as `zh` — the only script-qualified file we ship.
export const translations: Record<string, Record<string, string>> = {
  en,
  cs,
  da,
  de,
  es,
  fi,
  fr,
  it,
  nb,
  nl,
  pl,
  pt,
  sk,
  sv,
  tr,
  uk,
  zh: zhHans,
}
