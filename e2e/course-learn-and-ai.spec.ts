import { expect, request, test, type APIRequestContext, type Page } from "@playwright/test"
import { fetchToken, loginAs } from "./helpers/auth"

/**
 * E2E — nghiệm thu READER khoá học + 3 công cụ FrosTES của người học (vòng 4).
 *
 * Khoá nghiệm thu đã dựng sẵn trên apitest (KHÔNG tạo mới ở đây):
 *   course 20214b93… / slug `e2e-v4-course-505089-ccf58cc7`, 1 chương, 3 bài
 *     · L1 VIDEO    0bc26447…  (video-ref YouTube, KHÔNG có bản ghi `/lessons/{id}/content`)
 *     · L2 DOCUMENT 3f74ca4c…  (thân bài chứa con số BÍ MẬT 4271 — chỉ có trong bài này)
 *     · L3 DOCUMENT 9baa935a…
 *
 * Các ca:
 *   (a) `mở reader → chuyển bài → tự đánh dấu hoàn thành → tiến độ rail tăng`
 *   (b) `hỏi AI trong reader trên bài DOCUMENT` → câu trả lời PHẢI chứa 4271
 *   (c) `tóm tắt bài DOCUMENT bằng AI` → bản tóm tắt PHẢI chứa 4271
 *   (d1) `thẻ ghi nhớ AI trong reader` (bài VIDEO — surface duy nhất)
 *   (d2) `chấm 1 thẻ → reload → tiến độ SM-2 còn nguyên` (subject practice PRF192)
 *
 * ─── GIẢ ĐỊNH / SỰ THẬT ĐÃ TRA (đọc trước khi sửa file này) ────────────────────
 *
 * 1. Ba endpoint `POST /ai/document-qa`, `/ai/learning/summary`, `/ai/learning/flashcards`
 *    KHÔNG được reader gọi. Trong reader cả 3 công cụ FrosTES đều chạy qua SSE TUTOR_CHAT
 *    (`POST /ai/sessions` + `POST /ai/sessions/{id}/messages`), xem doc-comment
 *    `LessonAiStudy/useLessonAiStream.ts` — `/ai/learning/*` trả `code=1002` Accepted mà
 *    `restRequest` coi là lỗi nên FE cố ý tránh. Vì vậy "trạng thái đang xử lý" ở đây là
 *    stream đang chảy / bubble "Đang soạn câu trả lời…", và ngưỡng chờ là 120 000 ms
 *    (đúng "tối đa 2 phút" của đề bài).
 *
 * 2. Khối "Học với FrosTES" (Ghi chú FrosTES + Thẻ ghi nhớ FrosTES) chỉ mount khi
 *    `!isLocked && lesson.isVideoLesson` (LessonReader/index.tsx). Bài DOCUMENT
 *    3f74ca4c KHÔNG có khối này — đó là thiết kế hiện tại, không phải bug. Nên:
 *      · (c) tóm tắt bài DOCUMENT đi qua gợi ý "Tóm tắt bài học này" của trợ giảng FrosTES
 *        (cùng grounding lesson-body, và assert được con số 4271 để chứng minh tóm tắt
 *        thực sự sinh TỪ BÀI ĐÓ);
 *      · (d1) bộ thẻ trong reader chỉ chạy được trên bài VIDEO.
 *
 * 3. Bộ thẻ AI trong reader là EPHEMERAL: `LessonAiFlashcards` parse JSON từ stream và
 *    giữ trong state, KHÔNG có nút chấm điểm, KHÔNG lưu server → reload là mất. Surface
 *    DUY NHẤT có SM-2 lưu server là flashcard luyện tập theo MÔN
 *    (`GET/POST /subjects/{code}/practice/flashcards[/{cardId}/review]`, `Sm2Scheduler`
 *    phía BE). Yêu cầu "chấm 1 thẻ rồi reload kiểm tiến độ SM-2 còn nguyên" vì vậy được
 *    nghiệm thu ở ca (d2) trên môn PRF192 (đã có sẵn deck "E2E deck PRF192" 3 thẻ).
 *
 * 4. Chuẩn bị: học viên phải SỞ HỮU khoá thì (a)–(d1) mới chạy. `POST /courses/{id}/enroll`
 *    chỉ cho course free (guard chống payment-bypass), nên phần chuẩn bị dùng đường ĐẶC
 *    QUYỀN của admin: `POST /api/v1/admin/courses/{courseId}/enrollments` body `{userId}`
 *    (permission `admin.course.manage` → `EnrollmentService.adminGrant`, idempotent).
 *    `userId` lấy từ claim `sub` của access-token học viên — nền tảng tự phát token nên
 *    `sub` CHÍNH LÀ `users.id` (đã đối chiếu: grant bằng `sub` trả 200 và `me/access`
 *    lật sang `enrolled: true`).
 *
 * 5. Quota AI là quota THẬT: cả file phát đúng 3 lượt sinh (b, c, d1). Đừng thêm lượt.
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

const COURSE_ID = "20214b93-6bfd-4f1b-845a-7da4ea29032c"
const COURSE_SLUG = "e2e-v4-course-505089-ccf58cc7"
/** `moduleId` chỉ là segment trang trí — LessonReader chỉ đọc `courseId` + `contentId`. */
const SECTION_ID = "a991489f-ca3b-4471-ac73-90c3afe113a9"
const LESSON_VIDEO = "0bc26447-fa2f-4760-9519-eb14a590767d"
/** Bài DOCUMENT chứa "mỗi sinh viên được cấp tối đa 4271 byte heap". */
const LESSON_DOC = "3f74ca4c-9f88-44b2-bccf-3aaaa4caee94"
const LESSON_DOC_NEXT = "9baa935a-a208-4e21-9d11-d9a25a5a3177"
/** Con số chỉ tồn tại trong thân bài LESSON_DOC — dấu vân tay của grounding. */
const SECRET = "4271"

