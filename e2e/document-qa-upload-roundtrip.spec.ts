import { expect, test } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 3 (2026-07-26) — TRỌN VÒNG bằng tay: upload qua UI → hỏi AI về đúng file
 * vừa tải lên → tải file về.
 *
 * Ingest là BẤT ĐỒNG BỘ (upload trả 200 ngay, index có sau ~10-20s) nên panel hiện banner
 * "đang xử lý" + nút "Thử lại" là ĐÚNG THIẾT KẾ; chỉ coi là lỗi nếu quá 2 phút vẫn chưa trả lời.
 */

test.describe.configure({ timeout: 300_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/** Nội dung chỉ trả lời được nếu AI thật sự đọc file (số liệu bịa riêng cho lượt chạy này). */
const SECRET = (stamp: number) => `# Quy chế phòng lab FTES (bản E2E ${stamp})

## Giờ mở cửa
Phòng lab B${stamp % 100} mở từ 7h15 đến 21h45 các ngày trong tuần.

## Quy định
- Mỗi sinh viên được giữ chỗ tối đa 137 phút mỗi lượt.
- Đặt chỗ trước 3 tiếng, huỷ muộn quá 2 lần bị khoá đặt chỗ 9 ngày.
- Mã cửa lab đổi mỗi thứ Ba.`

test("upload tài liệu qua UI → hỏi AI đúng nội dung file vừa tải lên", async ({ page, request }) => {
    const stamp = Date.now() % 100000
    const title = `E2E V3 quy chế lab ${stamp}`

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto("/vi/resources/upload")
    await viewer
    await expect(page.getByText("Tải lên tài nguyên")).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500) // hydrate

    await page.getByRole("textbox", { name: /Tiêu đề/ }).first().fill(title)
    await page.locator('input[type="file"]').setInputFiles({
        name: `quy-che-lab-${stamp}.md`,
        mimeType: "text/markdown",
        buffer: Buffer.from(SECRET(stamp), "utf8"),
    })

    // Loại tài nguyên PHẢI khớp đuôi tệp (.md chỉ hợp lệ với "Ghi chú"/NOTES) và môn là bắt buộc —
    // thiếu một trong hai thì nút "Tải lên" vẫn tắt.
    await page.locator("select").nth(0).selectOption({ label: "Ghi chú" })
    await page.locator("select").nth(1).selectOption({ label: "PRF192 — Nhập môn lập trình" })

    const submit = page.getByRole("button", { name: "Tải lên" })
    await expect(submit).toBeEnabled({ timeout: 20_000 })
    await submit.click()

    // Wizard xong thì có màn "Đã gửi tài liệu" + lối "Xem tài liệu" — đi bằng chính nút đó.
    await expect(page.getByText("Đã gửi tài liệu").first()).toBeVisible({ timeout: 60_000 })
    await page.getByRole("link", { name: "Xem tài liệu" }).or(page.getByRole("button", { name: "Xem tài liệu" })).first().click()
    await expect(page).toHaveURL(/\/resources\/[0-9a-f-]{36}/, { timeout: 30_000 })
    const resourceId = new URL(page.url()).pathname.split("/").pop() as string
    expect(resourceId).toMatch(/^[0-9a-f-]{36}$/)
    await page.goto(`/vi/resources/${resourceId}?ask=1`)

    const composer = page.getByRole("textbox", { name: /Hỏi về tài liệu này/ })
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500)

    await composer.fill("Mỗi sinh viên được giữ chỗ tối đa bao nhiêu phút mỗi lượt?")
    await page.getByRole("button", { name: "Gửi" }).click()

    // Ingest chạy nền: lượt đầu có thể "đang xử lý" → bấm "Thử lại" tối đa 6 lần (~2 phút).
    const answered = page.getByText(/Trả lời bởi/)
    const retry = page.getByRole("button", { name: "Thử lại" })
    for (let attempt = 0; attempt < 6; attempt += 1) {
        if (await answered.count()) break
        if (await retry.count()) {
            await page.waitForTimeout(15_000)
            await retry.first().click()
        } else {
            await page.waitForTimeout(5_000)
        }
    }

    await expect(answered.first(), `sau 2 phút vẫn chưa trả lời — resourceId=${resourceId}`).toBeVisible({
        timeout: 30_000,
    })
    const panel = await page.locator("#resource-ai-qa").innerText()
    expect(panel, `câu trả lời phải mang con số CHỈ CÓ trong file vừa upload (resourceId=${resourceId})`).toMatch(/137/)

    await page.screenshot({ path: "test-results/vong3-upload-roi-hoi-ai.png" })
})

test("tải xuống tài liệu PDF vừa upload → nhận đúng file, không 401", async ({ page, request }) => {
    const stamp = Date.now() % 100000
    const title = `E2E V3 pdf ${stamp}`
    const headers = { authorization: `Bearer ${await fetchToken("student")}` }

    // PDF tối thiểu hợp lệ (đủ để chứng minh đường tải xuống, không cần lớp text).
    const pdf = Buffer.from(
        `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`,
        "utf8",
    )
    const created = await request.post(`${API}/resources`, {
        headers,
        data: { title, type: "PDF", subjectId: "b79a7192-932e-4427-9b97-d171650638ab", visibility: "PUBLIC", license: "CC_BY" },
    })
    expect(created.status()).toBe(200)
    const id = ((await created.json()).data as { id: string }).id
    const uploaded = await request.post(`${API}/resources/${id}/versions`, {
        headers,
        multipart: { file: { name: `e2e-${stamp}.pdf`, mimeType: "application/pdf", buffer: pdf } },
    })
    expect(uploaded.status(), await uploaded.text()).toBe(200)

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}`)
    await viewer
    await page.waitForTimeout(1_500)

    // Bấm nút Tải trên UI → phải nhận được FILE THẬT. Trước bản vá, FE mở URL Cloudinary và
    // người dùng lãnh 401; nay đi `GET /resources/{id}/download` (BE stream) nên có download event.
    const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60_000 }),
        page.getByRole("button", { name: /^Tải/ }).first().click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const bytes = Buffer.concat(chunks)
    expect(bytes.subarray(0, 5).toString(), "file tải về phải là PDF thật").toBe("%PDF-")
    expect(bytes.length).toBeGreaterThan(50)
})
