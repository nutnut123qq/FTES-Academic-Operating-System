import { expect, request, test, type Page } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E — hành trình "workplace" của môn PRF192: tab **Tài liệu** (xem học liệu,
 * mở được, nút "Hỏi AI về tài liệu này" đưa sang trang tài liệu với `?ask=1` và focus ô nhập)
 * và tab **Thảo luận** (đăng bài mới → hiện ngay trong feed → bình luận → F5 vẫn còn).
 *
 * Bài đăng trong ca thảo luận có mốc thời gian trong tiêu đề để tìm lại được, và được DỌN
 * bằng `DELETE /community/posts/{id}` ở `afterEach` — kể cả khi ca đỏ giữa chừng.
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/**
 * Mặc định 30s của Playwright không đủ: dev server biên dịch route lần đầu mất chục giây,
 * feed thảo luận đi qua GraphQL live, và ca (b) còn phải F5 rồi mở lại thread.
 */
test.describe.configure({ timeout: 180_000 })

const RESOURCES = "/vi/subjects/PRF192/resources"
const DISCUSSION = "/vi/subjects/PRF192/discussion"

/** Nhãn lệch có chủ đích: rail trái ghi "Tài liệu", heading trong tab ghi "Tài nguyên". */
const RESOURCES_HEADING = "Tài nguyên"
const ASK_AI = "Hỏi AI về tài liệu này"

/**
 * React hydrate xong SAU khi nội dung đã render — click sớm hơn thì rơi vào hư không
 * (handler chưa gắn). Chờ cờ phiên (`me`) rồi cộng thêm một nhịp cho hydrate.
 *
 * `waitForViewer` được bọc `catch` vì nó chỉ đúng với route CÓ phát GraphQL `me`; route nào
 * không phát thì ta không muốn treo cả ca — nhịp `waitForTimeout` vẫn đủ cho hydrate.
 */
const settle = async (page: Page, viewer: Promise<unknown>) => {
    await viewer.catch(() => null)
    await page.waitForTimeout(1_500)
}

/** Id bài vừa đăng trong ca đang chạy — `afterEach` xoá sạch dù ca xanh hay đỏ. */
const createdPostIds = new Set<string>()

test.afterEach(async () => {
    if (createdPostIds.size === 0) return
    const token = await fetchToken("student")
    const ctx = await request.newContext()
    for (const id of createdPostIds) {
        // Dọn là best-effort: bài đã bị xoá tay / token hết hạn không được làm ca đỏ theo.
        await ctx
            .delete(`${API_BASE}/community/posts/${id}`, {
                headers: { authorization: `Bearer ${token}` },
            })
            .catch(() => null)
    }
    await ctx.dispose()
    createdPostIds.clear()
})

/* ------------------------------------------------------------------ *
 * (a) Tab Tài liệu
 * ------------------------------------------------------------------ */

