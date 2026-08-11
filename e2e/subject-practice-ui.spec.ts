import { expect, test } from "@playwright/test"

import { loginAs } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — tab "Luyện tập" của môn (FE `99324b9`).
 *
 * Hai kịch bản gốc ("flashcard SM-2" và "quiz luyện tập") đã được GỠ: hai thẻ
 * Trắc nghiệm / Flashcards của hub Luyện tập bị thay bằng PE + FE, nên UI mà chúng
 * bấm vào không còn tồn tại. Kịch bản PE/FE nằm ở spec riêng của hai module đó.
 */

test("thống kê môn: hiện số thật của ĐÚNG môn đang xem khi đổi môn liên tiếp", async ({ page }) => {
    await loginAs(page, "student")
    await page.goto("/vi/subjects/PRF192/statistics")
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 })
    const prf = await page.locator("body").innerText()

    await page.goto("/vi/subjects/CSD201/statistics")
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 })
    await page.goto("/vi/subjects/DBI202/statistics")
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 })
    const dbi = await page.locator("body").innerText()

    // Không được dính số liệu môn trước (bug vừa vá) — mã môn phải theo trang.
    expect(prf).toContain("PRF192")
    expect(dbi).toContain("DBI202")
    expect(dbi).not.toContain("PRF192")
})
