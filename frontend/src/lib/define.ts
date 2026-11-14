/**
 * Registration that tolerates the bundle being executed twice (a reload of the
 * integration hands the frontend a new bundle URL while the page keeps the old
 * definitions) — without touching the global registry.
 *
 * Never wrap or replace `customElements.define` itself: HA's scoped-registry
 * polyfill swaps `window.customElements` and adopts whatever `define` it finds
 * as the native one, so a wrapper breaks the registration of HA's own elements
 * and the frontend hangs on its loading screen.
 */

// HA loads this bundle in parallel with its own app, whose registry polyfill
// replaces `window.customElements` with a registry that keeps its own table of
// definitions. An element defined before that swap is invisible to it, and HA
// reports the card as missing. Inside HA (its root element is already in the
// page) wait until HA has defined that root — the polyfill is in place by then;
// anywhere else, define right away.
const haReady: Promise<unknown> | undefined =
  document.querySelector('home-assistant') && !customElements.get('home-assistant')
    ? customElements.whenDefined('home-assistant')
    : undefined

const define = (name: string, cls: CustomElementConstructor): void => {
  // Read `customElements` at call time: after the wait it is HA's registry.
  if (!customElements.get(name)) customElements.define(name, cls)
}

/** Class decorator like Lit's `@customElement`: waits for HA, no-op when defined. */
export const customElement =
  (name: string) =>
  <T extends CustomElementConstructor>(cls: T): void => {
    if (haReady) void haReady.then(() => define(name, cls))
    else define(name, cls)
  }

export interface CustomCardEntry {
  type: string
  name: string
  description?: string
  preview?: boolean
}

/** Add the card to HA's card picker once, however often the bundle runs. */
export const registerCustomCard = (card: CustomCardEntry): void => {
  window.customCards = window.customCards || []
  if (!window.customCards.some((entry) => entry.type === card.type)) {
    window.customCards.push(card)
  }
}
