import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test"

import { fetchToken, loginAs } from "./helpers/auth"

/**
 * Nghiệm thu VÒNG KHÉP KÍN "soạn khoá → học viên thấy", chạy trên CẢ HAI surface:
 *
 *   (1) Admin CMS (Vite, :5173) — vai admin, đăng nhập bằng FORM thật (store admin giữ access token
 *       trong memory, chỉ refresh token vào localStorage nên không seed session kiểu FE được):
 *         L1 — tab "Bài học": thêm 1 bài mới, tên mang MỐC THỜI GIAN, lưu (popup gọi BE ngay).
 *         L2 — trang soạn bài của bài DOCUMENT: đổi tiêu đề + đổi nội dung markdown, lưu.
 *         L3 — trang soạn bài của bài VIDEO: đổi mức học thử sang giá trị KHÁC hiện tại, lưu.
 *   (2) FE học viên (Next.js, :3000) — vai student:
 *         L4 — mở lại trang khoá: bài MỚI có trong syllabus + bài DOCUMENT mang TIÊU ĐỀ MỚI.
 *         L5 — mốc HỌC THỬ MỚI tới được học viên (chốt qua payload syllabus; thêm chip đếm ngược
 *              trên trình phát khi người xem thực sự đang ở chế độ học thử).
 *         L6 — mở bài DOCUMENT trong reader: thấy NỘI DUNG MỚI (dấu mốc vừa ghi).
 *
 * ĐỌC KỸ MẤY ĐIỂM SAU TRƯỚC KHI SỬA FILE NÀY
 *
 * - **Tên nội dung tạo ra luôn ASCII + timestamp.** Không dùng dấu tiếng Việt cho dữ liệu spec tự
 *   sinh: đường ống shell/CLI trên Windows từng làm hỏng UTF-8 và biến khẳng định thành dương giả.
 *   Dữ liệu SẴN CÓ trên apitest thì vẫn có dấu — chỉ tránh cho chuỗi mình tự ghi.
 * - **Chỉ thêm/sửa, KHÔNG xoá.** Bài DOCUMENT `LESSON_DOC` chứa con số bí mật `4271` mà spec khác
 *   (document-QA) chấm điểm trên đó → L2 GIỮ nguyên thân bài, chỉ CHÈN 1 dòng dấu mốc lên đầu và
 *   dọn dấu mốc của lần chạy trước. L2 assert con số bí mật vẫn còn trước khi ghi.
 * - **Dấu mốc nội dung đặt ở ĐẦU bài, không phải cuối** — nếu bài bị gate học thử theo % thì phần
 *   cuối bị cắt, assert ở cuối sẽ đỏ vì paywall chứ không phải vì lưu hỏng.
 * - **Chờ DƯƠNG, không assert phủ định.** Mọi bước đều chốt bằng một trạng thái xuất hiện (message
 *   antd, giá trị đọc lại từ REST, chip đếm ngược), không dùng kiểu "không thấy chữ lỗi".
 * - **Hydrate ~1.5s** sau khi khối nội dung render rồi mới click, nếu không click rơi vào hư không.
 * - `waitForViewer()` KHÔNG dùng ở đây: route `/vi/courses/...` không phát GraphQL `me` nên chờ sẽ
 *   treo 30s rồi mới đỏ.
 *
 * Chạy: `npx playwright test course-authoring-closed-loop --project=desktop --reporter=list`
 * (cần `FTES_TEST_PASSWORD` + `FTES_ADMIN_PASSWORD`; cả hai dev server phải sống).
 */

test.describe.configure({ mode: "serial", timeout: 300_000 })

