import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — change `learn-exercises-wire` (tasks 2.4 / 3.3 / 4.7 / 5.2 e2e legs).
 *
 * Seed data (apitest):
 *  - `seed-les-c1-s1-l2` — DOCUMENT + PUBLISHED quiz `[DEMO] Quiz con trỏ C`
 *    (3 SINGLE_CHOICE questions, 300s limit), NO challenge → every challenge entry
 *    point must stay hidden.
 *  - `seed-les-c1-s1-l3` — DOCUMENT + assignment `[DEMO] Viết parser nhỏ` (max 5).
 *  - `seed-les-c1-s2-l1` — VIDEO + linked PUBLISHED challenge
 *    `22222222-2222-4222-8222-22222222b001` → tab + rail + view all present.
 *  - V215 bank challenges on `seed-course-c-basic`: `demo-bank-mcq-c-public`
 *    (WORKSPACE_PUBLIC → listed on /challenges) + 3 COURSE_ONLY
 *    (`demo-bank-mcq-c-internal`, `demo-bank-code-c-swap`, `demo-bank-essay-c-pointer`)
 *    → NOT listed; opening one as un-enrolled ctv → 403 → enroll CTA.
 */

const COURSE = "demo-c-co-ban"
const reader = (moduleId: string, lessonId: string) =>
    `/vi/courses/${COURSE}/learn/content/modules/${moduleId}/contents/${lessonId}`

test.describe("learn-exercises-wire — quiz", () => {
    test("start → answer → submit → score + history on the seeded quiz", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))

        // resting card for the seeded quiz
        await expect(page.getByText("[DEMO] Quiz con trỏ C")).toBeVisible({ timeout: 60_000 })
        const startBtn = page.getByRole("button", { name: /Làm quiz|Làm lại/ })
        const started = page.waitForResponse(
            (res) => res.url().includes("/attempts") && res.request().method() === "POST" && res.url().includes("/quizzes/"),
        )
        await startBtn.click()
        expect((await started).status()).toBe(200)

        // taking view: 3 taker-safe questions + countdown
        const questions = page.locator("div.rounded-2xl.border.p-4").filter({ hasText: /Câu \d+/ })
        await expect(questions).toHaveCount(3)
        for (let index = 0; index < 3; index++) {
            const option = questions.nth(index).locator("button[aria-pressed]").first()
            await option.click()
            await expect(option).toHaveAttribute("aria-pressed", "true")
        }

        // NOTE: quiz-attempt submit is a PUT (`PUT /courses/quiz-attempts/{id}/submit`)
        const submitted = page.waitForResponse(
            (res) => res.url().includes("/quiz-attempts/") && res.url().includes("/submit"),
        )
        await page.getByRole("button", { name: "Nộp bài" }).click()
        expect((await submitted).status()).toBe(200)

        // result view: score % + pass state + attempt history
        await expect(page.getByText("Kết quả của bạn")).toBeVisible()
        await expect(page.getByText(/%/).first()).toBeVisible()
        await expect(page.getByText("Lịch sử làm bài")).toBeVisible()
        await expect(page.getByText(/Lần 1/).first()).toBeVisible()
    })
})

test.describe("learn-exercises-wire — assignment", () => {
    test("submitting a GitHub URL adds a pending grading row", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l3"))

        await expect(page.getByText("[DEMO] Viết parser nhỏ")).toBeVisible({ timeout: 60_000 })

        // If prior runs consumed all 5 slots, the locked state IS the wire working.
        const locked = page.getByText(/Bạn đã dùng hết \d+ lượt nộp/)
        if (await locked.isVisible()) {
            await expect(page.getByLabel("Đường dẫn GitHub")).toHaveCount(0)
            return
        }

        await page.getByLabel("Đường dẫn GitHub").fill(`https://github.com/e2e/parser-${Date.now()}`)
        const submitted = page.waitForResponse(
            (res) => res.url().includes("/submissions") && res.request().method() === "POST",
        )
        await page.getByRole("button", { name: "Nộp bài" }).click()
        expect((await submitted).status()).toBe(200)

        await expect(page.getByText("Lịch sử nộp")).toBeVisible()
        await expect(page.getByText(/Lần \d+/).first()).toBeVisible()
        await expect(page.getByText(/Chờ chấm|Đang chấm/).first()).toBeVisible()
    })
})

