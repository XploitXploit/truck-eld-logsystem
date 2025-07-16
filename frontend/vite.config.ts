import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://trucking-eld-backend:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      'truck-eld.fpellerano.com',
    ],
    hmr: {
          host: 'truck-eld.fpellerano.com',
          port: 3000,
          protocol: 'wss' // Use secure WebSocket if HTTPS
        },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})