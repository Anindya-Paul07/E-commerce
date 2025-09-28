import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    include: [
      'src/__tests__/**/*.test.{js,jsx,ts,tsx}',
      'src/__tests__/**/*.spec.{js,jsx,ts,tsx}',
      'src/**/*.test.{js,jsx,ts,tsx}',
      'src/**/*.spec.{js,jsx,ts,tsx}',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true }
    }
  }
})
