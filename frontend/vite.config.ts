import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // @/ maps to src/ — use this everywhere instead of relative paths
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    // Proxy all /api calls to the FastAPI backend during development
    // This avoids CORS issues in dev and mirrors the production nginx setup
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Output directory for production build
    outDir: 'dist',
    // Generate source maps for production debugging
    sourcemap: false,
    // Rollup chunk size warning threshold (in kB)
    chunkSizeWarningLimit: 1000,
  },

  // Environment variable prefix — only VITE_ prefixed vars are exposed to the client
  envPrefix: 'VITE_',
})