const ADMIN = process.env.ADMIN_BASE_URL ?? "http://localhost:5173"
const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/** Khoá + node nghiệm thu đã dựng sẵn trên apitest (dùng lại, KHÔNG tạo khoá mới mỗi lần chạy). */
const COURSE_ID = "20214b93-6bfd-4f1b-845a-7da4ea29032c"
const COURSE_SLUG = "e2e-v4-course-505089-ccf58cc7"
const SECTION_ID = "a991489f-ca3b-4471-ac73-90c3afe113a9"
const LESSON_VIDEO = "0bc26447-fa2f-4760-9519-eb14a590767d"
const LESSON_DOC = "3f74ca4c-9f88-44b2-bccf-3aaaa4caee94"

/** Con số CHỈ có trong bài DOCUMENT — L2 phải bảo toàn nó khi ghi đè nội dung. */
const SECRET = "4271"

/** Mốc thời gian của LẦN CHẠY này — mọi thứ spec tự ghi đều mang mốc này để truy vết được. */
const STAMP = new Date().toISOString().replace(/[:.]/g, "-")
const LESSON_NAME_PREFIX = "E2E Loop Lesson"
const NEW_LESSON = `${LESSON_NAME_PREFIX} ${STAMP}`
const NEW_DOC_TITLE = `E2E Loop Doc ${STAMP}`
const MARK_PREFIX = "E2E-LOOP-MARK"
const CONTENT_MARK = `${MARK_PREFIX} ${STAMP}`

/**
 * Trạng thái bắc cầu giữa các ca (describe chạy `serial` → cùng một worker, module chỉ nạp 1 lần).
 * `0` = ca L3 chưa chạy xong; L5 skip thay vì so với số rác.
 */
let trialSecondsBefore = 0
let trialSecondsTarget = 0

// ────────────────────────────── helper dùng chung ──────────────────────────────

/**
 * Đăng nhập Admin CMS bằng FORM thật (không seed được token vì store giữ trong memory).
 *
 * BẮT BUỘC tick "Ghi nhớ đăng nhập": `features/auth/store.ts` chỉ ghi refresh token vào
 * `localStorage` khi có cờ remember, không thì nhét `sessionStorage`. Mọi full reload sau đó
 * phải đổi refresh token lấy access token mới; vòng đó hỏng là app đá thẳng về `/login`.
 */
const loginAdmin = async (page: Page) => {
    await page.goto(`${ADMIN}/login`)
    await page.getByLabel("Email").fill("admin.test@ftes.vn")
    await page.getByLabel("Mật khẩu").fill(process.env.FTES_ADMIN_PASSWORD ?? "")
    const remember = page.getByRole("checkbox", { name: "Ghi nhớ đăng nhập" })
    // Checkbox antd: phải CLICK thật vào nhãn (input gốc bị ẩn nên `.check()` hay trượt).
    if ((await remember.isChecked().catch(() => true)) === false) {
        await page.getByText("Ghi nhớ đăng nhập").click().catch(() => {})
    }
    await page.getByRole("button", { name: "Đăng nhập" }).click()
    await expect(page.getByText("Học thuật").first()).toBeVisible({ timeout: 60_000 })
}

/**
 * Điều hướng TRONG APP (pushState + popstate) — KHÔNG full reload, nên access token đang nằm
 * trong memory vẫn sống. Dùng làm đường lui sau khi phải đăng nhập lại: `page.goto` lúc đó lại
 * là một full reload nữa, tức là lại đặt cược vào đúng vòng refresh vừa hỏng.
 * Admin CMS dùng `createBrowserRouter` (react-router) nên nó nghe `popstate`.
 */
const spaGoto = async (page: Page, path: string) => {
    await page.evaluate((target) => {
        window.history.pushState({}, "", target)
        window.dispatchEvent(new PopStateEvent("popstate"))
    }, path)
    await expect.poll(() => page.url(), { timeout: 30_000 }).toContain(path.split("?")[0])
}

/**
 * Điều hướng sâu trong Admin CMS. `page.goto` là full reload → access token trong memory mất, app
 * phải đổi refresh token lấy token mới; nếu vòng đó hỏng thì app đá về `/login`. Bắt đúng trường hợp
 * đó và đăng nhập lại, thay vì để ca sau đỏ với thông báo vô nghĩa ("không thấy card ...").
 */
