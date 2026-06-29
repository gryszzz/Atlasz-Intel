import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
function electronRuntimeEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  return env
}

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
          async onstart({ startup }) {
            await startup(undefined, { env: electronRuntimeEnv() })
          },
        },
        preload: {
          input: 'electron/preload.ts',
          vite: {
            build: {
              rolldownOptions: {
                output: {
                  format: 'cjs',
                  entryFileNames: '[name].cjs',
                  chunkFileNames: '[name].cjs',
                },
              },
            },
          },
        },
      })),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
}))
