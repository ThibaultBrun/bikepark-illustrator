import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl')) return 'maplibre'
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/vue-i18n') || id.includes('node_modules/@intlify')) return 'vendor'
          if (id.includes('node_modules/mapbox__togeojson') || id.includes('node_modules/@mapbox/togeojson')) return 'vendor'
          if (id.includes('node_modules/localforage')) return 'vendor'
        },
      },
    },
  },
})