import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  server: {
    port: 5175,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Strip console.log and debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', '@radix-ui/react-slot'],
          'vendor-data': ['pocketbase', 'zod'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Warn on large chunks
    chunkSizeWarningLimit: 500,
  },
}));
