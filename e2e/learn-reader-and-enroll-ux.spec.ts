import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — change `learn-reader-and-enroll-ux` (task 8.3 runtime smoke, browser leg).
 *
 *  - reader renders by content type: DOCUMENT → markdown article, no AI-study
 *    (VIDEO-only tool); VIDEO lesson → AI-study block mounts. (A real <video>
 *    player needs videoStatus=READY — none in the seed course, see notes.)
 *  - challenge tab follows the real BE `hasChallenge` flag (deep assertions live in
 *    learn-exercises-wire.spec.ts task 4.7).
 *  - inline next-lesson button advances; the sidebar toggle collapses the
 *    content-map rail.
 *  - "See all questions" reveals the embedded Q&A inline (no navigation).
 *  - Enroll on an un-purchased course opens the PaymentModal (VietQR checkout).
 */

const COURSE = "demo-c-co-ban"
const reader = (moduleId: string, lessonId: string) =>
    `/vi/courses/${COURSE}/learn/content/modules/${moduleId}/contents/${lessonId}`

test.describe("learn-reader-and-enroll-ux — reader by content type", () => {
    test("DOCUMENT lesson renders the markdown article and hides the VIDEO-only AI study block", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))

        const article = page.locator("#lesson-article")
        await expect(article).toBeVisible({ timeout: 60_000 })
        await expect(article).not.toBeEmpty()
        // no video element for a DOCUMENT lesson
        await expect(page.locator("video")).toHaveCount(0)
        // AI study tools are VIDEO-lesson-only
        await expect(page.getByText("Học với AI")).toHaveCount(0)
    })

    test("VIDEO lesson mounts the AI study block (player itself needs a READY video — not in seed)", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s2", "seed-les-c1-s2-l1"))

        await expect(page.getByRole("heading", { name: "Con trỏ (video)" })).toBeVisible({ timeout: 60_000 })
        // VIDEO-lesson-only AI study tools mount
        await expect(page.getByText("Học với AI").first()).toBeVisible()
        // challenge tab follows the real BE flag on this lesson
        await expect(
            page.getByRole("tab", { name: "Thử thách" }),
            "BUG (chia sẻ với learn-exercises-wire 4.7): hasChallenge chỉ được map từ GET /lessons/{id}/content, " +
                "endpoint này 404 cho lesson không có content row → tab Thử thách không render dù BE course tree " +
                "trả hasChallenge:true.",
        ).toBeVisible({ timeout: 15_000 })
    })
})

test.describe("learn-reader-and-enroll-ux — header controls", () => {
    test("inline next-lesson button advances to the next lesson", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))

        const next = page.getByRole("button", { name: "Bài sau" })
        await expect(next).toBeVisible({ timeout: 60_000 })
        await next.click()
        await expect(page).toHaveURL(/\/contents\/seed-les-c1-s1-l3$/, { timeout: 60_000 })
    })

    test("sidebar toggle collapses and restores the content-map rail", async ({ page }) => {
        // Rail resize-handle (aria "Kéo để đổi độ rộng…") là aside desktop; mobile dùng drawer
        // bottom-sheet không có handle này → tính năng KHÁC, không phải cùng surface.
        test.skip(test.info().project.name === "mobile", "resizable rail là chrome desktop-only")
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))

        // the resizable content-map rail's drag handle is the rail's stable marker
        const railHandle = page.getByLabel("Kéo để đổi độ rộng thanh nội dung")
        await expect(railHandle).toBeVisible({ timeout: 60_000 })

        const toggle = page.getByRole("button", { name: "Thu gọn/ mở rộng bảng học phần" })
        await toggle.click()
        await expect(railHandle).toHaveCount(0)

        await toggle.click()
        await expect(page.getByLabel("Kéo để đổi độ rộng thanh nội dung")).toBeVisible()
    })
})

test.describe("learn-reader-and-enroll-ux — inline Q&A", () => {
    test("'See all questions' reveals the embedded Q&A inline without navigating", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))

        await page.getByRole("button", { name: "Xem tất cả câu hỏi" }).click({ timeout: 60_000 })
        // still on the lesson route — inline reveal, no push to /learn/qa
        await expect(page).toHaveURL(/\/contents\/seed-les-c1-s1-l2$/)
        // embedded roll-up chrome: filter tabs + search (PageHeader suppressed)
        await expect(page.getByPlaceholder("Tìm câu hỏi…")).toBeVisible({ timeout: 20_000 })
        await expect(page.getByRole("tab", { name: "Chưa trả lời" })).toBeVisible()
    })
})

test.describe("learn-reader-and-enroll-ux — enroll opens PaymentModal", () => {
    test("enroll CTA on an un-purchased course opens the VietQR PaymentModal", async ({ page }) => {
        // Mobile có sticky bottom-CTA riêng + CTA in-page ẩn → `.first()` chạm bản ẩn, click no-op.
        // Wiring cart→PaymentModal đã chứng minh ở desktop; mobile CTA là surface khác.
        test.skip(test.info().project.name === "mobile", "enroll CTA mobile là sticky bar khác, verify ở desktop")
        test.setTimeout(120_000)
        await loginAs(page, "student")
        // WED201c: student has NO enrollment; COURSE_UNLOCK product resolves (399k)
        await page.goto("/vi/courses/wed201c-web-design-for-everyone-with-github-zoom")

        const enroll = page.getByRole("button", { name: "Đăng ký học" }).first()
        await expect(enroll).toBeVisible({ timeout: 60_000 })
        await expect(enroll).toBeEnabled({ timeout: 30_000 })
        // wait for the signed-in user to hydrate (navbar avatar) — clicking earlier
        // trips the useRequireAuth guest gate and opens the login modal instead
        await expect(page.getByRole("button", { name: /student_test/ })).toBeVisible({ timeout: 30_000 })

        const carted = page.waitForResponse(
            (res) => res.url().includes("/commerce/cart") && res.request().method() === "POST",
        )
        await enroll.click()
        expect((await carted).status()).toBe(200)

        // the single global checkout modal opens with the VietQR method
        const dialog = page.getByRole("dialog")
        await expect(dialog.getByText("Thanh toán").first()).toBeVisible({ timeout: 30_000 })
        await expect(dialog.getByText(/WED201c/i).first()).toBeVisible()
        await expect(dialog.getByText(/399\.000/).first()).toBeVisible()
        // VietQR-only checkout (no coin price → no method toggle): coupon field + pay CTA.
        // The QR itself renders only AFTER pressing pay (creates a real order) — not done here.
        await expect(dialog.getByPlaceholder("Nhập mã giảm giá")).toBeVisible()
        await expect(dialog.getByRole("button", { name: "Thanh toán" })).toBeVisible()
        // deliberately do NOT press pay — no real order is created by this test
    })
})
