import { test, expect, request as pwRequest } from "@playwright/test"
import { loginAs, fetchToken } from "./helpers/auth"

/**
 * E2E — course-freemium-paywall-enroll-fix (BE change, FE acceptance 7.2)
 *
 * Data: student.test@ftes.vn has NOT purchased the PACKAGE course
 * `goi-prf192prf193---nhap-mon-lap-trinh-cc` (PRF192).
 *
 *  - B-QUARTER: the course contract carries percent-derived preview windows
 *    (previewSeconds ≠ default 900 on some VIDEO lessons) and the detail page
 *    offers try-for-free.
 *  - B-QR (BE signal): POST /courses/{id}/enroll on a paid course → 409
 *    COURSE_REQUIRES_PURCHASE envelope (no enrollment row created).
 *  - B-QR (UI): buying a package resolves the for-course product → cart 200 →
 *    checkout → VietQR QR code renders, UI never dead-ends.
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const COURSE_SLUG = "goi-prf192prf193---nhap-mon-lap-trinh-cc"
const COURSE_UUID = "97307707-5fcc-4c39-8488-f5877bab72cd"

/** Remove every cart line so re-runs always exercise the add-to-cart POST. */
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

test.describe("course-freemium-paywall-enroll-fix", () => {
    test.setTimeout(120_000)

    test("PACKAGE course detail: try-for-free CTA + percent-derived preview windows", async ({ page }) => {
        await loginAs(page, "student")
        const courseRes = page.waitForResponse(
            (r) => r.url().includes(`/api/v1/courses/${COURSE_SLUG}`) && r.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto(`/vi/courses/${COURSE_SLUG}`)
        const body = await (await courseRes).json()
        const lessons = (body?.data?.sections ?? []).flatMap(
            (s: { lessons?: Array<Record<string, unknown>> }) => s.lessons ?? [],
        )
        expect(lessons.length).toBeGreaterThan(0)
        // B-TFF: a non-purchaser sees PREVIEW (not collapsed to NONE/locked-out)
        const previewable = lessons.filter((l: { accessLevel?: string }) => l.accessLevel === "PREVIEW")
        expect(previewable.length).toBeGreaterThan(0)
        // B-QUARTER: percent-config lessons expose a derived window (≠ 900s default)
        const percentWindows = lessons.filter(
            (l: { type?: string; previewSeconds?: number }) =>
                l.type === "VIDEO" && (l.previewSeconds ?? 0) > 0 && l.previewSeconds !== 900,
        )
        expect(percentWindows.length).toBeGreaterThan(0)

        // Try-for-free entry + the package buy CTA render (no hard lock)
        await expect(
            page.getByRole("button", { name: "Học thử miễn phí" }).first(),
        ).toBeVisible({ timeout: 60_000 })
        await expect(page.getByRole("button", { name: "Nhận gói này" })).toBeVisible()
    })

    test("BE: enroll paid course → 409 COURSE_REQUIRES_PURCHASE envelope", async () => {
        const token = await fetchToken("student")
        const ctx = await pwRequest.newContext({
            extraHTTPHeaders: { Authorization: `Bearer ${token}` },
        })
        try {
            const res = await ctx.post(`${API}/courses/${COURSE_UUID}/enroll`)
            expect(res.status()).toBe(409)
            const body = await res.json()
            expect(body?.data?.code).toBe("COURSE_REQUIRES_PURCHASE")
            expect(body?.data?.courseId).toBe(COURSE_UUID)
        } finally {
            await ctx.dispose()
        }
    })

    test("buy package → for-course resolve → cart 200 → checkout QR (UI not stuck)", async ({ page }) => {
        await clearCart()
        await loginAs(page, "student")

        const forCourseRes = page.waitForResponse(
            (r) =>
                r.url().includes(`/commerce/products/for-course/${COURSE_UUID}`) &&
                r.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto(`/vi/courses/${COURSE_SLUG}`)
        expect((await forCourseRes).status()).toBe(200)

        const buyBtn = page.getByRole("button", { name: "Nhận gói này" })
        await expect(buyBtn).toBeVisible({ timeout: 60_000 })
        // Wait for the session to hydrate (auth-guarded CTA) before pressing buy
        await expect(page.getByRole("button", { name: /student_test/ })).toBeVisible({
            timeout: 30_000,
        })

        // Default selection is the product-less FREE package → pick BASIC (has a
        // seeded product) and wait for its packageId-scoped for-course resolve.
        const basicResolve = page.waitForResponse(
            (r) =>
                r.url().includes(`/commerce/products/for-course/${COURSE_UUID}`) &&
                r.url().includes("packageId=dc5150d6-3a34-41a2-b96d-b6bb1ac10517") &&
                r.request().method() === "GET",
            { timeout: 30_000 },
        )
        await page.getByText("BASIC", { exact: true }).first().click()
        expect((await basicResolve).ok()).toBe(true)
        await expect(buyBtn).toBeEnabled({ timeout: 30_000 })

        const cartRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/cart/items") && r.request().method() === "POST",
            { timeout: 30_000 },
        )
        await buyBtn.click()
        expect((await cartRes).status()).toBe(200)

        // PaymentModal (VietQR default) opened — no dead-end
        const payModal = page.getByRole("dialog").filter({ hasText: "Thanh toán" })
        const payBtn = payModal.getByRole("button", { name: "Thanh toán", exact: true })
        await expect(payBtn).toBeVisible({ timeout: 15_000 })

        const checkoutRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/checkout") && r.request().method() === "POST",
            { timeout: 30_000 },
        )
        await payBtn.click()
        const checkout = await checkoutRes
        expect(checkout.status()).toBe(200)
        const checkoutBody = await checkout.json()
        expect(String(checkoutBody?.data?.qrCode ?? "")).not.toBe("")

        // QR view rendered (scan hint under the QR code)
        await expect(
            page.getByText("Quét mã QR bằng ứng dụng ngân hàng"),
        ).toBeVisible({ timeout: 15_000 })
    })

    test.afterAll(async () => {
        await clearCart()
    })
})