/**
 * Chờ Admin CMS "hạ cánh" sau một full load rồi vá lại phiên nếu cần.
 *
 * ★ KHÔNG đọc `page.url()` ngay sau `domcontentloaded`: lúc đó app chưa chạy xong vòng đổi
 * refresh token, URL VẪN là route đích rồi mới bị đá về `/login` vài trăm ms sau. Kiểm sớm như
 * vậy luôn thấy "chưa ở /login" → bỏ qua nhánh đăng nhập lại → mọi locator sau đó chờ vô vọng
 * trên màn đăng nhập (đúng cảnh đã đỏ 2 lần ở L1/L2). Phải chờ tới khi app tự quyết: hoặc lên
 * được shell (menu "Học thuật"), hoặc hiện form đăng nhập.
 */
const settleAdmin = async (page: Page, path: string) => {
    const shell = page.getByText("Học thuật").first()
    const loginButton = page.getByRole("button", { name: "Đăng nhập" })
    const state = async () => {
        if (await shell.isVisible().catch(() => false)) return "shell"
        if (await loginButton.isVisible().catch(() => false)) return "login"
        return "pending"
    }
    await expect.poll(state, { timeout: 60_000 }).not.toBe("pending")
    if ((await state()) === "login") {
        await loginAdmin(page)
        await spaGoto(page, path)
    }
}

const gotoAdmin = async (page: Page, path: string) => {
    await page.goto(`${ADMIN}${path}`)
    await page.waitForLoadState("domcontentloaded")
    await settleAdmin(page, path)
}

/**
 * Tải lại một trang Admin CMS. `page.reload()` cũng là full reload nên dính ĐÚNG cái bẫy của
 * {@link gotoAdmin}: access token nằm trong memory bị mất, app phải đổi refresh token; vòng đó
 * hỏng thì app đá về `/login` và mọi locator sau đó "không tồn tại" (đã bắt được đúng snapshot
 * màn đăng nhập ở lần chạy 2026-07-27). Dùng helper này thay cho `page.reload()` khi còn phải
 * assert tiếp — vòng "đọc lại từ BE" vẫn nguyên vẹn vì sau khi đăng nhập lại ta điều hướng lại
 * đúng `path` và dữ liệu vẫn phải do BE trả về.
 */
const reloadAdmin = async (page: Page, path: string) => {
    await page.reload()
    await page.waitForLoadState("domcontentloaded")
    await settleAdmin(page, path)
}

/**
 * Chờ MỘT ô nhập bất kỳ trên trang mang đúng `value`.
 *
 * Bảng bài học của tab "Bài học" render tiêu đề bằng `<Input value=...>` (sửa tại chỗ) chứ không phải
 * text node → `getByText` không bao giờ khớp, còn `input[value="..."]` đọc ATTRIBUTE nên stale với
 * component controlled của React. Phải đọc PROPERTY `.value` thật.
 */
const expectSomeInputToHaveValue = async (page: Page, value: string, message: string) => {
    await expect
        .poll(
            async () =>
                page
                    .locator("input")
                    .evaluateAll(
                        (els, v) =>
                            els.some((el) => (el as unknown as HTMLInputElement).value === v),
                        value,
                    ),
            { timeout: 30_000, message },
        )
        .toBe(true)
}

/** Chờ có/không trong `ms` mà KHÔNG làm đỏ ca — dùng để ĐO hành vi (cần hard-refresh hay không). */
const becomesVisible = async (locator: Locator, ms: number): Promise<boolean> =>
    locator
        .first()
        .waitFor({ state: "visible", timeout: ms })
        .then(() => true)
        .catch(() => false)

