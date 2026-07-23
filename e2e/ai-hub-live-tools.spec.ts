import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — change `ai-hub-live-tools` (tasks 2.4 / 3.6 / 4.6 / 5.5 e2e legs).
 *
 * Runs every `/ai/tools/*` tool against the LIVE apitest BE (no mocks): each
 * tool gets a minimal real input, submits its job (envelope 1002 → JobRef →
 * `useAiJobPolling` on GET /ai/jobs/{id}) or its sync endpoint (planner), and
 * must render a REAL structured result. CV upload needs working S3 storage —
 * when the presigned PUT fails the scenario is recorded as BLOCKED-STORAGE
 * (the builder→review path has no storage dependency and must pass).
 *
 * Every AI run consumes real quota — each tool runs exactly once.
 */

/** Pre-seed the consent cookie so the fixed-bottom banner never intercepts clicks. */
const suppressCookieBanner = async (page: Page) => {
    await page.context().addCookies([
        {
            name: "ftesaos-cookie-consent",
            value: encodeURIComponent(JSON.stringify({ analytics: false })),
            domain: "localhost",
            path: "/",
        },
    ])
}

const SAMPLE_TEXT = [
    "Con trỏ trong C là một biến lưu địa chỉ bộ nhớ của một biến khác.",
    "Toán tử & lấy địa chỉ của một biến, còn toán tử * truy cập giá trị tại địa chỉ đó.",
    "Con trỏ NULL không trỏ tới đâu cả; truy cập nó gây lỗi segmentation fault.",
    "Con trỏ hàm cho phép truyền hàm như tham số, ví dụ dùng cho hàm qsort.",
    "Cấp phát động với malloc trả về con trỏ void, cần free để tránh rò rỉ bộ nhớ.",
].join(" ")

/** Fill the shared LearningInput text tab of a tool page. */
const fillLearningText = async (page: Page) => {
    const box = page.getByPlaceholder("Dán nội dung bài học hoặc ghi chú bạn muốn xử lý…")
    await expect(box).toBeVisible({ timeout: 60_000 })
    await box.fill(SAMPLE_TEXT)
}

/** Press "Chạy" and wait for the tool's job submit POST to be accepted. */
const runJob = async (page: Page, submitPath: string) => {
    const submitted = page.waitForResponse(
        (res) => res.url().includes(submitPath) && res.request().method() === "POST",
        { timeout: 30_000 },
    )
    await page.getByRole("button", { name: /^Chạy$/ }).click()
    const res = await submitted
    expect(res.status(), `${submitPath} must be accepted`).toBeLessThan(300)
}

/** No failure/quota copy may be on screen when a result rendered. */
const expectNoFailure = async (page: Page) => {
    await expect(page.getByText("Tác vụ AI thất bại. Vui lòng thử lại.")).toHaveCount(0)
    await expect(
        page.getByText("Bạn đã dùng hết lượt cho công cụ này. Vui lòng thử lại sau."),
    ).toHaveCount(0)
}

test.describe("ai-hub-live-tools — hub tile wiring (2.4)", () => {
    test("the hub lists every live tool and the summary tile navigates to its page", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai")

        // all six live tool tiles render (mentor/teacher removed from the catalog)
        for (const name of [
            "Gia sư AI",
            "Lập kế hoạch học",
            "Tóm tắt thông minh",
            "Thẻ ghi nhớ",
            "Tạo câu hỏi",
            "Gỡ lỗi mã",
            "Đánh giá CV",
        ]) {
            await expect(page.getByText(name, { exact: true }).first()).toBeVisible({
                timeout: 60_000,
            })
        }
        await expect(page.getByText("Trợ lý giảng dạy")).toHaveCount(0)

        // a job tile CTA navigates to its real /ai/tools/* surface
        const summaryTile = page
            .locator("div.rounded-2xl", { hasText: "Tóm tắt thông minh" })
            .last()
        await summaryTile.getByRole("button", { name: "Mở" }).click()
        await expect(page).toHaveURL(/\/vi\/ai\/tools\/summary$/, { timeout: 30_000 })
        await expect(page.getByText("Tóm tắt thông minh").first()).toBeVisible()
    })
})

