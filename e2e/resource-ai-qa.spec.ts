import { expect, test } from "@playwright/test"

import { loginAs } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — UI "hỏi đáp AI tài liệu" (ResourceAiQa, FE afb4920).
 *
 * Trạng thái apitest: KHÔNG có resource nào có file. Presigned PUT của module resource
 * trỏ host nội bộ `http://minio:9000` nên trình duyệt / máy ngoài không upload được
 * (BLOCKED-MINIO-PUBLIC — cần phơi MinIO qua tunnel công khai + set
 * `S3_STORAGE_CDN_BASE_URL`). Vì vậy:
 *
 * - ca CHẠY ĐƯỢC: resource chưa có version ⇒ panel AI phải ẨN (đúng thiết kế
 *   "không có gì để bám thì không hỏi"), trang vẫn render bình thường;
 * - ca CHÍNH (hỏi AI trên PDF thật) để `skip` kèm điều kiện mở khoá.
 */

/** Resource DRAFT do student.test tạo 2026-07-25, chưa có file (upload bị chặn). */
const VERSIONLESS_RESOURCE = "ae4a32a6-689d-4337-9e45-1142bd0c3927"

test("tài liệu chưa có file → panel hỏi AI ẩn, trang vẫn render", async ({ page }) => {
    await loginAs(page, "student")
    await page.goto(`/vi/resources/${VERSIONLESS_RESOURCE}`)

    await expect(page.getByRole("heading", { name: /E2E Storage Test PDF/i })).toBeVisible({
        timeout: 30_000,
    })
    await expect(page.locator("#resource-ai-qa")).toHaveCount(0)
})

test.skip("hỏi AI trên PDF thật → trả lời từ OCR", async ({ page }) => {
    // Mở khoá khi MinIO có endpoint công khai: upload PDF qua
    // create → upload-url → PUT → complete, rồi mở /vi/resources/{id}?ask=1,
    // gửi câu hỏi và chờ answer (lượt đầu có thể processing:true → thử lại).
    await loginAs(page, "student")
})
