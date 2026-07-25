import { expect, test } from "@playwright/test"

import { loginAs } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — tab "Định hướng nghề" của môn + menu ⋯ trên feed cộng đồng
 * (FE `99324b9`).
 */

const CAREER = "/vi/subjects/PRF192/career"

test("định hướng nghề: kỹ năng hiện TÊN (không phải UUID), lộ trình/tin tuyển có nút hành động", async ({
    page,
}) => {
    await loginAs(page, "student")
    await page.goto(CAREER)

    await expect(page.getByText("Kỹ năng liên quan")).toBeVisible({ timeout: 30_000 })
    const text = await page.locator("body").innerText()
    // UUID thô lọt ra UI là dấu hiệu FE render id thay vì tên (bug cũ của tab này).
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)

    // Có dữ liệu thì phải có nút hành động; rỗng thì phải là empty state tử tế, KHÔNG trắng trang.
    const hasRoadmap = await page.getByRole("button", { name: /Theo lộ trình|Đang theo/ }).count()
    const hasJob = await page.getByRole("button", { name: /Ứng tuyển|Đã ứng tuyển/ }).count()
    const emptyStates = await page.getByText(/Chưa có lộ trình nào|Chưa có tin tuyển dụng nào/).count()
    expect(hasRoadmap + hasJob + emptyStates).toBeGreaterThan(0)
})

test("định hướng nghề với khách chưa đăng nhập: báo cần đăng nhập, không phải 'không có dữ liệu'", async ({
    page,
}) => {
    await page.goto(CAREER)
    await expect(page.getByText("Kỹ năng liên quan")).toBeVisible({ timeout: 30_000 })

    const text = await page.locator("body").innerText()
    expect(text).toMatch(/đăng nhập/i)
})

test("feed cộng đồng: menu ⋯ mở được và phân quyền theo chủ bài", async ({ page }) => {
    await loginAs(page, "student")
    await page.goto("/vi/community")

    const menus = page.getByRole("button", { name: "Tuỳ chọn khác" })
    await expect(menus.first()).toBeVisible({ timeout: 30_000 })
    await menus.first().click()

    // Chủ bài thấy Sửa/Xoá; người khác thấy Báo cáo — một trong hai PHẢI xuất hiện.
    const items = page.getByRole("menuitem")
    await expect(items.first()).toBeVisible({ timeout: 10_000 })
    const labels = await items.allInnerTexts()
    expect(labels.join(" ")).toMatch(/Sửa|Xoá|Xóa|Báo cáo/)
})

/**
 * BUG (nghiệm thu 2026-07-25): `GET /community/posts` là 401 với khách, nên bảng tin của
 * khách rơi vào nhánh lỗi chung — hiện "Không tải được bảng tin. Vui lòng thử lại." kèm nút
 * "Thử lại" bấm mãi vẫn hỏng, thay vì mời đăng nhập. Không có dòng bài nào render nên ca
 * "khách bấm ⋯ → modal đăng nhập" cũng không chạy tới được.
 *
 * Giữ test ở dạng `fail` để suite vẫn xanh mà lỗi không bị quên: khi FE phân biệt 401 với
 * lỗi mạng, bỏ `test.fail()` là test này thành hàng rào thật.
 */
test("khách xem bảng tin: phải mời đăng nhập, không phải báo lỗi tải", async ({ page }) => {
    test.fail()
    await page.goto("/vi/community")
    // Chờ request feed kịp hỏng — kiểm "không có chữ lỗi" ngay lúc đang tải thì luôn đúng giả.
    await page.waitForTimeout(8_000)
    await expect(page.getByText(/Không tải được bảng tin/)).toHaveCount(0)
})
