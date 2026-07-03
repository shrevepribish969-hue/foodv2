import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ - deployed to github pages
export default defineConfig({
  // Trigger clean Actions build to reset multiple page artifacts
  base: '/foodv2/',
  plugins: [react()]
})