test("tab Tài liệu: học liệu của môn hiện thành hàng có đủ nút hành động", async ({ page }) => {
    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(RESOURCES)
    await expect(page.getByText(RESOURCES_HEADING)).toBeVisible({ timeout: 30_000 })
    await settle(page, viewer)

    // Assert DƯƠNG: phải có hàng học liệu thật. Danh sách rỗng / lỗi tải sẽ đỏ ở đây,
    // thay vì "không thấy chữ lỗi" (luôn đúng giả lúc đang tải).
    const askButtons = page.getByRole("button", { name: ASK_AI })
    await expect(askButtons.first()).toBeVisible({ timeout: 30_000 })
    expect(await askButtons.count()).toBeGreaterThan(0)

    // Mỗi hàng có đủ bộ điều khiển: lưu · hỏi AI · tải.
    await expect(page.getByRole("button", { name: "Tải" }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Lưu" }).first()).toBeVisible()

    // Bộ lọc kiểu là chrome tĩnh — có nó thì mới lọc được server-side.
    await expect(page.getByRole("button", { name: "Tất cả" })).toBeVisible()

    // Empty/error state của tab KHÔNG được xuất hiện khi đã có hàng.
    await expect(page.getByText("Không tải được tài nguyên.")).toHaveCount(0)
})

test("tab Tài liệu: bấm 'Hỏi AI về tài liệu này' mở đúng /resources/{id}?ask=1 và focus ô nhập", async ({
    page,
}) => {
    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(RESOURCES)
    await expect(page.getByText(RESOURCES_HEADING)).toBeVisible({ timeout: 30_000 })

    const askButton = page.getByRole("button", { name: ASK_AI }).first()
    await expect(askButton).toBeVisible({ timeout: 30_000 })
    await settle(page, viewer)
    await askButton.click()

    // Contract của `resourceAskAiHref`: uuid thật + cờ `ask=1` (trang đích đọc cờ này).
    // Timeout rộng: app-router chỉ đổi URL SAU khi route đích tải xong, mà lần đầu vào
    // `/resources/[id]` dev server còn phải biên dịch route (có thể hơn một phút).
    await expect(page).toHaveURL(
        /\/vi\/resources\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?ask=1$/,
        { timeout: 120_000 },
    )

    // Khối Hỏi AI chỉ render khi tài liệu có `currentVersionId` — thấy nó = mở đúng tài liệu
    // có bản file để grounding, không phải trang trống.
    await expect(page.getByText(ASK_AI)).toBeVisible({ timeout: 30_000 })

    const input = page.locator("#resource-ai-qa-input")
    await expect(input).toBeVisible()
    // Cờ `ask=1` phải focus ô nhập — đây là toàn bộ giá trị của deep link.
    await expect(input).toBeFocused({ timeout: 15_000 })
})

/* ------------------------------------------------------------------ *
 * (b) Tab Thảo luận
 * ------------------------------------------------------------------ */

test("tab Thảo luận: đăng bài → hiện ngay trong feed → bình luận → F5 vẫn còn", async ({ page }) => {
    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(DISCUSSION)
    await expect(page.getByText("Thảo luận môn học")).toBeVisible({ timeout: 30_000 })
    await settle(page, viewer)

    // Mốc thời gian trong tiêu đề để tìm lại bài giữa feed thật (và để dọn đúng bài).
    const stamp = `${Date.now()}`
    const postTitle = `E2E workplace ${stamp}`
    const postBody = `Bài nghiệm thu tự động lúc ${new Date().toISOString()} — mã ${stamp}.`
    const commentBody = `Bình luận nghiệm thu ${stamp}`

    // --- đăng bài ---------------------------------------------------
    await page.getByPlaceholder("Tiêu đề").fill(postTitle)
    await page.getByPlaceholder("Bạn muốn hỏi hoặc chia sẻ điều gì?").fill(postBody)

    // Nút bật SAU khi uuid môn resolve xong (route dùng code, feed cần uuid) — click sớm là no-op.
    const submit = page.getByRole("button", { name: "Đăng bài" })
    await expect(submit).toBeEnabled({ timeout: 30_000 })

    const created = page.waitForResponse(
        (res) =>
            res.url().includes("/community/posts") &&
            res.request().method() === "POST" &&
            res.status() < 400,
        { timeout: 30_000 },
    )
    await submit.click()
    const createdBody = (await (await created).json()) as { data?: { id?: string } }
    const postId = createdBody.data?.id
    expect(postId, "POST /community/posts phải trả id bài vừa tạo").toBeTruthy()
    createdPostIds.add(postId as string)

    // Không có toast thành công — assert DƯƠNG là bài xuất hiện trong feed, không cần F5.
    await expect(page.getByText(postTitle)).toBeVisible({ timeout: 30_000 })

    // --- bình luận --------------------------------------------------
    const openComments = async () => {
        const row = page
            .locator("div.rounded-2xl.border-separator")
            .filter({ hasText: postTitle })
            .filter({ has: page.getByRole("button", { name: "Bình luận" }) })
            .first()
        await expect(row).toBeVisible({ timeout: 30_000 })
        await page.waitForTimeout(1_500)
        await row.getByRole("button", { name: "Bình luận" }).click()
        const thread = page.locator(`#post-comments-${postId as string}`)
        await expect(thread).toBeVisible({ timeout: 30_000 })
        return thread
    }

    const thread = await openComments()

    // Ô soạn là TipTap contenteditable, KHÔNG phải textarea → click rồi gõ bằng bàn phím.
    const editor = thread.locator("[contenteditable='true']").first()
    await expect(editor).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(1_500)
    await editor.click()
    await page.keyboard.type(commentBody)

    const sent = page.waitForResponse(
        (res) =>
            res.url().includes(`/community/posts/${postId as string}/comments`) &&
            res.request().method() === "POST" &&
            res.status() < 400,
        { timeout: 30_000 },
    )
    await thread.getByRole("button", { name: "Gửi" }).click()
    await sent

    // `.first()`: nội dung bình luận nằm trong cả vỏ ngoài lẫn `<p>` do markdown render ra,
    // nên getByText khớp 2 node — strict mode sẽ nổ nếu không chốt một cái.
    await expect(thread.getByText(commentBody).first()).toBeVisible({ timeout: 30_000 })

    // --- F5: bài + bình luận phải là dữ liệu THẬT trên BE, không phải optimistic ---
    await page.reload()
    await expect(page.getByText("Thảo luận môn học")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(postTitle)).toBeVisible({ timeout: 30_000 })

    // Thread thu gọn sau F5 → mở lại rồi mới soi bình luận.
    const threadAfterReload = await openComments()
    await expect(threadAfterReload.getByText(commentBody).first()).toBeVisible({ timeout: 30_000 })
    // Bình luận optimistic gắn nhãn "vừa xong" của phiên trước đã biến mất cùng reload,
    // nên thấy lại nội dung = BE đã lưu thật.
})
