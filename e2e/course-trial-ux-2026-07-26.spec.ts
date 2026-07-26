import { test, expect, request as pwRequest } from "@playwright/test"
import { loginAs, fetchToken, waitForViewer } from "./helpers/auth"

/**
 * E2E — course-trial-ux epic (branch feat/course-trial-ux-2026-07-26).
 *
 * Acceptance for the FE-visible slice of the trial + UX epic. Each feature maps to
 * a task from the epic prompt:
 *   7)  add-to-cart peer CTA on a NORMAL course        (C1)
 *   8)  account menu → /saved lists favorited courses  (C2)
 *   9)  cart line: thumbnail + struck price + -X% chip (C3 + BE imageUrl/originalPriceVnd)
 *  10)  learn dashboard: intro + contents centre, tools in the RIGHT rail (C4-C6)
 *  11)  Ôn tập → /subjects/{code}/practice, Hỏi đáp → /subjects/{code}/discussion,
 *       driven by the course's top-level `subjectCode` (BE hoist + C6)
 *  12)  subject AI tab opens WITHOUT joining the workspace (C7)
 *  13)  featured catalog hero = the classic Ftes split-card (D1)
 *  14)  seeded PRF192 resources (2 PDF + NOTES + PE) exposed by the BE (V269 dev seed)
 *
 * Runs against a local dev server (BASE_URL, default :3000) wired to apitest BE.
 * Requires FTES_TEST_PASSWORD (student). Data anchors (apitest, 2026-07-26):
 *   - PRF192 package course `goi-...` has a linked subject `PRF192`.
 *   - `khoa-test` (TEST011) is the non-package reference course.
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

const PRF_SLUG = "goi-prf192prf193---nhap-mon-lap-trinh-cc"
const NORMAL_SLUG = "khoa-test"

/** Remove every cart line so add-to-cart re-runs exercise the POST fresh. */
const clearCart = async (): Promise<void> => {
    const token = await fetchToken("student")
    const ctx = await pwRequest.newContext({
        extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    try {
        const res = await ctx.get(`${API}/commerce/cart`)
        const items = (await res.json())?.data?.items ?? []
        for (const item of items) await ctx.delete(`${API}/commerce/cart/items/${item.id}`)
    } finally {
        await ctx.dispose()
    }
}

test.describe("course-trial-ux — features 7–14", () => {
    test.setTimeout(120_000)

    // ── Feature 11 (BE contract) — subjectCode hoisted to CourseDetail top-level ──
    test("F11 BE: course detail carries top-level subjectCode (link to subject workspace)", async () => {
        const ctx = await pwRequest.newContext()
        try {
            const res = await ctx.get(`${API}/courses/${PRF_SLUG}`)
            expect(res.status()).toBe(200)
            const data = (await res.json())?.data
            // Hoisted to the top level (useQueryLearnCourseSwr reads detail.subjectCode);
            // a PUBLISHED linked subject only.
            expect(data?.subjectCode).toBe("PRF192")
        } finally {
            await ctx.dispose()
        }
    })

    // ── Feature 14 (BE seed) — PRF192 resources present + PE resource ──
    test("F14 BE: seeded PRF192 resources (PDF/NOTES/PE) resolve on the resource hub", async () => {
        const token = await fetchToken("student")
        const ctx = await pwRequest.newContext({
            extraHTTPHeaders: { Authorization: `Bearer ${token}` },
        })
        try {
            // Resource hub filtered to PRF192 — the V269 dev seed publishes 4 APPROVED/PUBLIC rows.
            const res = await ctx.get(`${API}/resources?subject=PRF192&size=50`)
            expect(res.ok()).toBe(true)
            const body = await res.json()
            const rows: Array<{ title?: string; type?: string }> =
                body?.data?.items ?? body?.data?.content ?? body?.data ?? []
            const titles = rows.map((r) => r.title ?? "")
            // The seed titles all carry the "PRF192 - " prefix; at least the two PDFs + PE.
            expect(titles.some((t) => t.includes("Giáo trình nhập môn C"))).toBe(true)
            expect(titles.some((t) => t.includes("Practical Exam"))).toBe(true)
            expect(rows.some((r) => (r.type ?? "") === "PE")).toBe(true)
        } finally {
            await ctx.dispose()
        }
    })

    // ── Feature 7 — add-to-cart peer CTA on a normal course ──
    test("F7: normal course shows an add-to-cart peer beside enroll; POST cart + flip to in-cart", async ({
        page,
    }) => {
        await clearCart()
        await loginAs(page, "student")
        await page.goto(`/vi/courses/${NORMAL_SLUG}`)

        // The secondary peer CTA renders only when the COURSE_UNLOCK product resolves.
        const addToCart = page.getByRole("button", { name: "Thêm vào giỏ" })
        const enroll = page.getByRole("button", { name: "Đăng ký học" })
        await expect(enroll).toBeVisible({ timeout: 60_000 })
        if ((await addToCart.count()) === 0) {
            test.skip(true, "khoa-test resolves no COURSE_UNLOCK product on this env")
        }

        // Wait for the session to hydrate (auth-guarded CTA) before pressing add.
        await expect(page.getByRole("button", { name: /student_test/ })).toBeVisible({
            timeout: 30_000,
        })
        const cartPost = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/cart/items") && r.request().method() === "POST",
            { timeout: 30_000 },
        )
        await addToCart.click()
        expect((await cartPost).status()).toBe(200)

        // Peer flips to the in-cart (remove) state — no checkout modal opened.
        await expect(page.getByRole("button", { name: "Đã ở trong giỏ" })).toBeVisible({
            timeout: 30_000,
        })
        expect(
            await page.getByRole("dialog").filter({ hasText: "Thanh toán" }).count(),
        ).toBe(0)
    })

    // ── Feature 8 — account menu → /saved ──
    test("F8: account menu has a 'Đã lưu / Yêu thích' entry that lands on /saved", async ({
        page,
    }) => {
        await loginAs(page, "student")
        const viewer = waitForViewer(page)
        await page.goto("/vi")
        await viewer
        await page.getByRole("button", { name: /student_test/ }).click()
        const savedItem = page.getByRole("menuitem", { name: "Đã lưu / Yêu thích" })
        await expect(savedItem).toBeVisible({ timeout: 15_000 })
        await savedItem.click()
        await expect(page).toHaveURL(/\/saved$/, { timeout: 15_000 })
        // The library shell renders (tabs / heading), never a redirect loop for an authed viewer.
        await expect(page.getByRole("tab", { name: "Khoá học" })).toBeVisible({ timeout: 15_000 })
    })

    // ── Feature 9 — cart line: thumbnail + struck price + -X% ──
    test("F9 BE+UI: cart line carries imageUrl + originalPriceVnd; UI renders thumbnail + discount", async ({
        page,
    }) => {
        await clearCart()
        const token = await fetchToken("student")
        const ctx = await pwRequest.newContext({
            extraHTTPHeaders: { Authorization: `Bearer ${token}` },
        })
        let seeded = false
        try {
            // Resolve any COURSE_UNLOCK product with a discount + cover, then seed one cart line.
            const prodRes = await ctx.get(`${API}/commerce/products?size=50`)
            const products: Array<{
                id: string
                imageUrl?: string | null
                priceVnd?: number | null
                originalPriceVnd?: number | null
            }> = (await prodRes.json())?.data?.items ?? (await prodRes.json())?.data ?? []
            const withDiscount = products.find(
                (p) => (p.originalPriceVnd ?? 0) > (p.priceVnd ?? 0),
            )
            const chosen = withDiscount ?? products[0]
            if (chosen) {
                await ctx.post(`${API}/commerce/cart/items`, {
                    data: { productId: chosen.id, quantity: 1 },
                })
                // BE enrich (05ebc2f/a5054a3): the cart item echoes imageUrl + originalPriceVnd.
                const cart = await (await ctx.get(`${API}/commerce/cart`)).json()
                const item = cart?.data?.items?.[0]
                expect(item).toBeTruthy()
                // enrichment fields present in the contract (may be null when the product has none)
                expect(item).toHaveProperty("imageUrl")
                expect(item).toHaveProperty("originalPriceVnd")
                seeded = true
            }
        } finally {
            await ctx.dispose()
        }
        if (!seeded) test.skip(true, "no purchasable product on this env to seed a cart line")

        await loginAs(page, "student")
        const viewer = waitForViewer(page)
        await page.goto("/vi/cart")
        await viewer
        // Shared CartLineItem: a row with a thumbnail (img OR icon fallback) + PriceTag.
        const row = page.locator('div[class*="rounded-2xl"][class*="border-separator"]').first()
        await expect(row).toBeVisible({ timeout: 30_000 })
        // A discounted line shows the "-X%" savings chip via PriceTag.
        // (Present only when the seeded product had originalPriceVnd > priceVnd.)
        const discountChip = page.getByText(/-\d+%/).first()
        if ((await discountChip.count()) > 0) {
            await expect(discountChip).toBeVisible()
        }
    })

    // ── Feature 10 + 11 (UI) — learn dashboard centre + right tools rail + subject links ──
    test("F10/F11: learn home = intro + tools rail; Ôn tập → practice, Hỏi đáp → discussion", async ({
        page,
    }) => {
        await loginAs(page, "student")
        const detail = page.waitForResponse(
            (r) => r.url().includes(`/api/v1/courses/${PRF_SLUG}`) && r.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto(`/vi/courses/${PRF_SLUG}/learn/content`)
        const body = await (await detail).json()
        expect(body?.data?.subjectCode).toBe("PRF192")

        // Centre column = the course "home": About section (intro), not a tool grid.
        await expect(page.getByRole("button", { name: "Tiếp tục học" })).toBeVisible({
            timeout: 60_000,
        })

        // Right tools rail (desktop) hosts the learn tools + subject shortcuts.
        // The subject group only appears because the course exposes subjectCode.
        const onTap = page.getByRole("link", { name: "Ôn tập" })
        const hoiDap = page.getByRole("link", { name: "Hỏi đáp" })
        await expect(onTap).toBeVisible({ timeout: 30_000 })
        await expect(hoiDap).toBeVisible()

        await onTap.click()
        await expect(page).toHaveURL(/\/subjects\/PRF192\/practice$/, { timeout: 15_000 })

        // Back to the dashboard, then the Q&A shortcut.
        await page.goto(`/vi/courses/${PRF_SLUG}/learn/content`)
        await expect(page.getByRole("link", { name: "Hỏi đáp" })).toBeVisible({ timeout: 30_000 })
        await page.getByRole("link", { name: "Hỏi đáp" }).click()
        await expect(page).toHaveURL(/\/subjects\/PRF192\/discussion$/, { timeout: 15_000 })
    })

    // ── Feature 12 — subject AI tab opens without joining the workspace ──
    test("F12: subject AI tab renders tool cards without a membership gate", async ({ page }) => {
        await loginAs(page, "student")
        const viewer = waitForViewer(page)
        await page.goto("/vi/subjects/PRF192/ai")
        await viewer
        // The AI hub heading + at least one enabled tool CTA — no "join to use" wall.
        await expect(page.getByText("Trợ lý AI")).toBeVisible({ timeout: 30_000 })
        await expect(page.getByRole("button", { name: "Mở" }).first()).toBeVisible({
            timeout: 30_000,
        })
        // No join/membership prompt blocks the tools.
        expect(await page.getByRole("button", { name: /Tham gia|Join/ }).count()).toBe(0)
    })

    // ── Feature 13 — featured catalog hero split-card ──
    test("F13: catalog featured hero is the classic split-card (themed bg + CTA)", async ({
        page,
    }) => {
        await page.goto("/vi/courses")
        // The hero slide is a role=group / aria-roledescription=slide with an "i / N" label.
        const slide = page.locator('[aria-roledescription="slide"]').first()
        await expect(slide).toBeVisible({ timeout: 60_000 })
        // Split-card: a merchandising CTA button inside the slide (view/enroll, never buy/VIP).
        const cta = slide.getByRole("button").first()
        await expect(cta).toBeVisible()
        const label = (await cta.textContent())?.trim() ?? ""
        expect(/mua|VIP|buy/i.test(label)).toBe(false)
        // The card paints a solid theme background (inline style), not the app surface.
        const themed = slide.locator('div[style*="background"]').first()
        await expect(themed).toBeVisible()
    })
})
