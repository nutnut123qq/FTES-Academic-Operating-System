import fs from "node:fs"
import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

/**
 * Nghiệm thu E2E vòng 4 — PHẦN A: vai giảng viên/admin dựng khoá.
 *
 * Surface: **Admin CMS** (`FTES-AOS-Admin`, Vite, cổng 5173). FE chính không có màn hình soạn khoá
 * (`/courses/teaching` chỉ liệt kê; client REST `createCourse/createCourseSection/...` có sẵn trong
 * `modules/api/rest/course` nhưng không component nào gọi).
 *
 * Đăng nhập bằng FORM thật: store admin giữ access token trong memory (chỉ refresh token vào
 * localStorage) nên không seed session kiểu FE được.
 *
 * Ghi `test-results/course-journey.json` cho spec vai học viên (Phần B–E).
 */

test.describe.configure({ mode: "serial", timeout: 300_000 })

const ADMIN = process.env.ADMIN_BASE_URL ?? "http://localhost:5173"
const FIXTURE = path.join(process.cwd(), "test-results", "course-journey.json")

/** Con số CHỈ có trong bài DOCUMENT — dùng chấm câu trả lời của AI ở Phần C. */
const SECRET = "4271"

const CHAPTER = "Chương 1 — Nhập môn"
const LESSON_VIDEO = "Bài 1 — Video mở đầu"
const LESSON_DOC = "Bài 2 — Tài liệu con trỏ"
const LESSON_EXTRA = "Bài 3 — Bài tập tổng hợp"

const loginAdmin = async (page: Page) => {
    await page.goto(`${ADMIN}/login`)
    await page.getByLabel("Email").fill("admin.test@ftes.vn")
    await page.getByLabel("Mật khẩu").fill(process.env.FTES_ADMIN_PASSWORD ?? "")
    await page.getByRole("button", { name: "Đăng nhập" }).click()
    await expect(page.getByText("Học thuật").first()).toBeVisible({ timeout: 60_000 })
}

/** Mở khoá nghiệm thu: tái dùng nếu có, tạo mới nếu chưa (chạy lại không đẻ khoá rác). */
const openJourneyCourse = async (page: Page): Promise<string> => {
    await page.goto(`${ADMIN}/academic/courses`)
    const existing = page.getByRole("row").filter({ hasText: "E2E V4 Course" }).first()

    if (await existing.count()) {
        await existing.getByRole("button", { name: "Xem" }).click()
    } else {
        const title = `E2E V4 Course ${Date.now() % 1000000}`
        await page.getByRole("button", { name: "Tạo khoá học" }).click()
        const dialog = page.getByRole("dialog")
        await expect(dialog).toBeVisible({ timeout: 20_000 })
        // Môn học là antd Select; option ở dropdown PORTAL ngoài modal — bám `.ant-select-dropdown`,
        // nếu không sẽ trúng ô "PRF192" của BẢNG phía sau và bị chính modal chặn click.
        await dialog.locator(".ant-select-selector").first().click()
        await page
            .locator(".ant-select-dropdown:visible .ant-select-item-option")
            .filter({ hasText: "PRF192" })
            .first()
            .click()
        await dialog.locator("#name").fill(title)
        await dialog.locator("#summary").fill(`Khoá nghiệm thu vòng 4 — mã bí mật ${SECRET}`)
        await dialog.getByRole("button", { name: "Tạo" }).click()

        const row = page.getByRole("row").filter({ hasText: title })
        await expect(row).toBeVisible({ timeout: 60_000 })
        await row.getByRole("button", { name: "Xem" }).click()
    }

    await expect(page).toHaveURL(/\/academic\/courses\/[0-9a-f-]{36}/, { timeout: 30_000 })
    return new URL(page.url()).pathname.split("/").pop() as string
}

/** Đổi tên node đang chọn trong cây (panel "Thông tin node" bên phải). */
const renameSelectedNode = async (page: Page, title: string) => {
    const editor = page.locator(".ant-card", { hasText: "Thông tin node" })
    await editor.locator("input").first().fill(title)
}

test("A1-A2: tạo khoá + 1 chương + 3 bài học trên Admin CMS", async ({ page }) => {
    await loginAdmin(page)
    const courseId = await openJourneyCourse(page)
    console.log("courseId =", courseId)

    await page.getByRole("tab", { name: "Bài học" }).click()
    await expect(page.getByRole("button", { name: "Thêm chương" })).toBeVisible({ timeout: 30_000 })

    // Đã dựng cây ở lần chạy trước thì thôi — chỉ dựng khi cây còn trống.
    const empty = await page.getByText("Chưa có chương/bài học nào").count()
    if (empty) {
        // Node mới sinh ra với tên mặc định và KHÔNG tự được chọn → phải click nó trong cây trước
        // khi đổi tên ở panel bên phải.
        await page.getByRole("button", { name: "Thêm chương" }).click()
        await page.getByText("Chương mới").first().click()
        await renameSelectedNode(page, CHAPTER)

        for (const lessonTitle of [LESSON_VIDEO, LESSON_DOC, LESSON_EXTRA]) {
            // "Thêm bài học" chỉ bật khi node đang chọn là CHƯƠNG → chọn lại chương mỗi vòng.
            await page.getByText(CHAPTER).first().click()
            await page.getByRole("button", { name: "Thêm bài học" }).click()
            await page.getByText("Bài học mới").last().click()
            await renameSelectedNode(page, lessonTitle)
        }

        await page.getByRole("button", { name: "Lưu nội dung" }).click()
        await expect(page.getByText(/Lỗi lưu cây/)).toHaveCount(0)
    }

    await page.reload()
    await page.getByRole("tab", { name: "Bài học" }).click()
    for (const label of [CHAPTER, LESSON_VIDEO, LESSON_DOC, LESSON_EXTRA]) {
        await expect(page.getByText(label).first(), `"${label}" phải còn sau khi tải lại`).toBeVisible({
            timeout: 30_000,
        })
    }

    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true })
    fs.writeFileSync(
        FIXTURE,
        JSON.stringify({ courseId, secretNumber: SECRET, chapter: CHAPTER, lessonVideo: LESSON_VIDEO, lessonDoc: LESSON_DOC }, null, 2),
        "utf8",
    )
})
