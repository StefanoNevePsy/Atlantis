import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path depends on build target:
// - GitHub Pages needs '/Atlantis/' prefix
// - Capacitor & Electron load from local files, need './' (relative)
const base = process.env.BUILD_TARGET === 'native' ? './' : '/Atlantis/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