/** Đọc cấu hình học thử của một bài qua REST (nguồn sự thật để chấm ca UI). */
const readPreview = async (
    request: APIRequestContext,
    lessonId: string,
    token: string,
): Promise<{ previewSeconds: number | null; effectivePreviewSeconds: number }> => {
    const res = await request.get(`${API}/lessons/${lessonId}/preview`, {
        headers: { authorization: `Bearer ${token}` },
    })
    expect(res.status(), await res.text()).toBe(200)
    const body = (await res.json()) as {
        data?: { previewSeconds: number | null; effectivePreviewSeconds: number }
    }
    const data = body.data
    if (!data) throw new Error(`GET /lessons/${lessonId}/preview không trả data`)
    return data
}

/** Một bài học như trang chi tiết khoá trả về cho FE. */
interface CatalogLesson {
    id: string
    name: string
    previewSeconds: number | null
}

/** Đọc syllabus của khoá theo slug (đúng payload mà trang khoá của FE tiêu thụ). */
const readCatalogLessons = async (
    request: APIRequestContext,
    token: string,
): Promise<Array<CatalogLesson>> => {
    const res = await request.get(`${API}/courses/${COURSE_SLUG}`, {
        headers: { authorization: `Bearer ${token}` },
    })
    expect(res.status(), await res.text()).toBe(200)
    const body = (await res.json()) as {
        data?: { sections?: Array<{ lessons?: Array<CatalogLesson> }> }
    }
    return (body.data?.sections ?? []).flatMap((section) => section.lessons ?? [])
}

/**
 * Dọn bài học do các LẦN CHẠY TRƯỚC của chính spec này sinh ra (tên bắt đầu bằng `E2E Loop Lesson `).
 * Không có bước này thì mỗi lần chạy lại phình khoá nghiệm thu thêm một bài rác. Best-effort: hỏng
 * thì bỏ qua, KHÔNG làm đỏ ca — dọn dẹp không phải thứ đang được nghiệm thu.
 */
const cleanupPreviousLoopLessons = async (request: APIRequestContext, token: string) => {
    try {
        const lessons = await readCatalogLessons(request, token)
        for (const lesson of lessons.filter((l) => l.name?.startsWith(`${LESSON_NAME_PREFIX} `))) {
            await request.delete(`${API}/courses/lessons/${lesson.id}`, {
                headers: { authorization: `Bearer ${token}` },
            })
        }
    } catch {
        // im lặng: khoá vẫn dùng được, chỉ là còn bài rác của lần chạy trước
    }
}

// ─────────────────────────── (1) Admin CMS — vai admin ───────────────────────────

test('L1 [admin] tab "Bài học": thêm bài mới có mốc thời gian → lưu và còn sau khi tải lại', async ({
    page,
    request,
}) => {
    await cleanupPreviousLoopLessons(request, await fetchToken("admin"))

    await loginAdmin(page)
    // `?tab=lessons` được CourseDetailPage seed thẳng vào activeKey (LessonEditPage cũng quay lại
    // bằng link này) — vẫn click tab cho chắc, click lại tab đang mở là vô hại.
    await gotoAdmin(page, `/academic/courses/${COURSE_ID}?tab=lessons`)
    await page.getByRole("tab", { name: "Bài học" }).click()

    // Neo DƯƠNG của LessonListTab (tab "Nội dung" là CourseTreeEditor, UI hoàn toàn khác nhưng cũng
    // có nút tên "Thêm chương"/"Thêm bài học" → phải neo bằng tiêu đề riêng của tab này).
    await expect(page.getByText("Danh sách bài học")).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1500)

    // "Thêm bài học" nằm trong `extra` của từng Card chương; lấy chương đầu (khoá nghiệm thu 1 chương).
    const addLesson = page.getByRole("button", { name: "Thêm bài học" }).first()
    await expect(addLesson).toBeEnabled({ timeout: 30_000 })
    await addLesson.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible({ timeout: 30_000 })
    // Loại "Tài liệu" (DOCUMENT): không cần videoRef nên popup tạo được ngay, không phụ thuộc storage.
    await dialog.locator(".ant-segmented-item").filter({ hasText: "Tài liệu" }).click()
    await dialog.getByLabel("Tên bài học").fill(NEW_LESSON)
    await dialog.getByRole("button", { name: "Tạo bài học" }).click()

    // Popup gọi BE NGAY (không đi qua nút "Lưu thay đổi" của draft store) → message là mốc "đã lưu".
    await expect(page.getByText("Đã tạo bài học")).toBeVisible({ timeout: 60_000 })

    // Chốt bằng vòng tải lại: bài phải do BE trả về, không phải chỉ nằm trong draft store phía client.
    await reloadAdmin(page, `/academic/courses/${COURSE_ID}?tab=lessons`)
    await page.getByRole("tab", { name: "Bài học" }).click()
    await expect(page.getByText("Danh sách bài học")).toBeVisible({ timeout: 60_000 })
    await expectSomeInputToHaveValue(
        page,
        NEW_LESSON,
        `bài "${NEW_LESSON}" phải còn trong danh sách sau khi tải lại trang`,
    )
})

