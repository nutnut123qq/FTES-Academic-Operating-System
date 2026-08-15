import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — lecturer-only "Khoá tôi dạy" account-menu entry (change
 * `lecturer-teaching-nav-link`, task 2.3 runtime pass). The link is gated on the
 * `ai.teacher.use` permission (hydrated from the real `me` query):
 *
 *  - instructor.test (LECTURER, holds the permission) → sees the menu item, and it
 *    routes to `/courses/teaching`.
 *  - student.test (no permission) → the item is absent while the ungated "Bảng điều
 *    khiển" row still renders (proves the authed menu resolved).
 *
 * The anchor row is "Bảng điều khiển", not "Khóa học của tôi": that row was dropped from
 * this menu once the dashboard Courses tab covered it (2026-08-15).
 *
 * Desktop project only — the account dropdown is the desktop surface.
 */

test.setTimeout(120_000)

/**
 * Opens the navbar account dropdown. The avatar trigger is the only header
 * button that is `rounded-full` WITHOUT an aria-label (cart is labeled).
 */
const openAccountMenu = async (page: Page) => {
    const trigger = page.locator("header button.rounded-full:not([aria-label])").first()
    await expect(trigger).toBeVisible({ timeout: 30_000 })
    await trigger.click()
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 15_000 })
}

test.describe("Lecturer teaching nav link — permission-gated menu entry", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || viewport.width < 768, "desktop project only")
    })

    test("instructor.test sees 'Khoá tôi dạy' and it navigates to /courses/teaching", async ({ page }) => {
        await loginAs(page, "lecturer")
        await page.goto("/vi")
        await openAccountMenu(page)

        // wait until the authed menu is fully resolved (dashboard row present)
        const menu = page.getByRole("menu")
        await expect(
            menu.getByRole("menuitem", { name: "Bảng điều khiển" }),
        ).toBeVisible({ timeout: 30_000 })

        const teaching = menu.getByRole("menuitem", { name: "Khoá tôi dạy" })
        await expect(teaching).toBeVisible({ timeout: 30_000 })

        await teaching.click()
        await expect(page).toHaveURL(/\/courses\/teaching/, { timeout: 30_000 })
    })

    test("student.test does NOT see 'Khoá tôi dạy' (but sees 'Bảng điều khiển')", async ({ page }) => {
        await loginAs(page, "student")
        await page.goto("/vi")
        await openAccountMenu(page)

        const menu = page.getByRole("menu")
        // authed menu resolved: the ungated row is there…
        await expect(
            menu.getByRole("menuitem", { name: "Bảng điều khiển" }),
        ).toBeVisible({ timeout: 30_000 })
        // …but the permission-gated teaching row is not rendered at all
        await expect(
            menu.getByRole("menuitem", { name: "Khoá tôi dạy" }),
        ).toHaveCount(0)
    })
})
