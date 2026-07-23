import { test, expect, request as pwRequest } from "@playwright/test"
import { loginAs, fetchToken } from "./helpers/auth"

/**
 * E2E — learn-paywall-works-on-legacy-course (FE change, task 3.4)
 *
 * Data: student.test@ftes.vn has NOT purchased LEGACY course WED201c — every
 * lesson is `locked: true, accessLevel: PREVIEW` for this viewer.
 *
 *  - Opening a PREVIEW lesson in /learn shows the title UNCOVERED (the teaser
 *    fade only draws when there is a teaser body — no white streak over the
 *    header when the teaser is empty).
 *  - The paywall CTA opens PackageGateModal; a LEGACY course has no packages so
 *    the WholeCourseGateCard offers the COURSE_UNLOCK product; buying runs
 *    cart → PaymentModal (VietQR).
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const COURSE_SLUG = "wed201c-web-design-for-everyone-with-github-zoom"
const MODULE_ID = "bac5fe4d-7dc3-4a09-9bcb-43cf5d497d0d"
/** "Buổi 1" — VIDEO lesson, PREVIEW for student (exercises the LessonReader copy of the fix). */
const LESSON_ID = "dcac24a3-9f84-4815-b409-c66e82c8e228"

const clearCart = async (): Promise<void> => {
    const token = await fetchToken("student")
    const ctx = await pwRequest.newContext({
        extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    try {
        const res = await ctx.get(`${API}/commerce/cart`)
        const items = (await res.json())?.data?.items ?? []
        for (const item of items) {
            await ctx.delete(`${API}/commerce/cart/items/${item.id}`)
        }
    } finally {
        await ctx.dispose()
    }
}

test.describe("learn-paywall-works-on-legacy-course", () => {
    test.setTimeout(120_000)

    test("PREVIEW lesson on a LEGACY course: no white streak, paywall → PaymentModal", async ({ page }) => {
        await clearCart()
        await loginAs(page, "student")
        await page.goto(
            `/vi/courses/${COURSE_SLUG}/learn/content/modules/${MODULE_ID}/contents/${LESSON_ID}`,
        )

        // Lesson header renders and is readable (the old bug drew an h-72 gradient
        // upward over the title when the teaser body was empty)
        await expect(page.getByRole("heading", { name: "Buổi 1" })).toBeVisible({
            timeout: 60_000,
        })
        await expect(page.getByText("Bạn đang xem bản học thử")).toBeVisible({ timeout: 30_000 })

        // Regression guard: the teaser fade may exist ONLY when the article has body text
        const fade = await page.evaluate(() => {
            const article = document.getElementById("lesson-article")
            const textLen = (article?.textContent ?? "").trim().length
            const fadeCount = document.querySelectorAll(
                'div[class*="bg-gradient-to-b"][class*="from-transparent"]',
            ).length
            return { textLen, fadeCount }
        })
        expect(fade.fadeCount === 0 || fade.textLen > 0).toBe(true)

        // Paywall CTA → PackageGateModal → LEGACY fallback = whole-course offer
        await page.getByRole("button", { name: "Đăng ký khóa học" }).first().click()
        const dialog = page.getByRole("dialog")
        await expect(dialog.getByText("Trọn khóa")).toBeVisible({ timeout: 30_000 })
        const buyBtn = dialog.getByRole("button", { name: "Đăng ký học" })
        await expect(buyBtn).toBeVisible()
        await expect(buyBtn).toBeEnabled({ timeout: 30_000 })

        const cartRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/cart/items") && r.request().method() === "POST",
            { timeout: 30_000 },
        )
        await buyBtn.click()
        expect((await cartRes).status()).toBe(200)

        // PaymentModal opened (checkout summary + pay CTA) — no dead-end
        const payModal = page.getByRole("dialog").filter({ hasText: "Thanh toán" })
        await expect(payModal.getByRole("button", { name: "Thanh toán", exact: true })).toBeVisible({
            timeout: 15_000,
        })
        await expect(payModal.getByText("399.000₫").first()).toBeVisible()
    })

    test.afterAll(async () => {
        await clearCart()
    })
})