test("L2 [admin] bài DOCUMENT: đổi tiêu đề + đổi nội dung markdown, cả hai lưu được", async ({
    page,
}) => {
    await loginAdmin(page)
    await gotoAdmin(page, `/academic/courses/${COURSE_ID}/lessons/${LESSON_DOC}`)

    // ── tiêu đề (Card "Thông tin bài học", nút "Lưu" ở `extra`, disabled khi chưa dirty) ──
    const infoCard = page.locator(".ant-card").filter({ hasText: "Thông tin bài học" }).first()
    await expect(infoCard).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1500)
    await infoCard.locator("input").first().fill(NEW_DOC_TITLE)
    // KHÔNG dùng `exact: true`: nút antd có icon → tên trợ năng là "save Lưu" (icon `<span role="img"
    // aria-label="save">` cộng vào), `exact` sẽ không bao giờ khớp. Khớp chứa + scope theo card là đủ.
    const saveMeta = infoCard.getByRole("button", { name: "Lưu" })
    await expect(saveMeta, "nút Lưu phải bật khi tiêu đề đã đổi").toBeEnabled({ timeout: 15_000 })
    await saveMeta.click()
    await expect(page.getByText("Đã lưu thông tin bài học")).toBeVisible({ timeout: 60_000 })

    // ── nội dung markdown ──
    // Card "Nội dung" (ngoài) bọc 2 Card con "Source markdown" + "Preview"; cả hai lớp đều khớp
    // filter hasText → `.last()` là card con chứa textarea, `.first()` là card ngoài chứa toolbar.
    const contentOuter = page.locator(".ant-card").filter({ hasText: "Source markdown" }).first()
    const contentInner = page.locator(".ant-card").filter({ hasText: "Source markdown" }).last()
    const source = contentInner.locator("textarea").first()
    await expect(source).toBeVisible({ timeout: 60_000 })

    const current = await source.inputValue()
    expect(
        current,
        `thân bài phải còn con số bí mật ${SECRET} (spec document-QA chấm điểm trên nó)`,
    ).toContain(SECRET)

    // Dọn dấu mốc của những lần chạy TRƯỚC rồi chèn dấu mốc mới lên ĐẦU bài (đầu bài luôn nằm trong
    // phần học thử, nên học viên đọc được kể cả khi bài bị cắt theo %). Thân bài giữ nguyên.
    const cleaned = current
        .split("\n")
        .filter((line) => !line.trimStart().startsWith(MARK_PREFIX))
        .join("\n")
        .trim()
    await source.fill(`${CONTENT_MARK}\n\n${cleaned}\n`)

    // Trang có 3 nút chữ "Lưu" (thông tin bài / toolbar nội dung / học thử) → BẮT BUỘC scope theo card.
    await contentOuter.getByRole("button", { name: "Lưu" }).click()
    await expect(page.getByText("Đã lưu nội dung bài học")).toBeVisible({ timeout: 60_000 })

    // Tải lại: giá trị phải tới từ BE, không phải draft store trong localStorage.
    await reloadAdmin(page, `/academic/courses/${COURSE_ID}/lessons/${LESSON_DOC}`)
    const reloaded = page.locator(".ant-card").filter({ hasText: "Source markdown" }).last().locator("textarea").first()
    await expect(reloaded).toBeVisible({ timeout: 60_000 })
    await expect
        .poll(async () => (await reloaded.inputValue()).includes(CONTENT_MARK), {
            timeout: 30_000,
            message: "nội dung mới phải còn sau khi tải lại trang soạn bài",
        })
        .toBe(true)
    expect(await reloaded.inputValue(), "con số bí mật vẫn phải còn").toContain(SECRET)
})

