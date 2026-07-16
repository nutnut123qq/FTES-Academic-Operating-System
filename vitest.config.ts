import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/**
 * Vitest config for FTES AOS FE unit tests.
 *
 * Scope is `src/**` only: Playwright owns the browser end-to-end specs under
 * `e2e/` (they import `@playwright/test` and must not be picked up by the unit
 * runner). The `@/*` alias mirrors `tsconfig.json` so hooks/components resolve
 * their imports, and the happy-dom environment lets React hooks render via
 * `@testing-library/react` (happy-dom is used over jsdom to keep the transitive
 * dependency surface small).
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    // Unit tests exercise hooks/logic, never rendered styles. Supply an inline
    // empty PostCSS config so Vite does NOT auto-discover the app's
    // `postcss.config.mjs` (Tailwind v4), which pulls in the optional
    // lightningcss native binary that isn't present in every environment.
    css: {
        postcss: {},
    },
    test: {
        environment: "happy-dom",
        globals: true,
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["e2e/**", "node_modules/**"],
    },
})
