import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',   // SPA with history routing — absolute asset paths + preview/host SPA fallback
  server: {
    port: 5190,
    host: true,
    proxy: {
      // Frontend calls /api/* which is proxied to the Python inference service.
      '/api': { target: 'http://127.0.0.1:8600', changeOrigin: true },
    },
  },
  preview: {
    port: 5191,
    host: true,
    proxy: { '/api': { target: 'http://127.0.0.1:8600', changeOrigin: true } },
  },
})