test("L3 [admin] bài VIDEO: đổi mức học thử sang giá trị KHÁC giá trị hiện tại", async ({
    page,
    request,
}) => {
    const adminToken = await fetchToken("admin")
    const before = await readPreview(request, LESSON_VIDEO, adminToken)
    trialSecondsBefore = before.effectivePreviewSeconds
    // Luân phiên 150 ⇄ 300 giây: chạy lại spec vẫn luôn tạo ra một giá trị KHÁC lần trước.
    trialSecondsTarget = before.previewSeconds === 150 ? 300 : 150

    await loginAdmin(page)
    await gotoAdmin(page, `/academic/courses/${COURSE_ID}/lessons/${LESSON_VIDEO}`)

    // Bài VIDEO → LessonTrialConfig chỉnh SỐ GIÂY (bài DOCUMENT mới chỉnh phần trăm).
    const trial = page.locator(".ant-card").filter({ hasText: "Thời gian học thử" }).first()
    await expect(trial).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1500)

    // Switch "Cho học thử": tắt = ô số bị disabled, phải bật trước mới nhập được.
    const toggle = trial.getByRole("switch")
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
        await toggle.click()
    }
    await expect(toggle).toHaveAttribute("aria-checked", "true")

    const seconds = trial.locator("input.ant-input-number-input")
    await expect(seconds).toBeEnabled({ timeout: 15_000 })
    await seconds.fill(String(trialSecondsTarget))
    await seconds.blur()

    await trial.getByRole("button", { name: "Lưu" }).click()
    await expect(page.getByText("Đã lưu cấu hình học thử")).toBeVisible({ timeout: 60_000 })

    // Chấm bằng REST (nguồn sự thật), không tin riêng message toast.
    const after = await readPreview(request, LESSON_VIDEO, adminToken)
    expect(after.previewSeconds, "override theo bài phải bằng giá trị vừa nhập").toBe(
        trialSecondsTarget,
    )
    expect(after.effectivePreviewSeconds, "mốc hiệu lực phải là giá trị MỚI").toBe(
        trialSecondsTarget,
    )
    expect(
        after.effectivePreviewSeconds,
        "mốc mới phải KHÁC mốc cũ, nếu không ca L5 chấm dương giả",
    ).not.toBe(trialSecondsBefore)
})

// ─────────────────────────── (2) FE học viên — vai student ───────────────────────────