/** Môn có deck flashcard curated + tiến độ SM-2 lưu server (ca d2). */
const SUBJECT_CODE = "PRF192"

/** Ngưỡng "đang xử lý" tối đa của đề bài. */
const AI_TIMEOUT = 120_000
/** Thân bài markdown hydrate sau shell — chờ dương cho `#lesson-article`. */
const RENDER_TIMEOUT = 60_000
/** Sau khi nội dung render vẫn phải chờ React hydrate rồi mới click. */
const HYDRATE_MS = 1_500

const readerUrl = (contentId: string) =>
    `/vi/courses/${COURSE_SLUG}/learn/content/modules/${SECTION_ID}/contents/${contentId}`

/* ────────────────────────────────── helpers ───────────────────────────────── */

/**
 * `sub` của access-token = `users.id` (xem giả định §4). Giải mã payload JWT thay vì
 * gọi thêm endpoint — nền tảng không phơi `/users/me` ở REST v1.
 */
const userIdFromToken = (token: string): string => {
    const payload = token.split(".")[1] ?? ""
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { sub?: string }
    if (!decoded.sub) throw new Error("access token has no `sub` claim")
    return decoded.sub
}

/** Envelope `{code,message,data}` → `data`. */
const dataOf = async <T,>(res: { ok(): boolean; status(): number; json(): Promise<unknown> }) => {
    expect(res.ok(), `REST ${res.status()}`).toBeTruthy()
    return ((await res.json()) as { data: T }).data
}

interface CourseAccess {
    enrolled: boolean
    purchased: boolean
    fullAccess: boolean
}

/** `GET /courses/{id}/me/progress` — `CourseDtos.CourseProgressView` (status "COMPLETED"). */
interface CourseProgress {
    completionPercent: number
    lessons: Array<{ lessonId: string; status: string }>
}

