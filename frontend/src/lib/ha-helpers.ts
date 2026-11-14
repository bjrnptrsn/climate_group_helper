/**
 * Force Home Assistant's lazily-registered form components (`ha-entity-picker`,
 * …) to load before the card editor renders them. Without this the picker tag
 * is unknown and renders empty. Best-effort: failures only log.
 *
 * Ported from the sister project's `preloadHaComponents()`.
 */
export async function preloadHaComponents(): Promise<void> {
  if (customElements.get('ha-entity-picker')) return

  try {
    const loadHelpers = (window as unknown as { loadCardHelpers?: () => Promise<any> })
      .loadCardHelpers
    if (loadHelpers) {
      const helpers = await loadHelpers()
      const card = await helpers?.createCardElement?.({
        type: 'entities',
        entities: [],
      })
      await (card as { getConfigElement?: () => Promise<unknown> })?.getConfigElement?.()
      if (!customElements.get('ha-entity-picker') && helpers?.createRowElement) {
        const row = await helpers.createRowElement({ type: 'attribute' })
        await (row as { getConfigElement?: () => Promise<unknown> })?.getConfigElement?.()
      }
    }

    if (!customElements.get('ha-entity-picker')) {
      const glance = customElements.get('hui-glance-card') as
        | { getConfigElement?: () => Promise<unknown> }
        | undefined
      await glance?.getConfigElement?.()
    }
  } catch (err) {
    console.warn('[climate-group-helper-card] Failed to preload HA form components:', err)
  }
}
