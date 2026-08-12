import { expect, test, type Page } from "@playwright/test"

/**
 * E2E — global search entry points.
 *
 * REWRITTEN 2026-08-12. The original file (2026-07-16) pinned a design that was retired
 * the next day: it demanded a `role=combobox` you could type into sitting in the header,
 * plus an inline results dropdown. `7a9bcbb` turned that field into a BUTTON that opens a
 * centered command palette, and `fe41626` dropped the "sign in to search" branch — so the
 * spec had been red for weeks while the product was working as intended. What follows
 * asserts today's contract: the header advertises the shortcut, and all typing happens
 * inside the palette.
 *
 * Guest surface, no auth and no backend — everything here is DOM the shell renders on its
 * own. The typed query is kept to ONE character on purpose: `SEARCH_MIN_CHARS` is 2
 * (`useGlobalSearch`), so no request is ever issued, which is what keeps this spec in the
 * credential-free nightly smoke set.
 *
 * Anchors are product contract, not test-only hooks: `data-tour="global-search"` is the
 * onboarding tour's spotlight target, and `data-search-overlay` is what the navbar's
 * Ctrl+K handler reads to avoid stacking the palette over another overlay.
 */

const isDesktop = (width: number) => width >= 768

/** Accessible name of every search affordance — i18n `search.label` (vi default, en fallback). */
const SEARCH_NAME = /^(Tìm kiếm|Search)$/

/** Palette input placeholder — i18n `search.placeholder`. */
const SEARCH_PLACEHOLDER = /^(Tìm khóa học|Search courses)/

/** The onboarding anchor wrapping BOTH affordances (desktop field + mobile icon). */
const searchAnchor = (page: Page) => page.locator("[data-tour=\"global-search\"]")

/**
 * The desktop field-shaped trigger, told apart from the mobile icon by the shortcut hint
 * it carries. Matched on TEXT rather than a `<kbd>` element: the hint comes from HeroUI's
 * `Kbd`, whose rendered tag is an implementation detail we should not pin.
 */
const fieldTrigger = (page: Page) =>
    searchAnchor(page).getByRole("button", { name: SEARCH_NAME }).filter({ hasText: /Ctrl/ })

/** Whichever affordance this viewport actually shows (field on `md`+, icon below). */
const visibleTrigger = (page: Page) =>
    searchAnchor(page).getByRole("button", { name: SEARCH_NAME }).filter({ visible: true })

/** The command palette dialog. */
const palette = (page: Page) => page.locator("[data-search-overlay]")

/** Its search box (aria `combobox`, labelled by `search.label`). */
const paletteInput = (page: Page) => palette(page).getByRole("combobox", { name: SEARCH_NAME })

const openHome = async (page: Page) => {
    await page.goto("/")
    await expect(visibleTrigger(page)).toBeVisible()
}

test.describe("Global search — desktop trigger (≥ md)", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || !isDesktop(viewport.width), "desktop-only surface")
    })

    test("header hosts a field-shaped trigger advertising Ctrl+K, not a typing field", async ({ page }) => {
        await openHome(page)

        await expect(fieldTrigger(page)).toBeVisible()
        // the hint is the only discovery path for the shortcut
        await expect(fieldTrigger(page)).toContainText("Ctrl")
        await expect(fieldTrigger(page)).toContainText("K")

        // the header owns NO editable search field any more — typing happens in the
        // palette. This is the exact inversion of the retired inline-dropdown design.
        await expect(page.locator("header").first().getByRole("combobox")).toHaveCount(0)
    })

    test("pressing the trigger opens the palette with its input focused and empty", async ({ page }) => {
        await openHome(page)
        await fieldTrigger(page).click()

        await expect(palette(page)).toBeVisible()

        const input = paletteInput(page)
        await expect(input).toBeVisible()
        await expect(input).toBeFocused()
        await expect(input).toHaveValue("")
        await expect(input).toHaveAttribute("placeholder", SEARCH_PLACEHOLDER)
    })

    test("typing lands in the palette; Esc closes it and the query does not survive", async ({ page }) => {
        await openHome(page)
        await fieldTrigger(page).click()
        await expect(paletteInput(page)).toBeFocused()

        // ONE character on purpose: SEARCH_MIN_CHARS is 2, so nothing is fetched and this
        // spec stays backend-free
        await page.keyboard.type("d")
        await expect(paletteInput(page)).toHaveValue("d")

        await page.keyboard.press("Escape")
        await expect(palette(page)).toBeHidden()

        // closing dispatches clearSearchQuery, so it always reopens empty — the retired
        // inline field kept its text, the palette deliberately does not
        await fieldTrigger(page).click()
        await expect(paletteInput(page)).toHaveValue("")
    })

    test("Ctrl/Cmd+K opens the palette without touching the trigger", async ({ page }) => {
        await openHome(page)

        // the shortcut is a window listener registered on hydration; retry so a keystroke
        // that lands pre-hydration cannot flake the run
        await expect(async () => {
            await page.keyboard.press("ControlOrMeta+k")
            await expect(palette(page)).toBeVisible({ timeout: 1_000 })
        }).toPass({ timeout: 15_000 })

        await expect(paletteInput(page)).toBeFocused()
    })
})

test.describe("Global search — mobile (< md) opens the same palette", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || isDesktop(viewport.width), "mobile-only surface")
    })

    test("the field trigger is hidden; the search icon opens the same palette", async ({ page }) => {
        await openHome(page)

        // below md the navbar hides the field (still in the DOM: `hidden md:flex`)
        await expect(fieldTrigger(page)).toBeHidden()

        await visibleTrigger(page).click()

        await expect(palette(page)).toBeVisible()
        await expect(paletteInput(page)).toBeFocused()
    })
})
