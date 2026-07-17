import { expect, test } from "@playwright/test"

/**
 * E2E — inline navbar search (change `blog-nav-and-engagement`, task 4.5). On `md`+
 * the navbar hosts a REAL combobox field the user types into directly, opening a
 * results dropdown anchored below it; below `md` the field is hidden and the search
 * icon still opens the full-screen overlay.
 *
 * These specs run as a GUEST (no auth bootstrap), so they exercise the surface that
 * does not require a signed-in session: the field renders and accepts input, the
 * dropdown opens on a ≥ 2-char query showing the localized sign-in prompt (the BE
 * `search` is auth-gated, so no request fires), Esc closes the dropdown while keeping
 * the text, an outside click dismisses it, and the mobile icon opens the overlay.
 * Signed-in result navigation + keyboard activation are covered by the unit tests and
 * the auth-gated runtime pass on apitest.
 */

const isDesktop = (width: number) => width >= 768

test.describe("Inline navbar search — desktop (≥ md)", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || !isDesktop(viewport.width), "desktop-only surface")
    })

    test("renders a real combobox field in the header (not a press-to-open button)", async ({ page }) => {
        await page.goto("/")
        const field = page.locator("header").getByRole("combobox")
        await expect(field).toBeVisible()
        await expect(field).toBeEditable()
    })

    test("typing 2+ chars opens a dropdown; Esc closes it but keeps the text", async ({ page }) => {
        await page.goto("/")
        const field = page.locator("header").getByRole("combobox")

        await field.click()
        await field.fill("do")
        // guest → the dropdown opens with the localized sign-in prompt (no request fired)
        await expect(page.getByText(/sign in to search|đăng nhập để tìm kiếm/i)).toBeVisible()

        await field.press("Escape")
        await expect(page.getByText(/sign in to search|đăng nhập để tìm kiếm/i)).toBeHidden()
        // Esc keeps focus + query
        await expect(field).toBeFocused()
        await expect(field).toHaveValue("do")
    })

    test("clicking outside the field dismisses the dropdown", async ({ page }) => {
        await page.goto("/")
        const field = page.locator("header").getByRole("combobox")

        await field.click()
        await field.fill("react")
        await expect(page.getByText(/sign in to search|đăng nhập để tìm kiếm/i)).toBeVisible()

        // click well outside the header/dropdown
        await page.mouse.click(10, 400)
        await expect(page.getByText(/sign in to search|đăng nhập để tìm kiếm/i)).toBeHidden()
    })
})

test.describe("Inline navbar search — mobile (< md) keeps the overlay", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || isDesktop(viewport.width), "mobile-only surface")
    })

    test("no inline field is shown; the search icon opens the full-screen overlay", async ({ page }) => {
        await page.goto("/")

        // the inline field is hidden below md
        await expect(page.locator("header").getByRole("combobox")).toBeHidden()

        // the mobile search icon (aria-label localized "Search" / "Tìm kiếm") opens the overlay
        await page.locator("header").getByRole("button", { name: /search|tìm kiếm/i }).first().click()
        // the overlay is a full-screen sheet with its own focused combobox input
        const overlayInput = page.getByRole("combobox")
        await expect(overlayInput).toBeVisible()
        await expect(overlayInput).toBeFocused()
    })
})
