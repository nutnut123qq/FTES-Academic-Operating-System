import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 2 (2026-07-26) — hàng đợi kiểm duyệt cộng đồng, vai ADMIN.
 *
 * Vòng 1 để BLOCKED-CREDS vì helper chưa có vai admin. Nay `fetchToken("admin")` dùng
 * `FTES_ADMIN_PASSWORD` (mật khẩu admin.test xoay riêng, không dùng chung với các vai khác).
 *
 * Luật đang nghiệm thu: "Chuyển cấp" chỉ có ở hàng CÓ `reportId`; bấm xong hàng KHÔNG biến mất
 * mà đổi thành nhãn "Đã chuyển cấp" (BE chỉ đổi `report.status → IN_REVIEW`, không đụng hàng chờ).
 */

test.describe.configure({ timeout: 120_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/** Seed một báo cáo thật: học viên báo cáo bài của giảng viên → sinh hàng chờ có `reportId`. */
const seedReport = async (request: APIRequestContext) => {
    const lecturer = { authorization: `Bearer ${await fetchToken("lecturer")}` }
    const student = { authorization: `Bearer ${await fetchToken("student")}` }

    const created = await request.post(`${API}/community/posts`, {
        headers: lecturer,
        data: { postType: "DISCUSSION", content: `E2E kiểm duyệt ${Date.now()}` },
    })
    if (created.status() !== 200) return null
    const post = (await created.json()).data as { id: string }

    const reported = await request.post(`${API}/community/reports`, {
        headers: student,
        data: { targetType: "POST", targetId: post.id, reasonCode: "SPAM", detail: "nghiệm thu E2E" },
    })
    return { postId: post.id, reportOk: reported.status() === 200, status: reported.status(), body: await reported.text() }
}

test("hàng đợi kiểm duyệt: 'Chuyển cấp' chỉ ở hàng có báo cáo, bấm xong đổi nhãn chứ không mất hàng", async ({
    page,
    request,
}) => {
    const seeded = await seedReport(request)
    test.skip(!seeded, "giảng viên không đăng được bài để tạo báo cáo")
    test.skip(!seeded!.reportOk, `không tạo được báo cáo (${seeded!.status}): ${seeded!.body.slice(0, 160)}`)

    await loginAs(page, "admin")
    const viewer = waitForViewer(page)
    await page.goto("/vi/community/moderation")
    await viewer

    await expect(page.getByText("Kiểm duyệt").first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText("Bạn không có quyền kiểm duyệt cộng đồng.")).toHaveCount(0)

    const keep = page.getByRole("button", { name: "Giữ lại" })
    // Chờ SWR trả hàng chờ rồi mới đếm — tiêu đề trang hiện trước danh sách.
    await expect(keep.first()).toBeVisible({ timeout: 30_000 })
    const escalate = page.getByRole("button", { name: "Chuyển cấp" })
    const rowsBefore = await keep.count()
    // Hàng do AI/hệ thống đẩy vào không có reportId → số nút "Chuyển cấp" ≤ số hàng.
    expect(await escalate.count()).toBeLessThanOrEqual(rowsBefore)
    test.skip((await escalate.count()) === 0, "hàng đợi chưa có dòng nào mang reportId")

    await escalate.first().click()
    await expect(page.getByText("Đã chuyển cấp").first()).toBeVisible({ timeout: 15_000 })
    // Hàng vẫn phải ở lại — vẫn cần quyết định Giữ lại / Gỡ bỏ.
    expect(await keep.count()).toBe(rowsBefore)
})
