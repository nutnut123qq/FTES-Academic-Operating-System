import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 2 (2026-07-26) — panel "Hỏi AI về tài liệu này".
 *
 * Vòng 1 đánh BLOCKED-MINIO-PUBLIC: không tài liệu nào có file nên panel luôn ẩn. Cloudinary đã
 * lên apitest và upload đổi sang multipart server-side (`POST /resources/{id}/versions`), nên
 * giờ dựng được tài liệu CÓ FILE ngay trong test.
 *
 * Tài liệu seed dùng `.md` chứ không phải PDF: delivery `raw` của PDF/ZIP đang bị Cloudinary
 * chặn (401) trên tài khoản này, còn `.md` tải được 200 — xem báo cáo vòng 2.
 */

test.describe.configure({ timeout: 120_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const PRF192 = "b79a7192-932e-4427-9b97-d171650638ab"

const NOTE = `# Con trỏ trong C

Con trỏ là biến lưu ĐỊA CHỈ của một biến khác. Toán tử & lấy địa chỉ, toán tử * truy cập giá trị
tại địa chỉ đó. Con trỏ NULL là con trỏ chưa trỏ tới vùng nhớ hợp lệ nào.`

/** Tạo resource + nạp file thật; trả về id. */
const seedResourceWithFile = async (request: APIRequestContext, token: string) => {
    const headers = { authorization: `Bearer ${token}` }
    const created = await request.post(`${API}/resources`, {
        headers,
        data: {
            title: `E2E hỏi AI ${Date.now()}`,
            description: "tài liệu nghiệm thu hỏi đáp AI",
            type: "NOTES",
            subjectId: PRF192,
            visibility: "PUBLIC",
            license: "CC_BY",
        },
    })
    expect(created.status()).toBe(200)
    const id = ((await created.json()).data as { id: string }).id

    const uploaded = await request.post(`${API}/resources/${id}/versions`, {
        headers,
        multipart: {
            file: { name: "con-tro-trong-c.md", mimeType: "text/markdown", buffer: Buffer.from(NOTE, "utf8") },
            changelog: "E2E vòng 2",
        },
    })
    expect(uploaded.status(), await uploaded.text()).toBe(200)
    expect((await uploaded.json()).data.uploadStatus).toBe("UPLOADED")
    return id
}

test("tài liệu ĐÃ có file → panel hỏi AI hiện ra (vòng 1 luôn ẩn vì không upload được)", async ({
    page,
    request,
}) => {
    const token = await fetchToken("student")
    const id = await seedResourceWithFile(request, token)

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}`)
    await viewer

    await expect(page.locator("#resource-ai-qa")).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText("Hỏi AI về tài liệu này")).toBeVisible()
    await expect(page.getByRole("textbox", { name: /Hỏi về tài liệu này/ })).toBeVisible()
})

test("deep link ?ask=1 → cuộn tới panel và focus ô hỏi", async ({ page, request }) => {
    const token = await fetchToken("student")
    const id = await seedResourceWithFile(request, token)

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}?ask=1`)
    await viewer

    const composer = page.getByRole("textbox", { name: /Hỏi về tài liệu này/ })
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await expect(composer).toBeFocused({ timeout: 15_000 })
})

test("hỏi 1 câu → có trả lời kèm trích dẫn (hoặc báo đang xử lý + Thử lại)", async ({
    page,
    request,
}) => {
    const token = await fetchToken("student")
    const id = await seedResourceWithFile(request, token)

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}?ask=1`)
    await viewer

    const composer = page.getByRole("textbox", { name: /Hỏi về tài liệu này/ })
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500) // chờ hydrate: bấm sớm thì handler chưa gắn, gõ xong Enter rơi vào hư không
    await composer.fill("Con trỏ trong C là gì?")
    await composer.press("Enter") // Enter (không Shift) = gửi, theo composer-in-box

    // ai-service có thể chưa index xong → banner "đang xử lý" + nút "Thử lại" là kết quả HỢP LỆ
    // (BLOCKED-INFRA), nhưng im lặng hoặc lỗi trần thì không.
    const answered = page.getByText("Trích dẫn")
    const processing = page.getByText(/Đang xử lý tài liệu/)
    await expect(answered.or(processing).first()).toBeVisible({ timeout: 90_000 })

    if (await processing.count()) {
        await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible()
    }
})