interface FlashcardProgress {
    status: string
    ease: number
    intervalDays: number
    repetitions: number
    lapses: number
    dueAt: string | null
    lastReviewedAt: string | null
    lastGrade: number | null
    due: boolean
}

interface FlashcardDecks {
    totalCards: number
    dueCount: number
    decks: Array<{
        id: string
        title: string
        cards: Array<{ id: string; front: string; back: string; progress: FlashcardProgress | null }>
    }>
}

/**
 * CHUẨN BỊ: bảo đảm học viên sở hữu khoá nghiệm thu. Idempotent — đã ghi danh thì
 * không gọi gì thêm (grant của admin cũng idempotent, nhưng vẫn tránh ghi vô ích).
 */
const ensureEnrolled = async (api: APIRequestContext, studentToken: string) => {
    const access = await dataOf<CourseAccess>(
        await api.get(`${API_BASE}/courses/${COURSE_ID}/me/access`, {
            headers: { Authorization: `Bearer ${studentToken}` },
        }),
    )
    if (access.enrolled) return

    const adminToken = await fetchToken("admin")
    const granted = await api.post(`${API_BASE}/admin/courses/${COURSE_ID}/enrollments`, {
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        data: { userId: userIdFromToken(studentToken) },
    })
    expect(
        granted.ok(),
        `admin grant enrollment failed (${granted.status()}): ${await granted.text()}`,
    ).toBeTruthy()

    const after = await dataOf<CourseAccess>(
        await api.get(`${API_BASE}/courses/${COURSE_ID}/me/access`, {
            headers: { Authorization: `Bearer ${studentToken}` },
        }),
    )
    expect(after.enrolled, "student must own the acceptance course after the grant").toBeTruthy()
}

/**
 * SỐ BÀI của khoá theo SERVER — mẫu số của bộ đếm rail ("{đã xong}/{tổng} bài").
 *
 * KHÔNG hardcode: khoá nghiệm thu dùng chung với `course-authoring-closed-loop`, spec đó THÊM
 * một bài mới mỗi lần chạy (rồi mới dọn ở lần sau), nên tổng dao động 3 ⇄ 4. Hardcode `3` đã
 * làm ca (a) đỏ oan ở lần chạy 2026-07-27 (rail hiện "0/4 bài"). Đọc đúng payload mà trang
 * khoá của FE tiêu thụ (`GET /courses/{slug}`) thay vì `me/progress` — `progress.lessons` là
 * MẢNG RỖNG khi chưa có bài nào hoàn thành, không dùng để đếm tổng được.
 */
const totalLessons = async (
    api: APIRequestContext,
    headers: Record<string, string>,
): Promise<number> => {
    const course = await dataOf<{ sections?: Array<{ lessons?: Array<unknown> }> }>(
        await api.get(`${API_BASE}/courses/${COURSE_SLUG}`, { headers }),
    )
    return (course.sections ?? []).reduce(
        (sum, section) => sum + (section.lessons ?? []).length,
        0,
    )
}

/** Số bài đã hoàn thành theo SERVER (nguồn của bộ đếm rail). */
const completedLessonIds = async (
    api: APIRequestContext,
    headers: Record<string, string>,
): Promise<Set<string>> => {
    const progress = await dataOf<CourseProgress>(
        await api.get(`${API_BASE}/courses/${COURSE_ID}/me/progress`, { headers }),
    )
    return new Set(
        (progress.lessons ?? [])
            .filter((row) => row.status === "COMPLETED")
            .map((row) => row.lessonId)
            .filter(Boolean),
    )
}

/** Banner cookie-consent (đã seed cờ từ chối, đây chỉ là lưới an toàn). */
const dismissCookieBanner = async (page: Page) => {
    const decline = page.getByRole("button", { name: "Từ chối" })
    if (await decline.isVisible().catch(() => false)) await decline.click()
}

