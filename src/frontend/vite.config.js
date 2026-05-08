import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // @mapbox/mapbox-gl-draw imports 'mapbox-gl' internally.
    // Alias it to maplibre-gl so no token is required.
    alias: {
      'mapbox-gl': 'maplibre-gl',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://musical-cuchufli-3cd9f8.netlify.app',
        changeOrigin: true,
      },
    },
  },
})
