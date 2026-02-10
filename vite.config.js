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
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const normalized = id.replace(/\\/g, '/')

          // Keep React core and router together to avoid interop/order edge-cases.
          if (
            normalized.includes('/react/') ||
            normalized.includes('/react-dom/') ||
            normalized.includes('/scheduler/') ||
            normalized.includes('/react-router/')
          ) {
            return 'vendor-react'
          }

          if (normalized.includes('/@radix-ui/')) return 'vendor-radix'
          if (normalized.includes('/@tanstack/')) return 'vendor-tanstack'
          if (normalized.includes('/@tiptap/')) return 'vendor-editor'
          if (normalized.includes('/prosemirror-')) return 'vendor-editor-core'
          if (normalized.includes('/recharts/')) return 'vendor-charts'
          if (normalized.includes('/framer-motion/')) return 'vendor-motion'
          if (normalized.includes('/lucide-react/')) return 'vendor-icons'
          if (normalized.includes('/@supabase/')) return 'vendor-supabase'
          if (normalized.includes('/date-fns/')) return 'vendor-date'
          if (normalized.includes('/zod/')) return 'vendor-zod'
          if (normalized.includes('/@floating-ui/')) return 'vendor-floating-ui'
          if (normalized.includes('/@reduxjs/')) return 'vendor-redux'
          if (normalized.includes('/immer/')) return 'vendor-redux'
          if (normalized.includes('/es-toolkit/')) return 'vendor-redux'
          if (normalized.includes('/cmdk/')) return 'vendor-cmdk'
          if (normalized.includes('/sonner/')) return 'vendor-sonner'
          if (normalized.includes('/linkifyjs/')) return 'vendor-linkify'
          if (
            normalized.includes('/class-variance-authority/') ||
            normalized.includes('/clsx/') ||
            normalized.includes('/tailwind-merge/')
          ) {
            return 'vendor-ui-utils'
          }

          return 'vendor'
        },
      },
    },
  },
})
