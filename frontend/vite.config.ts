import { defineConfig } from 'vitest/config'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],
  test: {
    environment: 'happy-dom',
  },
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['iife'],
      name: 'ClimateGroupHelperCard',
      fileName: () => 'climate-group-helper-card.js',
    },
    // Ships with the integration: HA loads the card from the integration's own
    // directory, so the bundle must land there.
    outDir: '../custom_components/climate_group_helper/www',
    emptyOutDir: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
})
