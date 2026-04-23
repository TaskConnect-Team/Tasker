import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    ssr: 'src/entry-server.jsx', // Specify server entry point
    rollupOptions: {
      input: {
        client: 'src/entry-client.jsx', // Specify client entry point
        server: 'src/entry-server.jsx',
      },
    },
  },

})
