import { test, expect } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — learn-gate-uses-real-signals (FE change, archived 2026-07-22 — implemented)
 *
 * Data: student.test@ftes.vn on khoa-test (TEST011): every lesson locked EXCEPT
 * "Bài 6" (accessLevel FULL) in "Phần 4". All locked lessons are PREVIEW
 * (accessLevel ≠ NONE → openable).
 *
 *  - 1.1 MindMap.statusOf uses per-viewer `isLocked`: a module with ANY unlocked
 *    lesson ("Phần 4") is NOT greyed (fill-default), a fully locked module
 *    ("Phần 1") is (fill-separator).
 *  - 1.2 openModule enters the first openable lesson (accessLevel ≠ NONE) —
 *    PREVIEW lessons navigate, no gate modal, no dead click.
 *  - 1.3 Legend says "Chưa mở" — the "Cần nâng cấp" copy is gone.
 *  - 2.1 A viewer with NO accessLevel (guest) on a lesson with a preview window
 *    still gets the gated lesson surface (previewSeconds is content-scoped).
 *    NOTE: the actual video ref is withheld from PREVIEW/guests by the BE
 *    (`preview-youtube-ref-gate`), so "guest sees the player" cannot render on
 *    apitest — asserted here as "guest gets the lesson + enroll surface, no crash".
 *  - 3.1 (free package not filtered): BLOCKED-DATA on apitest — no zero-price
 *    package with a slug ≠ "free" exists; covered by unit tests. Asserted here
 *    weaker: NO price filter drops the cheapest (1.000₫) package from the modal.
 */

const KT_SLUG = "khoa-test"
const PRF_SLUG = "goi-prf192prf193---nhap-mon-lap-trinh-cc"
const PRF_MOD0 = "77e5c513-a8ac-45af-ab15-3d7d3e4d26ff"
const PRF_BUOI0 = "8c1e9ee9-8d6e-4247-8dd8-0c84d7dd4ebf"
/** First lesson of khoa-test "Phần 1" (locked, PREVIEW → openable). */
const KT_BAI1 = "c85bf653-ba9b-4e98-afaa-ac1843a05fe4"

test.describe("learn-gate-uses-real-signals", () => {
    test.setTimeout(120_000)

    test("mind-map greys only fully locked modules; legend has no upsell copy", async ({ page }) => {
        await loginAs(page, "student")
        await page.goto(`/vi/courses/${KT_SLUG}/learn/mind-map`)

        const phan4 = page.locator('g[aria-label="Phần 4"] circle').first()
        await expect(phan4).toBeVisible({ timeout: 60_000 })
        // "Phần 4" holds an unlocked (FULL) lesson → NOT locked-grey
        await expect(phan4).toHaveClass(/fill-default/)
        // "Phần 1" is fully locked for this viewer → locked fill
        const phan1 = page.locator('g[aria-label="Phần 1"] circle').first()
        await expect(phan1).toHaveClass(/fill-separator/)

        // Legend copy (rule premium-unlock-is-enroll-not-vip)
        await expect(page.getByText("Chưa mở", { exact: true })).toBeVisible()
        expect(await page.getByText("Cần nâng cấp").count()).toBe(0)
    })

    test("mind-map module click enters the first openable lesson (PREVIEW navigates)", async ({ page }) => {
        await loginAs(page, "student")
        await page.goto(`/vi/courses/${KT_SLUG}/learn/mind-map`)

        const phan1 = page.locator('g[aria-label="Phần 1"]')
        await expect(phan1).toBeVisible({ timeout: 60_000 })
        await phan1.click()
        // PREVIEW (≠ NONE) is openable → real navigation, no gate modal
        await page.waitForURL(new RegExp(`contents/${KT_BAI1}`), { timeout: 60_000 })
        expect(await page.getByRole("dialog").count()).toBe(0)
    })

    test("guest (no login) still gets the gated lesson surface on a preview-window lesson", async ({ page }) => {
        // NO loginAs — signed-out visitor; /learn is public at the edge
        await page.goto(
            `/vi/courses/${PRF_SLUG}/learn/content/modules/${PRF_MOD0}/contents/${PRF_BUOI0}`,
        )
        // The lesson renders (title + enroll CTA) instead of vanishing for a viewer
        // whose accessLevel is null — previewSeconds (content-scoped) keeps it alive.
        await expect(page.getByRole("heading", { name: "Buổi 0" })).toBeVisible({
            timeout: 60_000,
        })
        await expect(
            page.getByRole("button", { name: "Đăng ký khóa học" }).first(),
        ).toBeVisible({ timeout: 30_000 })
    })

    test("package gate lists the cheapest package (no price filter drops it)", async ({ page }) => {
        await loginAs(page, "student")
        await page.goto(
            `/vi/courses/${KT_SLUG}/learn/content/modules/3bfd7568-ba0a-4b82-8a63-2a653f4eeedc/contents/${KT_BAI1}`,
        )
        await expect(
            page.getByRole("button", { name: "Đăng ký khóa học" }).first(),
        ).toBeVisible({ timeout: 60_000 })
        await page.getByRole("button", { name: "Đăng ký khóa học" }).first().click()
        const dialog = page.getByRole("dialog")
        // All three unlocking packages listed, cheapest included (1.000₫ SP25)
        await expect(dialog.getByText("Khóa SP25").first()).toBeVisible({ timeout: 30_000 })
        await expect(dialog.getByText("Khóa SP26").first()).toBeVisible()
        await expect(dialog.getByText("Khóa SU26").first()).toBeVisible()
        await dialog.getByRole("button", { name: "Để sau" }).click()
    })
})
