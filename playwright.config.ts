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
    // These two drive the Admin CMS on :5173, which lives in a DIFFERENT repo
    // (FTES-AOS-Admin) — nothing in this checkout can serve it, so they can only ever
    // time out here. Run them from a workspace that has both apps.
    testIgnore: ["**/course-authoring-admin.spec.ts", "**/course-authoring-closed-loop.spec.ts"],
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
    // Serve the app ourselves so CI does not have to hand-roll a "wait for :3000" loop.
    // `next start` needs a prior `next build`; locally an already-running dev server is
    // reused instead. The login helper hard-codes cookie domain "localhost", so the
    // origin must stay localhost:3000 — pointing BASE_URL at a preview deploy silently
    // breaks auth (proxy.ts bounces /admin and /dashboard without the session cookie).
    webServer: {
        command: "npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
})
