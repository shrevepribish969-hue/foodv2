import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ - deployed to github pages
export default defineConfig({
  base: '/foodv2/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@imgly/background-removal']
  },
  build: {
    rollupOptions: {
      external: ['onnxruntime-web/webgpu', 'onnxruntime-web']
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
})

