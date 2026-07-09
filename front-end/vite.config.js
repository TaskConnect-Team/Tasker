import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  // 1. FIXED: Changed from './' to '/' so assets always load from the root domain
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Splits vendor libraries from node_modules into separate chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'classic',
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3500000,
        importScripts: ['/firebase-messaging-sw.js'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'TaskConnect',
        short_name: 'TaskConnect',
        description: 'Smart Task Marketplace',
        theme_color: '#ffffff',
        gcm_sender_id: '305816675590',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