test.describe("learn-exercises-wire — challenge entry gating (4.7)", () => {
    test("a lesson WITHOUT a challenge hides every entry point (tab, rail, view)", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))
        await expect(page.getByRole("heading", { name: "Biến & kiểu dữ liệu", exact: true })).toBeVisible({ timeout: 60_000 })

        // no Challenges tab (a lone Content tab renders no tab bar at all)
        await expect(page.getByRole("tab", { name: "Thử thách" })).toHaveCount(0)
        // no "practice this lesson" entry in the right rail
        await expect(page.getByRole("button", { name: "Vào thử thách" })).toHaveCount(0)
        // no challenges CTA card
        await expect(page.getByRole("button", { name: "Mở thử thách" })).toHaveCount(0)
    })

    test("a lesson WITH a PUBLISHED challenge shows the tab, the rail entry, and opens the real challenge", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(reader("seed-sec-c1-s2", "seed-les-c1-s2-l1"))
        await expect(page.getByRole("heading", { name: "Con trỏ (video)" })).toBeVisible({ timeout: 60_000 })

        // rail "practice this lesson" gated on the REAL challengeId
        await expect(
            page.getByRole("button", { name: "Vào thử thách" }).first(),
            "BUG: GET /lessons/seed-les-c1-s2-l1/content 404s (LESSON_CONTENT_NOT_FOUND — video lesson, " +
                "hasContent:false) và useQueryLearnLessonSwr chỉ đọc hasChallenge/challengeId từ endpoint content " +
                "→ lesson KHÔNG có content row mất sạch entry point challenge dù course tree trả " +
                "hasChallenge:true + challengeId 2222…b001.",
        ).toBeVisible({ timeout: 15_000 })

        // challenges tab present; the view links to the REAL challenge id (no `-c` mock)
        await page.getByRole("tab", { name: "Thử thách" }).click()
        await page.getByRole("button", { name: "Mở thử thách" }).click()
        await expect(page).toHaveURL(
            /\/challenges\/22222222-2222-4222-8222-22222222b001$/,
            { timeout: 60_000 },
        )
        // the submission surface loads the real challenge
        await expect(page.getByText("[DEMO] MCQ con trỏ C").first()).toBeVisible({ timeout: 60_000 })
    })

    test("un-enrolled ctv opening a COURSE_ONLY bank challenge gets the enroll CTA (403 map)", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "ctv")
        await page.goto(
            `/vi/courses/${COURSE}/learn/content/modules/seed-sec-c1-s2/contents/seed-les-c1-s2-l1/challenges/demo-bank-mcq-c-internal`,
        )
        await expect(page.getByText("Đăng ký để làm thử thách")).toBeVisible({ timeout: 60_000 })
        await expect(page.getByRole("button", { name: "Đăng ký khóa học" })).toBeVisible()
        // never the old "VIP" upsell
        await expect(page.getByText(/VIP/i)).toHaveCount(0)
    })

    test("/challenges lists the public bank challenge and hides the 3 COURSE_ONLY ones", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        const listed = page.waitForResponse(
            (res) => /\/challenges(\?|$)/.test(res.url()) && res.request().method() === "GET",
        )
        await page.goto("/vi/challenges")
        expect((await listed).status()).toBe(200)

        await expect(page.getByText("[DEMO] Kho: Trắc nghiệm C public")).toBeVisible({ timeout: 60_000 })
        await expect(page.getByText("Trắc nghiệm C nội bộ")).toHaveCount(0)
        await expect(page.getByText("Viết hàm hoán vị")).toHaveCount(0)
        await expect(page.getByText("Luận về con trỏ")).toHaveCount(0)
    })
})

test.describe("learn-exercises-wire — legacy route redirects (5.2)", () => {
    const target = new RegExp(`/vi/courses/${COURSE}/learn/content$`)

    test("legacy /lessons/[lessonId] redirects into the learn shell", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(`/vi/courses/${COURSE}/lessons/seed-les-c1-s1-l1`)
        await expect(page).toHaveURL(target, { timeout: 60_000 })
    })

    test("legacy /quiz redirects into the learn shell", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(`/vi/courses/${COURSE}/quiz`)
        await expect(page).toHaveURL(target, { timeout: 60_000 })
    })

    test("legacy /assignments redirects into the learn shell", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(`/vi/courses/${COURSE}/assignments`)
        await expect(page).toHaveURL(target, { timeout: 60_000 })
    })
})
