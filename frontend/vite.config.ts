import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Requests to /geoserver are forwarded to the GeoServer container.
 * The browser then only talks to one address (no CORS problems), in development and in preview.
 */
const geoserverProxy = Object.fromEntries([
	['/geoserver', { target: 'http://localhost:8080', changeOrigin: true }],
])

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	server: { proxy: geoserverProxy },
	preview: { proxy: geoserverProxy },
})
