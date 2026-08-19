import { expect, test } from "@playwright/test"

import { loginAs } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — menu ⋯ trên feed cộng đồng (FE `99324b9`).
 *
 * File này trước đây còn 2 test cho tab "Định hướng nghề" của môn; tab đó đã bị xoá
 * khỏi sản phẩm (2026-08-19) nên 2 test kia đi theo.
 */

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
 * Feed đọc theo viewer nên khách nhận 401 `PLATFORM_UNAUTHORIZED` — đó là CỔNG ĐĂNG NHẬP,
 * không phải request hỏng. Trước đây 401 rơi vào nhánh lỗi chung nên khách thấy "Không tải
 * được bảng tin" kèm nút "Thử lại" bấm mãi vẫn hỏng (bug nghiệm thu 2026-07-25).
 *
 * Đã vá: `CommunityFeed` tách 401/403 ra khỏi lỗi mạng và hiện lời mời đăng nhập. Test này
 * giờ là hàng rào thật — nếu ai đó gộp 401 lại vào nhánh lỗi, nó sẽ đỏ.
 */
test("khách xem bảng tin: phải mời đăng nhập, không phải báo lỗi tải", async ({ page }) => {
    await page.goto("/vi/community")
    // Chờ request feed kịp hỏng — kiểm "không có chữ lỗi" ngay lúc đang tải thì luôn đúng giả.
    await page.waitForTimeout(8_000)
    await expect(page.getByText(/Không tải được bảng tin/)).toHaveCount(0)
    // Assert DƯƠNG: phải thấy lời mời đăng nhập. Thiếu vế này thì một trang trắng trơn
    // cũng "pass" — đúng cái bẫy làm bug lọt lần trước.
    await expect(page.getByText(/Đăng nhập để xem bảng tin/)).toBeVisible()
})
