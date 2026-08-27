import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Declared locally instead of pulling in `@types/node`, which would put `process` in scope
 * for application code too — where reading it would break in the browser. This file is a
 * module, so the declaration does not escape it.
 */
declare const process: { env: Record<string, string | undefined> }

/**
 * Vite's own default. Deliberately not 3000 — Multica runs there.
 * Override with `PORT=... npm run dev` if it clashes with something else.
 */
const DEV_PORT = Number(process.env.PORT) || 5173

export default defineConfig({
  server: { port: DEV_PORT },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})
