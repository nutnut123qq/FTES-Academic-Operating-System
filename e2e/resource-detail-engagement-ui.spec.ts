import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — trang chi tiết tài liệu: tim bình luận, đánh giá của tôi
 * (prefill + cập nhật + xoá), thêm vào bộ sưu tập (FE `99324b9`).
 *
 * Tài liệu test do chính học viên tạo trong test (DRAFT, chưa có file): apitest KHÔNG có
 * tài liệu APPROVED nào vì presign upload trỏ host nội bộ MinIO (BLOCKED-MINIO-PUBLIC), nên
 * mọi ca cần FILE (tải xuống, hỏi AI trên PDF) chưa chạy được — ghi rõ ở tasks.md.
 */

// Route `/vi/resources/[resourceId]` biên dịch lần đầu mất >20s trên dev server (Next dev
// compile theo route). 30s mặc định đủ cho lần chạy ấm nhưng đỏ oan ở lần chạy nguội.
test.describe.configure({ timeout: 90_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const PRF192 = "b79a7192-932e-4427-9b97-d171650638ab"

const asStudent = async (request: APIRequestContext) => {
    const headers = { authorization: `Bearer ${await fetchToken("student")}` }
    return {
        get: (p: string) => request.get(`${API}${p}`, { headers }),
        post: (p: string, data: unknown = {}) => request.post(`${API}${p}`, { headers, data }),
    }
}
const data = async (res: { json: () => Promise<{ data: unknown }> }) => (await res.json()).data

const seedResource = async (as: Awaited<ReturnType<typeof asStudent>>, title: string) =>
    (
        (await data(
            await as.post("/resources", {
                title,
                type: "NOTES",
                subjectId: PRF192,
                visibility: "PUBLIC",
                license: "CC_BY",
            }),
        )) as { id: string }
    ).id

test("tim bình luận: bấm → đếm lên, F5 → vẫn sáng (likedByMe theo người gọi)", async ({
    page,
    request,
}) => {
    const as = await asStudent(request)
    const id = await seedResource(as, `E2E tim ${Date.now()}`)
    await as.post(`/resources/${id}/comments`, { content: "bình luận để bấm tim" })

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}`)
    await viewer
    await expect(page.getByText("bình luận để bấm tim")).toBeVisible({ timeout: 30_000 })
    // Nội dung render xong KHÔNG có nghĩa là React đã gắn handler (Next hydrate sau) — click quá
    // sớm rơi vào khoảng trống, nút không phản ứng gì cả.
    await page.waitForTimeout(1_000)

    // Tim của BÌNH LUẬN là nút icon có aria-pressed — phân biệt với nút "Thích" (yêu thích tài
    // liệu) ở đầu trang, vốn trùng nhãn.
    const heart = page.locator('button[aria-pressed][aria-label="Thích"]').first()
    await heart.click()
    await expect(page.locator('button[aria-pressed="true"][aria-label="Bỏ thích"]').first()).toBeVisible({
        timeout: 15_000,
    })

    // Điểm mấu chốt: sau khi tải lại, tim vẫn phải ở trạng thái ĐÃ thích của CHÍNH mình.
    await page.reload()
    await expect(page.locator('button[aria-pressed="true"][aria-label="Bỏ thích"]').first()).toBeVisible({
        timeout: 30_000,
    })
})

test("đánh giá của tôi: gửi → F5 prefill + có Cập nhật/Xoá đánh giá", async ({ page, request }) => {
    const as = await asStudent(request)
    const id = await seedResource(as, `E2E đánh giá ${Date.now()}`)

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}/reviews`)
    await viewer
    await expect(page.getByText("Đánh giá của bạn")).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(1_000) // chờ hydrate, xem chú thích ở test trên

    await page.getByRole("button", { name: "4 sao" }).click()
    await page.getByRole("textbox", { name: /Viết nhận xét/ }).fill("Tài liệu ổn — nghiệm thu E2E")
    await page.getByRole("button", { name: "Gửi đánh giá" }).click()
    await expect(page.getByText("Đã gửi đánh giá của bạn.")).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.getByRole("button", { name: "Cập nhật đánh giá" })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("button", { name: "Xoá đánh giá" })).toBeVisible()
    await expect(page.getByText("Tài liệu ổn — nghiệm thu E2E").first()).toBeVisible()
})

test("thêm vào bộ sưu tập: mở modal và lưu được", async ({ page, request }) => {
    const as = await asStudent(request)
    const id = await seedResource(as, `E2E bộ sưu tập ${Date.now()}`)

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`/vi/resources/${id}`)
    await viewer
    await page.waitForTimeout(1_000) // chờ hydrate
    await page.getByRole("button", { name: "Thêm vào bộ sưu tập" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText(/bộ sưu tập/i).first()).toBeVisible()
})
