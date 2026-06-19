import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'web'
      ? []
      : await electron({
        main: {
          entry: {
            main: 'electron/main.ts',
            marketIngestionWorker: 'electron/workers/marketIngestionWorker.ts',
          },
        },
        preload: {
          input: 'electron/preload.ts',
        },
      })),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
}))
