import { expect, test } from "@playwright/test"

import { loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — menu ⋯ trên DÒNG bảng tin (FE `99324b9`).
 *
 * Dùng bài CÓ SẴN trên bảng tin thay vì tự đăng: bài mới đăng chỉ lên feed sau vài giây và thứ
 * tự hiển thị không phải hợp đồng, nên spec "tự đăng rồi đi tìm" chập chờn. Ở đây chỉ cần một
 * dòng bất kỳ của người khác để kiểm phân quyền + hộp thoại báo cáo.
 */

test.describe.configure({ timeout: 90_000 })

test("dòng của người khác: menu ⋯ có Báo cáo và mở được hộp thoại báo cáo", async ({ page }) => {
    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto("/vi/community")
    await viewer

    const menus = page.getByRole("button", { name: "Tuỳ chọn khác" })
    await expect(menus.first()).toBeVisible({ timeout: 30_000 })

    // Quét các dòng cho tới khi gặp bài KHÔNG phải của mình (menu có "Báo cáo").
    const total = Math.min(await menus.count(), 8)
    let opened = false
    for (let i = 0; i < total; i += 1) {
        await menus.nth(i).click()
        const menu = page.getByRole("menu")
        await expect(menu).toBeVisible({ timeout: 10_000 })
        if (await menu.getByText("Báo cáo").count()) {
            // Bài người khác: chỉ Báo cáo, KHÔNG có hành động của chủ bài.
            await expect(menu.getByText("Sửa")).toHaveCount(0)
            await expect(menu.getByText("Xoá")).toHaveCount(0)
            await menu.getByRole("menuitem", { name: "Báo cáo" }).click()
            opened = true
            break
        }
        await page.keyboard.press("Escape")
    }
    expect(opened, "không tìm thấy dòng nào của người khác trên bảng tin").toBe(true)
    await expect(page.getByText("Báo cáo nội dung")).toBeVisible({ timeout: 10_000 })
})
