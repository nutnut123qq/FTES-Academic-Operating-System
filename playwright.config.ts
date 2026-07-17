import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright config for FTES AOS FE end-to-end tests.
 *
 * `BASE_URL` targets a running app (defaults to the local dev server on :3000).
 * Two projects exercise the responsive shell: `desktop` (≥ md — HeaderNav row)
 * and `mobile` (< md — hamburger drawer), so nav specs can assert both surfaces
 * from the single shared `useAppNav` source.
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: "list",
    use: {
        baseURL: process.env.BASE_URL ?? "http://localhost:3000",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "desktop",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "mobile",
            use: { ...devices["Pixel 7"] },
        },
    ],
})