test("L4 [student] trang khoá: thấy bài MỚI trong syllabus + bài DOCUMENT mang tiêu đề MỚI", async ({
    page,
}) => {
    await loginAs(page, "student")
    // KHÔNG `waitForViewer`: route chi tiết khoá không phát GraphQL `me`.
    await page.goto(`/vi/courses/${COURSE_SLUG}`)
    await expect(page.getByText("E2E V4 Course").first()).toBeVisible({ timeout: 60_000 })

    const newLesson = page.getByText(NEW_LESSON)
    const newTitle = page.getByText(NEW_DOC_TITLE)

    // ĐO trước, ASSERT sau: có thấy ngay ở lần tải đầu không, hay phải hard-refresh? Nếu phải refresh
    // thì đó là phát hiện có giá trị (cache RSC/SWR giữ syllabus cũ) — ghi vào annotation của báo cáo
    // thay vì làm đỏ ca, vì hợp đồng nghiệm thu là "học viên thấy được thay đổi", không phải "thấy
    // trong đúng một lần tải".
    const firstLoadLesson = await becomesVisible(newLesson, 25_000)
    const firstLoadTitle = firstLoadLesson ? await becomesVisible(newTitle, 10_000) : false
    const freshOnFirstLoad = firstLoadLesson && firstLoadTitle

    if (!freshOnFirstLoad) {
        await page.reload()
        await expect(page.getByText("E2E V4 Course").first()).toBeVisible({ timeout: 60_000 })
    }

    const note = freshOnFirstLoad
        ? "FE hiện thay đổi NGAY ở lần tải đầu — không cần hard-refresh."
        : "FE CHỈ hiện thay đổi sau khi hard-refresh (lần tải đầu còn syllabus cũ) — nghi cache RSC/SWR."
    test.info().annotations.push({ type: "cache-behaviour", description: note })
    console.log(`[L4] ${note}`)

    await expect(
        newLesson.first(),
        `bài mới "${NEW_LESSON}" phải có trong syllabus của học viên`,
    ).toBeVisible({ timeout: 60_000 })
    await expect(
        newTitle.first(),
        `bài DOCUMENT phải hiện TIÊU ĐỀ MỚI "${NEW_DOC_TITLE}"`,
    ).toBeVisible({ timeout: 60_000 })
})

