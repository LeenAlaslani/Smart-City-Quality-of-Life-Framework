import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No backend: this is a pure client-side concept app.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5178, host: true },
})