test.describe("ai-hub-live-tools — job tools (3.6)", () => {
    test("summary: paste text → run → real TL;DR + key points render", async ({ page }) => {
        test.setTimeout(240_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/summary")

        await fillLearningText(page)
        await runJob(page, "/ai/learning/summary")

        await expect(page.getByText("Tóm tắt nhanh")).toBeVisible({ timeout: 180_000 })
        await expect(page.getByText("Ý chính")).toBeVisible()
        await expectNoFailure(page)
    })

    test("flashcards: paste text → run → a real deck renders and a card flips", async ({ page }) => {
        test.setTimeout(240_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/flashcards")

        await fillLearningText(page)
        // minimal deck size
        await page.getByRole("button", { name: /^5$/ }).click()
        await runJob(page, "/ai/learning/flashcards")

        await expect(page.getByText(/\d+ thẻ/).first()).toBeVisible({ timeout: 180_000 })
        await expect(page.getByText("Chạm vào thẻ để lật")).toBeVisible()
        await expectNoFailure(page)
    })

    test("quiz: paste text → run → real questions render and answering grades locally", async ({ page }) => {
        test.setTimeout(240_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/quiz")

        await fillLearningText(page)
        await runJob(page, "/ai/learning/quiz")

        // first generated question with options
        const firstQuestion = page.locator("section.rounded-2xl").first()
        await expect(firstQuestion).toBeVisible({ timeout: 180_000 })
        const firstOption = firstQuestion.locator("button").first()
        await firstOption.click()
        await expect(
            firstQuestion.getByText(/Chính xác!|Chưa đúng\./).first(),
        ).toBeVisible()
        await expectNoFailure(page)
    })

    test("debug: paste buggy code → run → real markdown review renders", async ({ page }) => {
        test.setTimeout(240_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/debug")

        await page
            .getByPlaceholder("Dán đoạn mã bạn muốn được review…")
            .fill("def divide(a, b):\n    return a / b\n\nprint(divide(1, 0))")
        await page
            .getByPlaceholder("Mô tả lỗi hoặc điều bạn mong đợi…")
            .fill("Chương trình crash khi b = 0, làm sao xử lý an toàn?")
        await runJob(page, "/ai/coding/review")

        // the review renders as markdown inside the bordered result box
        const resultBox = page.locator("div.rounded-2xl.border.border-separator").last()
        await expect(resultBox).toBeVisible({ timeout: 180_000 })
        await expect
            .poll(async () => (await resultBox.innerText()).trim().length, { timeout: 30_000 })
            .toBeGreaterThan(50)
        await expectNoFailure(page)
    })
})

test.describe("ai-hub-live-tools — CV review (4.6)", () => {
    test("builder → review by cvProfileId (no storage dependency) returns a real review", async ({ page }) => {
        test.setTimeout(300_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/cv-review")

        // minimal valid header (fullName + email) on the builder tab
        await expect(page.getByRole("tab", { name: "CV của tôi" })).toBeVisible({
            timeout: 60_000,
        })
        const fullName = page.getByLabel("Họ và tên").first()
        await expect(fullName).toBeVisible({ timeout: 30_000 })
        await fullName.fill("Nguyễn Văn E2E")
        await page.getByLabel("Email").first().fill("e2e.student@ftes.vn")

        // "review this CV" saves (PUT /career/cv/me) then submits {cvProfileId}
        const saved = page.waitForResponse(
            (res) => res.url().includes("/career/cv/me") && res.request().method() === "PUT",
            { timeout: 30_000 },
        )
        const submitted = page.waitForResponse(
            (res) => res.url().includes("/ai/career/cv-review") && res.request().method() === "POST",
            { timeout: 60_000 },
        )
        await page.getByRole("button", { name: "Đưa CV này đi review" }).click()
        expect((await saved).status()).toBeLessThan(300)
        const submitRes = await submitted
        expect(submitRes.status()).toBeLessThan(300)
        const submitBody = submitRes.request().postDataJSON() as Record<string, unknown>
        expect(typeof submitBody.cvProfileId).toBe("string")

        // real review result: strengths/improvements panel
        await expect(page.getByText("Điểm mạnh")).toBeVisible({ timeout: 240_000 })
        await expect(page.getByText("Cần cải thiện")).toBeVisible()
        await expectNoFailure(page)
    })

    test("upload → review needs S3 storage (records BLOCKED-STORAGE when the presigned PUT fails)", async ({ page }) => {
        test.setTimeout(180_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/cv-review")

        await page.getByRole("tab", { name: "Tải file lên" }).click()
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles({
            name: "cv-e2e.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from(
                "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
            ),
        })
        await expect(page.getByText("cv-e2e.pdf")).toBeVisible()

        await page.getByRole("button", { name: "Tải lên và đánh giá" }).click()

        // Either the presigned pipeline works end-to-end (review submits) or the
        // storage PUT fails → the tab surfaces an upload error. Both outcomes are
        // recorded; a storage failure marks the scenario BLOCKED-STORAGE.
        const reviewSubmitted = page
            .waitForResponse(
                (res) =>
                    res.url().includes("/ai/career/cv-review") && res.request().method() === "POST",
                { timeout: 90_000 },
            )
            .then(() => "review-submitted" as const)
            .catch(() => null)
        const uploadFailed = page
            .locator("p.text-danger, .text-danger")
            .first()
            .waitFor({ state: "visible", timeout: 90_000 })
            .then(() => "storage-failed" as const)
            .catch(() => null)
        const outcome = await Promise.race([reviewSubmitted, uploadFailed])
        console.log(`[cv-upload] outcome: ${outcome ?? "timeout"}`)
        expect(outcome, "upload must either submit a review or surface a storage failure").not.toBeNull()
        if (outcome === "review-submitted") {
            await expect(page.getByText("Điểm mạnh")).toBeVisible({ timeout: 240_000 })
        }
    })
})

test.describe("ai-hub-live-tools — planner (5.5)", () => {
    test("goal → generate (sync ≤120s) → weekly timeline with progress renders", async ({ page }) => {
        test.setTimeout(300_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto("/vi/ai/tools/planner")

        // the tool opens on either the plan list (seeded/prior plans) or the form
        const newPlan = page.getByRole("button", { name: "Tạo lộ trình" })
        const goalBox = page.getByPlaceholder("vd: Thành thạo Spring Boot để phỏng vấn backend")
        await expect(newPlan.or(goalBox).first()).toBeVisible({ timeout: 60_000 })
        if (!(await goalBox.isVisible())) {
            await newPlan.click()
        }
        await expect(goalBox).toBeVisible()
        await goalBox.fill("Nắm vững con trỏ C trong 2 tuần để qua bài kiểm tra")

        const created = page.waitForResponse(
            (res) =>
                res.url().includes("/ai/learning/study-plan") &&
                res.request().method() === "POST",
            { timeout: 150_000 },
        )
        await page.getByRole("button", { name: /Tạo lộ trình/ }).last().click()
        const res = await created
        expect(res.status(), "study-plan POST must succeed").toBeLessThan(300)

        // the created plan lands on the weekly timeline with the overall progress meter
        await expect(page.getByText(/Tuần 1/).first()).toBeVisible({ timeout: 30_000 })
        await expect(page.getByText("Tiến độ tổng")).toBeVisible()
        await expect(page.getByRole("checkbox").first()).toBeVisible()
    })
})
