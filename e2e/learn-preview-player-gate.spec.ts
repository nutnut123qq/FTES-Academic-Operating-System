import { test, expect } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — learn-preview-player-gate (FE change, tasks 4.1–4.3)
 *
 * IMPORTANT CONTEXT: the later BE change `preview-youtube-ref-gate` (deployed
 * 2026-07-22, commit c08425c) deliberately CLOSED the client-gated YouTube
 * preview: `GET /courses/lessons/{id}/stream` in PREVIEW mode now returns
 * `videoRef: null, enforceClientGate: false` for every provider. The countdown /
 * pause-at-limit / seek-clamp path (tasks 4.1) therefore CANNOT run against
 * apitest — there is no ref for the preview player to mount. What IS testable:
 *
 *  - PREVIEW video lesson: NO ungated YouTube iframe leaks; the viewer gets the
 *    teaser paywall + PackageGateModal instead of an empty/stuck player.
 *  - FULL YouTube lesson: plays ungated — no countdown chip, no lock overlay.
 *  - FULL HLS lesson: stream returns a signed manifest URL, no preview chrome.
 *  - DOCUMENT PREVIEW: teaser + paywall unchanged (regression 4.3).
 *
 * Data: student.test@ftes.vn — khoa-test (TEST011) not purchased (PREVIEW on
 * most lessons, FULL on "Bài 6"); PRF192 "Buổi 0" is a free FULL YouTube lesson.
 */

const KT_SLUG = "khoa-test"
const KT_MOD3 = "e559d63d-5f65-4a0e-b033-a403e2431d46" // Phần 3
const KT_MOD4 = "f1f83d70-2260-46fc-8506-37c173825e2a" // Phần 4
const KT_BAI5 = "0e1581d1-750d-462c-a4e0-3aa619c27b32" // VIDEO PREVIEW previewSeconds=10
const KT_TAILIEU = "fad5be20-fa12-4fa6-8aa0-462ee8626fd1" // DOCUMENT PREVIEW
const KT_BAI6 = "bc712e83-106c-4279-9b11-73c67dff08e0" // VIDEO FULL (HLS)

const PRF_SLUG = "goi-prf192prf193---nhap-mon-lap-trinh-cc"
const PRF_MOD0 = "77e5c513-a8ac-45af-ab15-3d7d3e4d26ff" // Phần 0
const PRF_BUOI0 = "8c1e9ee9-8d6e-4247-8dd8-0c84d7dd4ebf" // VIDEO FULL (YouTube)

const streamOf = (lessonId: string) => (r: { url(): string; request(): { method(): string } }) =>
    r.url().includes(`/courses/lessons/${lessonId}/stream`) && r.request().method() === "GET"

test.describe("learn-preview-player-gate", () => {
    test.setTimeout(120_000)

    test("PREVIEW video: no ungated player leak — teaser paywall + gate modal instead", async ({ page }) => {
        await loginAs(page, "student")
        const streamRes = page.waitForResponse(streamOf(KT_BAI5), { timeout: 60_000 })
        await page.goto(
            `/vi/courses/${KT_SLUG}/learn/content/modules/${KT_MOD3}/contents/${KT_BAI5}`,
        )
        const stream = (await (await streamRes).json())?.data
        expect(stream?.mode).toBe("PREVIEW")
        expect(stream?.previewSeconds).toBe(10)
        // BE preview-youtube-ref-gate: PREVIEW never hands the client a ref
        expect(stream?.videoRef ?? null).toBeNull()

        // Paywall renders (no stuck/empty player as the only surface)
        await expect(page.getByText("Bạn đang xem bản học thử")).toBeVisible({ timeout: 60_000 })

        // No ungated YouTube embed may exist anywhere on a PREVIEW lesson
        await page.waitForTimeout(3_000)
        expect(await page.locator('iframe[src*="youtube.com"]').count()).toBe(0)

        // CTA opens the package gate with the course's real packages
        await page.getByRole("button", { name: "Đăng ký khóa học" }).first().click()
        const dialog = page.getByRole("dialog")
        await expect(dialog.getByText("Khóa SP25").first()).toBeVisible({ timeout: 30_000 })
        await dialog.getByRole("button", { name: "Để sau" }).click()
    })

    test("FULL YouTube lesson: plays ungated — no countdown chip, no lock overlay", async ({ page }) => {
        await loginAs(page, "student")
        const streamRes = page.waitForResponse(streamOf(PRF_BUOI0), { timeout: 60_000 })
        await page.goto(
            `/vi/courses/${PRF_SLUG}/learn/content/modules/${PRF_MOD0}/contents/${PRF_BUOI0}`,
        )
        const stream = (await (await streamRes).json())?.data
        expect(stream?.mode).toBe("FULL")
        expect(stream?.provider).toBe("YOUTUBE")
        expect(String(stream?.videoRef ?? "")).toContain("youtu")

        // The IFrame-API player mounts a youtube embed
        await expect(page.locator('iframe[src*="youtube.com"]').first()).toBeVisible({
            timeout: 60_000,
        })
        // No preview chrome for a FULL viewer
        expect(await page.getByText("Xem thử còn").count()).toBe(0)
        expect(await page.getByText("Hết phần xem thử").count()).toBe(0)
    })

    test("FULL HLS lesson: signed manifest, no preview chrome", async ({ page }) => {
        await loginAs(page, "student")
        const streamRes = page.waitForResponse(streamOf(KT_BAI6), { timeout: 60_000 })
        await page.goto(
            `/vi/courses/${KT_SLUG}/learn/content/modules/${KT_MOD4}/contents/${KT_BAI6}`,
        )
        const stream = (await (await streamRes).json())?.data
        expect(stream?.mode).toBe("FULL")
        expect(String(stream?.url ?? "")).toContain(".m3u8")

        await expect(page.getByRole("heading", { name: "Bài 6" })).toBeVisible({
            timeout: 60_000,
        })
        await page.waitForTimeout(2_000)
        expect(await page.getByText("Xem thử còn").count()).toBe(0)
        expect(await page.getByText("Hết phần xem thử").count()).toBe(0)
    })

    test("DOCUMENT PREVIEW regression: teaser + paywall unchanged", async ({ page }) => {
        await loginAs(page, "student")
        await page.goto(
            `/vi/courses/${KT_SLUG}/learn/content/modules/${KT_MOD3}/contents/${KT_TAILIEU}`,
        )
        await expect(page.getByText("Bạn đang xem bản học thử")).toBeVisible({ timeout: 60_000 })
        await expect(
            page.getByRole("button", { name: "Đăng ký khóa học" }).first(),
        ).toBeVisible()
        // Teaser fade only over an actual teaser body (white-streak regression guard)
        const fade = await page.evaluate(() => {
            const article = document.getElementById("lesson-article")
            const textLen = (article?.textContent ?? "").trim().length
            const fadeCount = document.querySelectorAll(
                'div[class*="bg-gradient-to-b"][class*="from-transparent"]',
            ).length
            return { textLen, fadeCount }
        })
        expect(fade.fadeCount === 0 || fade.textLen > 0).toBe(true)
    })
})