/** Mở 1 bài trong reader và chờ DƯƠNG tới lúc thân bài render + hydrate xong. */
const openLesson = async (page: Page, contentId: string) => {
    // KHÔNG dùng waitForViewer(): route reader không phát GraphQL `me` → chờ sẽ treo 30s.
    await page.goto(readerUrl(contentId))
    await dismissCookieBanner(page)
    await expect(page.locator("#lesson-article")).toBeVisible({ timeout: RENDER_TIMEOUT })
    await page.waitForTimeout(HYDRATE_MS)
}

/**
 * Panel trợ giảng FrosTES — PHẢI khoanh vùng, không assert ở cấp page: thân bài đang mở
 * cũng chứa con số 4271 nên `page.innerText()` sẽ đúng giả.
 *
 * Desktop `ContentAiFab` render `PopoverContent` KHÔNG bọc `Popover.Dialog` → react-aria
 * chỉ gắn `data-placement`, không có `role="dialog"`. Mobile là `Drawer.Dialog` (có
 * role). Bắt cả hai, lọc theo composer nằm bên trong.
 */
const aiPanel = (page: Page) =>
    page
        .locator('[data-placement], [role="dialog"]')
        .filter({ has: page.getByPlaceholder("Hỏi về bài học…") })
        .last()

/** Mở FAB trợ giảng FrosTES và trả về panel đã hiện. */
const openAiChat = async (page: Page) => {
    await page.getByRole("button", { name: "Mở trợ giảng FrosTES" }).click()
    const panel = aiPanel(page)
    await expect(panel).toBeVisible({ timeout: 15_000 })
    return panel
}

/* ─────────────────────────────────── suite ────────────────────────────────── */

