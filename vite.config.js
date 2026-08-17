import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteApiPlugin } from './vite-api-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
        }
      }
    }
  }
})

