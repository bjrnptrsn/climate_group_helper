// Entry point of `npm run dev` (index.html): the card in demo mode, without a
// running Home Assistant. Not part of the bundle — the library build starts at
// main.ts.
import './main'
import { ClimateGroupHelperCard } from './climate-group-helper-card'
import {
  DEMO_ENTITY,
  DEMO_TICK_MS,
  demoStates,
  isShowcaseTick,
} from './lib/demo'
import type { HassEntity, HomeAssistant } from './types'

const params = new URLSearchParams(location.search)
// `?lang=de` picks a language; the browser's otherwise.
const language = params.get('lang') ?? navigator.language
const dark = matchMedia('(prefers-color-scheme: dark)').matches

type Matcher = (states: Record<string, HassEntity>, attrs: Record<string, any>) => boolean

const STATE_MATCHERS: Record<string, Matcher> = {
  full: (states) => isShowcaseTick(states),
  boost: (_s, attrs) => !!attrs.boost_until,
  hold: (_s, attrs) => !!attrs.schedule_hold_until,
  window: (_s, attrs) => attrs.blocking_reason?.source === 'window',
  presence: (_s, attrs) => attrs.blocking_reason?.source === 'presence',
  switch: (_s, attrs) => attrs.blocking_reason?.source === 'switch',
  off: (states, attrs) => states[DEMO_ENTITY]?.state === 'off' && !attrs.blocking_reason,
  range: (_s, attrs) => attrs.target_temp_low != null,
  bypass: (_s, attrs) => attrs.active_schedule_layer === 'bypass',
  fallback: (_s, attrs) => attrs.active_schedule_layer === 'fallback',
  virtual_preset: (_s, attrs) => !!attrs.active_virtual_preset,
}

// `?now=<ms>` or `?state=<name>` freezes the demo on a matching tick — same
// technique as `Date.now = () => <timestamp>` in the browser console.
const nowParam = params.get('now')
const stateParam = params.get('state')
if (nowParam !== null && nowParam !== '' && Number.isFinite(Number(nowParam))) {
  const fixedNow = Number(nowParam)
  Date.now = () => fixedNow
} else if (stateParam) {
  const match = STATE_MATCHERS[stateParam]
  if (!match) {
    console.warn(
      `[demo] Unknown ?state=${stateParam}; expected one of ${Object.keys(STATE_MATCHERS).join(', ')}`
    )
  } else {
    const start = Math.ceil(Date.now() / DEMO_TICK_MS) * DEMO_TICK_MS
    let matched = false
    for (let i = 0; i < 2000; i++) {
      const candidate = start + i * DEMO_TICK_MS
      const states = demoStates(candidate, language)
      const attrs = states[DEMO_ENTITY]?.attributes ?? {}
      if (match(states, attrs)) {
        Date.now = () => candidate
        matched = true
        break
      }
    }
    if (!matched) {
      console.warn(`[demo] No tick matched ?state=${stateParam} within 2000 steps`)
    }
  }
}

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
