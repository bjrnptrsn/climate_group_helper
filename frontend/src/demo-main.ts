// Entry point of `npm run dev` (index.html): the card in demo mode, without a
// running Home Assistant. Not part of the bundle — the library build starts at
// main.ts.
import './main'
import { ClimateGroupHelperCard } from './climate-group-helper-card'
import type { HomeAssistant } from './types'

// `?lang=de` picks a language; the browser's otherwise.
const language = new URLSearchParams(location.search).get('lang') ?? navigator.language
const dark = matchMedia('(prefers-color-scheme: dark)').matches

// Demo mode lays its own states, entity registry and a no-op `callService`
// over this, so the stub only carries what the card reads from HA itself.
const hass: HomeAssistant = {
  states: {},
  language,
  locale: { language },
  config: { unit_system: { temperature: '°C' } },
  themes: { darkMode: dark },
  callService: async () => undefined,
}

const card = document.createElement('climate-group-helper-card') as ClimateGroupHelperCard
// Without a group in `states`, the stub config is the demo (`demo: true`).
card.setConfig(ClimateGroupHelperCard.getStubConfig(hass, [], []))
card.hass = hass
document.querySelector('#card')!.append(card)
