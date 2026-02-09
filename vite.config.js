import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 Vite plugin
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'react-core'
            if (id.includes('@radix-ui')) return 'radix'
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('zod') || id.includes('@hookform/resolvers') || id.includes('react-hook-form')) return 'forms'
            if (id.includes('recharts')) return 'charts'
            if (id.includes('@tiptap')) return 'editor'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('@tanstack/react-query')) return 'react-query'
            if (id.includes('framer-motion')) return 'motion'
            return 'vendor'
          }
        },
      },
    },
  },
})
