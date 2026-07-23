import { test, expect, request as pwRequest } from "@playwright/test"
import { loginAs, fetchToken } from "./helpers/auth"

/**
 * E2E — fix-course-purchase-product-resolve (FE change, tasks 2.4/2.5)
 *
 *  - Success path (2.5, was data-blocked): WED201c (LEGACY, has a COURSE_UNLOCK
 *    product, student NOT enrolled) → "Đăng ký học" resolves the wrapped
 *    `{products, cheapest}` shape to a concrete productId → POST cart 200 →
 *    PaymentModal opens (no 400 from posting a missing/id-less product).
 *  - Guard path (2.4): a package whose for-course?packageId resolve yields no
 *    product (PRF192 "FREE" package) → buy CTA disabled, no doomed cart POST.
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const PAID_SLUG = "wed201c-web-design-for-everyone-with-github-zoom"
const PAID_UUID = "cc8f6fcc-aad6-4b64-b528-b255d07ccd2b"
/** PRF192 — PACKAGE course whose "FREE" package has no COURSE_UNLOCK product seeded. */
const NO_PRODUCT_PKG_SLUG = "goi-prf192prf193---nhap-mon-lap-trinh-cc"
const NO_PRODUCT_PKG_COURSE_UUID = "97307707-5fcc-4c39-8488-f5877bab72cd"
const NO_PRODUCT_PKG_ID = "6885f0fc-a663-42a1-9926-5dea17c90a08"

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

test.describe("fix-course-purchase-product-resolve", () => {
    test.setTimeout(120_000)

    test("paid course with product, not enrolled: Mua → cart POST 200 → PaymentModal", async ({ page }) => {
        await clearCart()
        await loginAs(page, "student")

        const forCourseRes = page.waitForResponse(
            (r) =>
                r.url().includes(`/commerce/products/for-course/${PAID_UUID}`) &&
                r.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto(`/vi/courses/${PAID_SLUG}`)
        const forCourse = (await (await forCourseRes).json())?.data
        // wrapped shape confirmed: products[] carries the id the cart needs
        expect((forCourse?.products ?? []).length).toBeGreaterThan(0)

        const enrollBtn = page.getByRole("button", { name: "Đăng ký học" })
        await expect(enrollBtn).toBeVisible({ timeout: 60_000 })
        await expect(enrollBtn).toBeEnabled({ timeout: 30_000 })
        // The enroll CTA is auth-guarded via redux (`keycloak.authenticated`) — wait
        // for the session to hydrate (navbar avatar) or the click opens the login modal.
        await expect(page.getByRole("button", { name: /student_test/ })).toBeVisible({
            timeout: 30_000,
        })

        const cartRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/cart/items") && r.request().method() === "POST",
            { timeout: 30_000 },
        )
        await enrollBtn.click()
        const cart = await cartRes
        expect(cart.status()).toBe(200)

        const payModal = page.getByRole("dialog").filter({ hasText: "Thanh toán" })
        await expect(payModal.getByRole("button", { name: "Thanh toán", exact: true })).toBeVisible({
            timeout: 15_000,
        })
    })

    test("package with no seeded product: buy CTA disabled, no doomed cart POST", async ({ page }) => {
        // apitest data: PRF192's "FREE" package has NO COURSE_UNLOCK product seeded
        // (courses that lack a product entirely are all ones this account already
        // owns, so the per-package resolve is the reachable no-product path).
        await loginAs(page, "student")
        let cartPosted = false
        page.on("request", (req) => {
            if (req.url().endsWith("/commerce/cart/items") && req.method() === "POST") {
                cartPosted = true
            }
        })
        // "FREE" is the picker's DEFAULT selection (sortOrder-first), so its
        // packageId-scoped resolve fires on load — register the wait before goto.
        const resolveRes = page.waitForResponse(
            (r) =>
                r.url().includes(`/commerce/products/for-course/${NO_PRODUCT_PKG_COURSE_UUID}`) &&
                r.url().includes(`packageId=${NO_PRODUCT_PKG_ID}`) &&
                r.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto(`/vi/courses/${NO_PRODUCT_PKG_SLUG}`)
        expect((await resolveRes).ok()).toBe(true)

        const buyBtn = page.getByRole("button", { name: "Nhận gói này" })
        await expect(buyBtn).toBeVisible({ timeout: 60_000 })
        // No product for this package → the buy CTA must stay disabled (was a 400 before)
        await expect(buyBtn).toBeDisabled({ timeout: 30_000 })
        expect(cartPosted).toBe(false)
    })

    test.afterAll(async () => {
        await clearCart()
    })
})
