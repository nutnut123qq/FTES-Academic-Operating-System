import { expect, test, type Page } from "@playwright/test"
import { fetchToken, loginAs } from "./helpers/auth"

/**
 * E2E — change `learn-engagement-wire` (tasks 2.3 / 3.3 / 4.3 e2e legs).
 *
 * Seed data (apitest): student.test@ftes.vn enrolled `demo-c-co-ban`
 * (seed-course-c-basic). Lesson `seed-les-c1-s1-l2` (DOCUMENT, has body) renders the
 * reaction footer; `seed-les-c1-s1-l1` is body-less so the footer is intentionally
 * absent there (isReadingEmpty branch).
 *
 *  - lesson reactions: real view count from GET /reactions + optimistic like/unlike
 *    round-trips PUT/DELETE and the server truth converges.
 *  - Q&A roll-up: posting a lesson comment surfaces in the inline "all questions"
 *    (CourseQa embedded) and its lesson chip deep-links to the right lesson.
 *  - watch-position resume: BLOCKED-DATA on apitest (documented skip below).
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const COURSE = "demo-c-co-ban"
const LESSON_DOC = "seed-les-c1-s1-l2"
const READER_URL = `/vi/courses/${COURSE}/learn/content/modules/seed-sec-c1-s1/contents/${LESSON_DOC}`

interface ReactionSummary {
    lessonId: string
    viewCount: number
    likeCount: number
    myReaction: string | null
}

/** Server-truth GET of the lesson reaction summary (out-of-band, bearer token). */
const fetchReactions = async (page: Page, token: string): Promise<ReactionSummary> => {
    const res = await page.request.get(`${API_BASE}/courses/lessons/${LESSON_DOC}/reactions`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    return body.data as ReactionSummary
}

test.describe("learn-engagement-wire", () => {
    test("lesson reaction footer shows the real view count and like → unlike round-trips optimistically", async ({ page }) => {
        test.setTimeout(120_000)
        const token = await loginAs(page, "student")

        // Normalize: start from "not liked" so the toggle assertions are deterministic.
        // Xoá với BẤT KỲ reaction nào còn sót (run trước có thể để lại loại khác "LIKE"),
        // và poll tới khi server phản ánh null — DELETE rồi đọc ngay có thể dính cache/replica.
        const before = await fetchReactions(page, token)
        if (before.myReaction !== null) {
            // BE: DELETE /lessons/{id}/reactions/{reaction} — thiếu {reaction} → 405
            const del = await page.request.delete(
                `${API_BASE}/courses/lessons/${LESSON_DOC}/reactions/${before.myReaction}`,
                { headers: { Authorization: `Bearer ${token}` } },
            )
            expect(del.status()).toBe(200)
        }
        await expect
            .poll(async () => (await fetchReactions(page, token)).myReaction, { timeout: 15_000 })
            .toBeNull()
        const base = await fetchReactions(page, token)

        await page.goto(READER_URL)
        // the lesson body must be up before we judge the footer's presence
        await expect(page.locator("#lesson-article, article").first()).toBeVisible({ timeout: 60_000 })

        // like: trigger opens the picker, picking "Thích" flips the control optimistically
        // HeroUI popover-trigger bọc role=button quanh button thật → 2 element cùng name; lấy button thật
        const trigger = page.getByRole("button", { name: "Bày tỏ cảm xúc" }).and(page.locator("button"))
        await expect(
            trigger,
            "REGRESSION: LessonReactionFooter không render — DOCUMENT lesson đi qua DocumentReader " +
                "(LessonReader/index.tsx:319) và path đó không mount LessonReactionFooter; " +
                "GET /courses/lessons/{id}/reactions không bao giờ được bắn.",
        ).toBeVisible({ timeout: 15_000 })

        // real view count from the server renders in the footer (eye + count)
        const summary = await fetchReactions(page, token)
        expect(summary.viewCount).toBeGreaterThanOrEqual(42)
        await expect(
            page.locator("span.text-muted", { hasText: String(summary.viewCount) }).first(),
        ).toBeVisible({ timeout: 15_000 })
        // Vòng like/unlike mutate state DÙNG CHUNG 1 account+lesson — 2 project song song
        // (fullyParallel) giẫm nhau: PUT đấu DELETE cùng row → BE 500 (race tổng hợp, không phải
        // hành vi user thật; DELETE tuần tự đã kiểm idempotent 200). Chạy round-trip ở desktop;
        // mobile giữ assert footer + view count phía trên.
        if (test.info().project.name === "mobile") return
        const putDone = page.waitForResponse(
            (res) => res.url().includes(`/lessons/${LESSON_DOC}/reactions`) && res.request().method() === "PUT",
        )
        await trigger.click()
        // exact: "Thích" khớp substring cả "Yêu thích" → strict-mode 2 element
        await page.getByRole("dialog").getByRole("button", { name: "Thích", exact: true }).click()
        // optimistic: the trigger relabels to the picked reaction immediately.
        // Scope vào popover-trigger của footer: "Thích" còn xuất hiện ở nút like Q&A (aria-label)
        // và item trong picker → match toàn trang dính strict-mode 9 element.
        const likedTrigger = page
            .locator("div[data-slot='popover-trigger']")
            .filter({ hasText: /^Thích$/ })
            .locator("button")
        await expect(likedTrigger).toBeVisible()
        expect((await putDone).status()).toBe(200)
        // server truth: like really persisted (+1)
        await expect
            .poll(async () => (await fetchReactions(page, token)).likeCount, { timeout: 15_000 })
            .toBe(base.likeCount + 1)

        // unlike: picking the active reaction again removes it
        const deleteDone = page.waitForResponse(
            (res) => res.url().includes(`/lessons/${LESSON_DOC}/reactions`) && res.request().method() === "DELETE",
        )
        await likedTrigger.click()
        // exact: "Thích" khớp substring cả "Yêu thích" → strict-mode 2 element
        await page.getByRole("dialog").getByRole("button", { name: "Thích", exact: true }).click()
        await expect(page.getByRole("button", { name: "Bày tỏ cảm xúc" }).and(page.locator("button"))).toBeVisible()
        expect((await deleteDone).status()).toBe(200)
        await expect
            .poll(async () => (await fetchReactions(page, token)).likeCount, { timeout: 15_000 })
            .toBe(base.likeCount)
    })

    test("posting a lesson comment surfaces in the inline Q&A roll-up and links back to the lesson", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(READER_URL)

        const unique = `E2E hỏi đáp ${Date.now()}`

        // expand the collapsed composer pill and post a top-level comment
        await page.getByRole("button", { name: /Viết bình luận/ }).click({ timeout: 60_000 })
        const composer = page.getByPlaceholder("Viết bình luận…")
        await composer.fill(unique)
        const posted = page.waitForResponse(
            (res) => res.url().includes(`/lessons/${LESSON_DOC}/comments`) && res.request().method() === "POST",
        )
        await page.getByRole("button", { name: "Gửi" }).first().click()
        expect((await posted).status()).toBe(200)
        await expect(page.getByText(unique).first()).toBeVisible()

        // inline "see all questions" mounts the embedded roll-up — no route navigation
        await page.getByRole("button", { name: "Xem tất cả câu hỏi" }).click()
        await expect(page).toHaveURL(new RegExp(`/contents/${LESSON_DOC}$`))
        const search = page.getByPlaceholder("Tìm câu hỏi…")
        await expect(search).toBeVisible()
        await search.fill(unique)

        // the fresh comment shows as a question row with a lesson chip
        const row = page.getByText(unique).last()
        await expect(row).toBeVisible({ timeout: 20_000 })
        const lessonLink = page.getByRole("link", { name: /Mở bài học:/ }).first()
        await expect(lessonLink).toBeVisible()
        await expect(lessonLink).toHaveAttribute("href", new RegExp(`/contents/${LESSON_DOC}`))
        await lessonLink.click()
        await expect(page).toHaveURL(new RegExp(`/contents/${LESSON_DOC}`))
    })

    test("watch-position resume on a purchased course with a READY video", async ({ page }) => {
        // BLOCKED-DATA (tasks.md 3.3 note): the seed demo course has no lesson with
        // videoStatus=READY, and the only READY-video courses on apitest (khoa-test /
        // goi-prf192...) are NOT purchased by student.test — the player never mounts,
        // so the reporter has nothing to observe end-to-end. Unit coverage exists
        // (useWatchPositionReporter.test.ts, 6 PASS).
        test.skip(true, "BLOCKED-DATA: no purchased course with videoStatus=READY for student.test on apitest")
        await loginAs(page, "student")
    })
})
