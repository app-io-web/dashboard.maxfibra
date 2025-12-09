// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Todas as chamadas que começarem com /api ou /notifications vão para o backend
      '/api': {
        target: 'http://localhost:4200',
        changeOrigin: true,
        secure: false,
      },
      '/notifications': {
        target: 'http://localhost:4200',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})