test("L5 [student] bài VIDEO: mốc học thử MỚI tới được surface học viên", async ({ page }) => {
    test.skip(trialSecondsTarget === 0, "ca L3 chưa đặt được mốc học thử mới")

    await loginAs(page, "student")

    // ── (a) chốt CỨNG: payload trang khoá mà chính FE tiêu thụ phải mang mốc MỚI ──
    // Đây là đường luôn quan sát được, không phụ thuộc học viên đã mua hay chưa.
    // PHẢI khoá theo tiền tố REST (`/api/v1/`): route trang của Next.js cũng là
    // `GET /vi/courses/{slug}` nên bộ lọc chỉ so đuôi pathname sẽ bắt được TRANG HTML rồi
    // `.json()` ném `Unexpected token '<'` (đã đỏ đúng như vậy ở lần chạy 2026-07-27).
    const detailRes = page.waitForResponse(
        (res) =>
            new URL(res.url()).pathname.endsWith(`/api/v1/courses/${COURSE_SLUG}`) &&
            res.request().method() === "GET",
        { timeout: 90_000 },
    )
    await page.goto(`/vi/courses/${COURSE_SLUG}`)
    const detail = ((await (await detailRes).json()) as {
        data?: { sections?: Array<{ lessons?: Array<CatalogLesson> }> }
    }).data
    const videoLesson = (detail?.sections ?? [])
        .flatMap((section) => section.lessons ?? [])
        .find((lesson) => lesson.id === LESSON_VIDEO)
    expect(videoLesson, "bài VIDEO phải có trong syllabus học viên nhận được").toBeTruthy()
    expect(videoLesson?.previewSeconds, "syllabus phải mang mốc học thử MỚI").toBe(
        trialSecondsTarget,
    )
    expect(videoLesson?.previewSeconds, "và phải KHÁC mốc cũ").not.toBe(trialSecondsBefore)

    // ── (b) trình phát: chip đếm ngược CHỈ tồn tại khi người xem thực sự ở chế độ học thử ──
    // CẢNH BÁO ĐÃ TRẢ GIÁ: tài khoản student.test có FULL access trên khoá nghiệm thu này (khoá
    // LEGACY giá 0 → vào reader là được free-enroll), nên `stream.mode` thường là FULL và chip
    // KHÔNG render. Ép "phải PREVIEW" ở đây là ràng buộc vào trạng thái tài khoản chứ không phải
    // vào thay đổi vừa soạn → sẽ đỏ oan. Vì vậy: PREVIEW thì chấm chip, FULL thì ghi annotation.
    const streamRes = page.waitForResponse(
        (res) =>
            res.url().includes(`/courses/lessons/${LESSON_VIDEO}/stream`) &&
            res.request().method() === "GET",
        { timeout: 90_000 },
    )
    await page.goto(
        `/vi/courses/${COURSE_SLUG}/learn/content/modules/${SECTION_ID}/contents/${LESSON_VIDEO}`,
    )
    const stream = ((await (await streamRes).json()) as { data?: Record<string, unknown> }).data

    // Ảnh bằng chứng: trình phát của bài VIDEO sau khi mốc học thử đã đổi (chip đếm ngược chỉ
    // hiện ở nhánh PREVIEW — xem cảnh báo ngay trên).
    await expect(page.getByRole("heading", { name: /Video mở đầu/ }).first()).toBeVisible({
        timeout: 90_000,
    })
    // Trình phát nhúng (iframe) cần thêm nhịp để thay chỗ placeholder "Đang tải…".
    await page.locator("iframe").first().waitFor({ state: "attached", timeout: 30_000 }).catch(() => {})
    await page.waitForTimeout(3_000)
    await page.screenshot({ path: "test-results/vong4-hoc-thu-moc-moi.png", fullPage: true })

    if (stream?.mode === "PREVIEW") {
        expect(stream?.previewSeconds, "stream học thử phải mang mốc MỚI").toBe(trialSecondsTarget)
        // Chip "Xem thử còn m:ss" ở góc trình phát: seed đúng bằng mốc rồi đếm lùi theo playback.
        const chip = page.getByText(/Xem thử còn \d+:\d{2}/).first()
        await expect(chip, "chip đếm ngược học thử phải hiện trên trình phát").toBeVisible({
            timeout: 90_000,
        })
        const matched = /(\d+):(\d{2})/.exec((await chip.textContent()) ?? "")
        expect(matched, "chip phải ở dạng m:ss").not.toBeNull()
        const shownSeconds = Number(matched?.[1] ?? 0) * 60 + Number(matched?.[2] ?? 0)
        // Nới biên 60s vì đồng hồ có thể đã chạy vài giây. Mốc cũ (900s) cách mốc mới (150/300s)
        // quá xa nên biên này không thể nuốt một dương giả.
        expect(shownSeconds).toBeLessThanOrEqual(trialSecondsTarget)
        expect(shownSeconds).toBeGreaterThan(trialSecondsTarget - 60)
    } else {
        const note = `stream.mode=${String(stream?.mode)} — học viên có FULL access trên khoá này nên chip đếm ngược không render; mốc học thử mới đã được chấm qua payload syllabus.`
        test.info().annotations.push({ type: "trial-surface", description: note })
        console.log(`[L5] ${note}`)
    }
})

test("L6 [student] bài DOCUMENT: reader hiện NỘI DUNG MỚI vừa soạn", async ({ page }) => {
    await loginAs(page, "student")
    await page.goto(
        `/vi/courses/${COURSE_SLUG}/learn/content/modules/${SECTION_ID}/contents/${LESSON_DOC}`,
    )

    await expect(
        page.getByText(CONTENT_MARK).first(),
        "dấu mốc nội dung vừa soạn phải xuất hiện trong bài đọc của học viên",
    ).toBeVisible({ timeout: 90_000 })
    await expect(
        page.getByText(SECRET).first(),
        "phần thân bài (con số bí mật) không được mất khi soạn lại",
    ).toBeVisible({ timeout: 60_000 })
})
