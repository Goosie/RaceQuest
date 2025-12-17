import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 12000,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@grounded/core': resolve(__dirname, '../../packages/grounded-core/src'),
      '@grounded/nostr': resolve(__dirname, '../../packages/grounded-nostr/src'),
      '@grounded/geo': resolve(__dirname, '../../packages/grounded-geo/src'),
      '@grounded/rgb': resolve(__dirname, '../../packages/grounded-rgb/src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          nostr: ['nostr-tools']
        }
      }
    }
  },
  define: {
    global: 'globalThis'
  }
})