test.describe("course reader + AI tools (khoá nghiệm thu vòng 4)", () => {
    let api: APIRequestContext

    /**
     * Token sống ~15 phút và các ca AI dưới đây chạy tới 4 phút mỗi ca — luôn lấy lại
     * qua `fetchToken` (helper tự cache 10 phút rồi đăng nhập lại) thay vì giữ 1 token
     * từ `beforeAll`, nếu không ca cuối sẽ 401 vì token hết hạn.
     */
    const studentAuth = async () => ({ Authorization: `Bearer ${await fetchToken("student")}` })

    test.beforeAll(async () => {
        api = await request.newContext()
        await ensureEnrolled(api, await fetchToken("student"))
    })

    test.afterAll(async () => {
        await api.dispose()
    })

    test("(a) reader mở được, chuyển bài, tự đánh dấu hoàn thành và tiến độ rail tăng", async ({
        page,
    }) => {
        test.setTimeout(180_000)

        const doneBefore = await completedLessonIds(api, await studentAuth())
        const wasCompleted = doneBefore.has(LESSON_DOC)
        const total = await totalLessons(api, await studentAuth())
        expect(total, "khoá nghiệm thu phải còn bài để đọc").toBeGreaterThan(1)

        await loginAs(page, "student")
        await openLesson(page, LESSON_DOC)

        // thân bài THẬT (không phải paywall/skeleton): con số bí mật nằm trong bài
        await expect(page.locator("#lesson-article")).toContainText(SECRET)

        // rail trái: bộ đếm "{done}/{total} bài" (viewport desktop ≥ lg mới có rail)
        const railCounter = page.getByText(new RegExp(`^\\d+/${total} bài$`)).first()
        await expect(railCounter).toBeVisible({ timeout: 30_000 })
        const railBefore = Number(((await railCounter.innerText()).match(/^(\d+)/) ?? ["", "0"])[1])

        // Bài DOCUMENT hoàn thành khi RỜI bài (unmount sau khi đã ở lại > 800ms), không có
        // nút "Đánh dấu hoàn thành" nào cả (key i18n `learn.reader.markComplete` là key chết).
        await expect(page.getByRole("button", { name: "Đánh dấu hoàn thành" })).toHaveCount(0)

        const completePost = wasCompleted
            ? null
            : page.waitForRequest(
                  (req) =>
                      req.url().includes(`/courses/lessons/${LESSON_DOC}/complete`) &&
                      req.method() === "POST",
                  { timeout: 30_000 },
              )

        // chuyển bài bằng nút "Bài sau" ở header (button; thẻ pager cuối bài là link)
        await page.getByRole("button", { name: "Bài sau" }).click()
        await expect(page).toHaveURL(new RegExp(`contents/${LESSON_DOC_NEXT}$`), { timeout: 30_000 })
        if (completePost) await completePost

        // quay lại bài vừa rời → trạng thái hoàn thành đến từ SERVER (seed `isCompleted`)
        await openLesson(page, LESSON_DOC)
        await expect(page.getByText("Đã hoàn thành").first()).toBeVisible({ timeout: 30_000 })

        // tiến độ: server phải ghi nhận, và rail phải phản ánh
        const doneAfter = await completedLessonIds(api, await studentAuth())
        expect(doneAfter.has(LESSON_DOC), "server must record LESSON_DOC as completed").toBeTruthy()

        const railAfterCounter = page.getByText(new RegExp(`^\\d+/${total} bài$`)).first()
        await expect(railAfterCounter).toBeVisible({ timeout: 30_000 })
        await expect
            .poll(
                async () =>
                    Number(((await railAfterCounter.innerText()).match(/^(\d+)/) ?? ["", "0"])[1]),
                { timeout: 30_000 },
            )
            .toBeGreaterThanOrEqual(wasCompleted ? Math.max(railBefore, 1) : railBefore + 1)
    })

    test("(b) hỏi AI trong reader trên bài DOCUMENT — câu trả lời chứa con số chỉ có trong bài", async ({
        page,
    }) => {
        test.setTimeout(240_000)

        await loginAs(page, "student")
        await openLesson(page, LESSON_DOC)

        const panel = await openAiChat(page)
        const composer = panel.getByPlaceholder("Hỏi về bài học…")
        await composer.fill(
            "Theo quy ước riêng của lớp trong bài này, mỗi sinh viên được cấp tối đa bao nhiêu byte vùng nhớ heap? Trả lời bằng con số.",
        )
        await composer.press("Enter")

        // chờ DƯƠNG: bong bóng trả lời phải chứa con số của bài (grounding đúng bài).
        // Không assert phủ định trước — "chưa thấy chữ lỗi" luôn đúng giả khi chưa kịp render.
        await expect
            .poll(async () => (await panel.innerText()).includes(SECRET), { timeout: AI_TIMEOUT })
            .toBe(true)

        // tới đây câu trả lời đã có thật → mới chốt là không rơi vào nhánh lỗi/quota
        const answered = await panel.innerText()
        expect(answered).not.toContain("Xin lỗi, mình chưa trả lời được.")
        expect(answered).not.toContain("Bạn đã dùng hết lượt hỏi AI cho hôm nay.")

        // Ảnh bằng chứng: panel AI trả lời ĐÚNG nội dung bài (con số 4271 chỉ có trong bài này).
        await page.screenshot({ path: "test-results/vong4-ai-tra-loi-dung-bai.png", fullPage: true })
    })

    test("(c) tóm tắt bài DOCUMENT bằng AI — bản tóm tắt sinh từ chính bài đó", async ({ page }) => {
        test.setTimeout(240_000)

        await loginAs(page, "student")
        await openLesson(page, LESSON_DOC)

        // Khối "Học với FrosTES" (Ghi chú FrosTES / Thẻ ghi nhớ FrosTES) bị gate VIDEO-only → bài DOCUMENT
        // không có. Chốt điều đó thành assert để nếu gate đổi thì spec này nói ra ngay.
        await expect(page.getByText("Học với FrosTES")).toHaveCount(0)

        const panel = await openAiChat(page)
        // gợi ý dựng sẵn = đường tóm tắt của reader
        await panel.getByRole("button", { name: "Tóm tắt bài học này" }).click()

        // chấp nhận trạng thái "đang xử lý" tối đa 2 phút, rồi phải ra tóm tắt CÓ 4271
        await expect
            .poll(async () => (await panel.innerText()).includes(SECRET), { timeout: AI_TIMEOUT })
            .toBe(true)

        const summary = await panel.innerText()
        expect(summary).not.toContain("Xin lỗi, mình chưa trả lời được.")
        expect(summary).not.toContain("Bạn đã dùng hết lượt hỏi AI cho hôm nay.")
        // tóm tắt phải là văn bản thật, không phải một dòng cụt
        expect(summary.length).toBeGreaterThan(200)
    })

    test("(d1) thẻ ghi nhớ AI trong reader — sinh bộ thẻ rồi lật được thẻ", async ({ page }) => {
        test.setTimeout(240_000)

        await loginAs(page, "student")
        // Bài VIDEO là surface DUY NHẤT mount `LessonAiStudy` (giả định §2).
        await page.goto(readerUrl(LESSON_VIDEO))
        await dismissCookieBanner(page)

        // bài VIDEO không có bản ghi `/lessons/{id}/content` → KHÔNG có `#lesson-article`;
        // chờ dương ở đây là chính cái card "Học với FrosTES"
        const studyCard = page.getByText("Học với FrosTES").first()
        await expect(studyCard).toBeVisible({ timeout: RENDER_TIMEOUT })
        await studyCard.scrollIntoViewIfNeeded()
        await page.waitForTimeout(HYDRATE_MS)

        const flashTile = page.getByRole("button", { name: /Thẻ ghi nhớ FrosTES/ })
        await expect(flashTile).toBeVisible()
        await flashTile.click()

        // Sinh nội dung TỰ CHẠY khi mở tool (useEffect lúc mount) — không có nút "Tạo".
        // Trong lúc stream chỉ có skeleton; thẻ chỉ parse SAU khi stream kết thúc.
        await expect(page.getByText(/Thẻ 1\/\d+/)).toBeVisible({ timeout: AI_TIMEOUT })

        const flipCard = page.getByRole("button", { name: "Lật thẻ" })
        await expect(flipCard).toBeVisible()
        await expect(flipCard).toContainText("Câu hỏi")
        await flipCard.click()
        await expect(flipCard).toContainText("Đáp án")

        // sang thẻ kế: nút đổi nhãn "Xem đáp án" → "Thẻ sau" khi thẻ đã lật
        await page.getByRole("button", { name: "Thẻ sau" }).click()
        await expect(page.getByText(/Thẻ 2\/\d+/)).toBeVisible({ timeout: 15_000 })
    })

    test("(d2) chấm 1 thẻ rồi reload — tiến độ SM-2 do server giữ, còn nguyên", async ({ page }) => {
        test.setTimeout(180_000)

        const flashcardsUrl = `${API_BASE}/subjects/${SUBJECT_CODE}/practice/flashcards`

        const before = await dataOf<FlashcardDecks>(
            await api.get(flashcardsUrl, { headers: await studentAuth() }),
        )
        const deck = before.decks[0]
        test.skip(
            !deck || deck.cards.length === 0,
            `subject ${SUBJECT_CODE} has no curated flashcard deck to review`,
        )
        const beforeById = new Map(deck.cards.map((card) => [card.id, card.progress]))

        await loginAs(page, "student")
        await page.goto(`/vi/subjects/${SUBJECT_CODE}/practice`)
        await dismissCookieBanner(page)

        // hub → mở module Flashcards (nút "Mở" lặp lại ở cả 4 thẻ nên phải khoanh vùng)
        const flashModule = page
            .getByText("Flashcards", { exact: true })
            .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]")
        await expect(flashModule).toBeVisible({ timeout: RENDER_TIMEOUT })
        await page.waitForTimeout(HYDRATE_MS)
        await flashModule.getByRole("button", { name: "Mở" }).click()

        // reviewer đã lên: có bộ đếm "Thẻ i/n" và mặt trước thẻ
        await expect(page.getByText(/Thẻ 1\/\d+/)).toBeVisible({ timeout: 30_000 })
        const card = page.getByRole("button", { name: "Lật thẻ" })
        await expect(card).toBeVisible()
        const frontText = (await card.innerText()).trim()
        const graded = deck.cards.find((entry) => frontText.includes(entry.front))
        expect(graded, `card on screen ("${frontText.slice(0, 60)}…") must exist in the deck payload`)
            .toBeTruthy()
        if (!graded) return

        // lật → hàng chấm SM-2 4 mức mới hiện
        await card.click()
        await expect(page.getByText("Bạn nhớ thẻ này thế nào?")).toBeVisible({ timeout: 15_000 })

        // chấm "Được" (grade 4) — server chạy SM-2 và LƯU, response patch lại cache.
        // Tên khả truy cập của nút gồm cả dòng xem trước khoảng ôn ("Được 3 ngày") → regex.
        const reviewPost = page.waitForResponse(
            (res) =>
                /\/practice\/flashcards\/[^/]+\/review$/.test(res.url()) &&
                res.request().method() === "POST",
            { timeout: 30_000 },
        )
        await page.getByRole("button", { name: /^Được/ }).click()
        const reviewRes = await reviewPost
        expect(reviewRes.status(), "review POST must succeed").toBe(200)

        // RELOAD: tiến độ phải đến từ server, không phải state component
        await page.reload()
        await dismissCookieBanner(page)

        const after = await dataOf<FlashcardDecks>(
            await api.get(flashcardsUrl, { headers: await studentAuth() }),
        )
        const afterCard = after.decks
            .flatMap((entry) => entry.cards)
            .find((entry) => entry.id === graded.id)
        expect(afterCard?.progress, "graded card must carry persisted SM-2 progress").toBeTruthy()
        if (!afterCard?.progress) return

        const priorProgress = beforeById.get(graded.id) ?? null
        // SM-2 đã tiến: số lần ôn tăng, mốc ôn gần nhất mới hơn, lịch ôn kế đẩy về tương lai
        expect(afterCard.progress.repetitions).toBeGreaterThan(priorProgress?.repetitions ?? -1)
        expect(afterCard.progress.lastGrade).toBe(4)
        expect(afterCard.progress.status).not.toBe("NEW")
        expect(new Date(afterCard.progress.dueAt ?? 0).getTime()).toBeGreaterThan(Date.now())
        if (priorProgress?.lastReviewedAt && afterCard.progress.lastReviewedAt) {
            expect(new Date(afterCard.progress.lastReviewedAt).getTime()).toBeGreaterThan(
                new Date(priorProgress.lastReviewedAt).getTime(),
            )
        }

        // …và UI SAU RELOAD đọc lại đúng trạng thái đã lưu: chip "N thẻ đến hạn" của
        // reviewer phải khớp `dueCount` server trả về (thẻ vừa chấm "Được" bị đẩy khỏi
        // hàng đến hạn, nên con số này là bằng chứng UI không dựng lại từ state cũ).
        const flashModuleAgain = page
            .getByText("Flashcards", { exact: true })
            .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]")
        await expect(flashModuleAgain).toBeVisible({ timeout: RENDER_TIMEOUT })
        await page.waitForTimeout(HYDRATE_MS)
        await flashModuleAgain.getByRole("button", { name: "Mở" }).click()
        await expect(page.getByText(/Thẻ 1\/\d+/)).toBeVisible({ timeout: 30_000 })
        if (after.dueCount > 0) {
            await expect(page.getByText(`${after.dueCount} thẻ đến hạn`)).toBeVisible({
                timeout: 30_000,
            })
        }
    })
})
