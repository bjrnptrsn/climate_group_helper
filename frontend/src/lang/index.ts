import en, { TranslationKey } from './en'
import cs from './cs'
import da from './da'
import de from './de'
import el from './el'
import es from './es'
import fi from './fi'
import fr from './fr'
import hu from './hu'
import it from './it'
import nb from './nb'
import nl from './nl'
import pl from './pl'
import pt from './pt'
import ptBR from './pt-BR'
import ro from './ro'
import sk from './sk'
import sv from './sv'
import tr from './tr'
import uk from './uk'
import zhHans from './zh-Hans'
import zhHant from './zh-Hant'

export {
  en, cs, da, de, el, es, fi, fr, hu, it, nb, nl, pl, pt, ptBR, ro, sk, sv, tr, uk,
  zhHans, zhHant,
}
export type { TranslationKey }

// Keyed by the language part of `hass.locale.language` (see lib/i18n.ts), so
// `zh-Hans` is reached as `zh`. Two exceptions get their own key from
// `languageOf()`: Traditional Chinese (zh-Hant and its regions) and Brazilian
// Portuguese (pt-BR).
export const translations: Record<string, Record<string, string>> = {
  en,
  cs,
  da,
  de,
  el,
  es,
  fi,
  fr,
  hu,
  it,
  nb,
  nl,
  pl,
  pt,
  'pt-BR': ptBR,
  ro,
  sk,
  sv,
  tr,
  uk,
  zh: zhHans,
  'zh-Hant': zhHant,
}
