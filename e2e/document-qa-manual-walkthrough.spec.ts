import { expect, test } from "@playwright/test"

import { loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 3 (2026-07-26) — hỏi đáp AI tài liệu, thao tác THẬT trên UI.
 *
 * Vòng 2 cụm này là BLOCKED-INFRA (`processing:true` mãi). Sau khi ai-service có
 * `embeddings.py` + route ingest (`652de6f`) và BE nạp tài liệu qua Kafka (`107c13d`), panel phải
 * trả lời ĐÚNG NỘI DUNG tài liệu — không nhận "AI nói chung chung là được".
 *
 * Tài liệu chốt: đề cương PRF192 đã upload + đã index trên apitest. Đáp án đúng đã biết trước:
 * thi cuối kỳ 50%, lab 30%, bài tập 20%, tối thiểu 4.0 điểm thi; nộp muộn trừ 10%/ngày, quá 3
 * ngày không nhận; tuần 10-12 học con trỏ + cấp phát động.
 */

test.describe.configure({ timeout: 180_000 })

const DOC = "f88dce77-a877-429a-b397-197bf0cb1310"
const DOC_URL = `/vi/resources/${DOC}`

/** Ô nhập câu hỏi trong composer của panel. */
const composerOf = (page: import("@playwright/test").Page) =>
    page.getByRole("textbox", { name: /Hỏi về tài liệu này/ })

test("panel nằm dưới preview và trên phần bình luận", async ({ page }) => {
    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(DOC_URL)
    await viewer

    await expect(page.locator("#resource-ai-qa")).toBeVisible({ timeout: 60_000 })

    // Thứ tự thật trong DOM: preview → panel hỏi AI → bình luận.
    const order = await page.evaluate(() => {
        const text = document.body.innerText
        return {
            preview: text.indexOf("Xem trước tài liệu"),
            ai: text.indexOf("Hỏi FrosTES về tài liệu này"),
            comments: text.indexOf("Bình luận"),
        }
    })
    expect(order.preview).toBeGreaterThanOrEqual(0)
    expect(order.ai).toBeGreaterThan(order.preview)
    expect(order.comments).toBeGreaterThan(order.ai)
})

test("hỏi 2 câu → trả lời ĐÚNG nội dung tài liệu + có trích dẫn", async ({ page }) => {
    const payloads: Array<Record<string, unknown>> = []
    page.on("request", (r) => {
        if (r.url().includes("/ai/document-qa") && r.method() === "POST") {
            payloads.push(JSON.parse(r.postData() ?? "{}"))
        }
    })

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`${DOC_URL}?ask=1`)
    await viewer

    const composer = composerOf(page)
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500) // chờ hydrate trước khi bấm

    // Chờ DƯƠNG: đếm caption "Trả lời bởi" tăng thêm 1. Chờ "Đang tìm câu trả lời" BIẾN MẤT là bẫy —
    // nếu assert chạy trước lúc trạng thái kịp xuất hiện thì nó đúng ngay và test đi tiếp quá sớm.
    const answered = page.getByText(/Trả lời bởi/)
    const ask = async (question: string) => {
        const before = await answered.count()
        await composer.fill(question)
        await page.getByRole("button", { name: "Gửi" }).click()
        await expect(answered).toHaveCount(before + 1, { timeout: 120_000 })
    }

    await ask("Thi cuối kỳ chiếm bao nhiêu phần trăm?")
    const afterFirst = await page.locator("#resource-ai-qa").innerText()
    expect(afterFirst, "câu trả lời phải mang con số THẬT trong tài liệu (50%)").toMatch(/50\s*%/)

    await ask("Nộp bài muộn bị trừ thế nào?")
    const afterSecond = await page.locator("#resource-ai-qa").innerText()
    expect(afterSecond, "phải nêu mức trừ 10%/ngày").toMatch(/10\s*%/)
    expect(afterSecond, "phải nêu mốc quá 3 ngày không nhận").toMatch(/3\s*ngày/i)

    // Trích dẫn: có tiêu đề "Trích dẫn" và đoạn trích không rỗng.
    await expect(page.getByText("Trích dẫn").first()).toBeVisible()
    expect(afterSecond).toMatch(/50%|lab|bài tập|con trỏ/i)

    // Payload phải mang model id THẬT (regression bug cũ gửi `react-aria-N`).
    for (const body of payloads) {
        if (body.model !== undefined) {
            expect(String(body.model)).not.toMatch(/react-aria/)
            expect(String(body.model)).toMatch(/\//)
        }
    }

    await page.screenshot({ path: "test-results/vong3-document-qa-tra-loi-dung.png", fullPage: false })
})

test("đổi model trong composer → payload gửi model id thật, caption đổi theo", async ({ page }) => {
    const models: Array<string | undefined> = []
    page.on("request", (r) => {
        if (r.url().includes("/ai/document-qa") && r.method() === "POST") {
            models.push(JSON.parse(r.postData() ?? "{}").model)
        }
    })

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(`${DOC_URL}?ask=1`)
    await viewer
    const composer = composerOf(page)
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500)

    // Bộ chọn model nằm TRONG composer (composer-in-box) và hiện NHÃN model đang chọn làm tên nút.
    const panel = page.locator("#resource-ai-qa")
    const picker = panel.getByRole("button", { name: /gpt-oss|Nemotron|Mô hình/i })
    await expect(picker.first()).toBeVisible({ timeout: 20_000 })
    await picker.first().click()
    const option = page.getByRole("menuitem").filter({ hasText: /Nemotron/ }).first()
    await expect(option).toBeVisible({ timeout: 15_000 })
    const chosenLabel = (await option.innerText()).split("\n")[0].trim()
    await option.click()

    await composer.fill("Tuần 10 đến 12 học nội dung gì?")
    await page.getByRole("button", { name: "Gửi" }).click()
    await expect(page.getByText(/Trả lời bởi/).first()).toBeVisible({ timeout: 120_000 })

    const sent = models.filter((m): m is string => Boolean(m))
    expect(sent.length, "phải có payload mang model đã chọn").toBeGreaterThan(0)
    for (const m of sent) {
        expect(m).not.toMatch(/react-aria/) // id react-aria lọt vào payload là bug cũ
        expect(m).toMatch(/^[\w.-]+\/[\w.:-]+$/) // dạng "provider/model"
    }
    // Caption dưới bubble phải ghi ĐÚNG model vừa chọn, không phải model mặc định.
    await expect(page.getByText(new RegExp(`Trả lời bởi.*${sent[sent.length - 1]}`))).toBeVisible()
    expect(chosenLabel).toMatch(/Nemotron/)

    await page.screenshot({ path: "test-results/vong3-doi-model.png" })
})

test("khách chưa đăng nhập: panel vẫn hiện, bấm Gửi → modal đăng nhập chứ không lỗi đỏ", async ({
    page,
}) => {
    await page.goto(`${DOC_URL}?ask=1`)

    const composer = composerOf(page)
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500)
    await composer.fill("Thi cuối kỳ chiếm bao nhiêu phần trăm?")
    await page.getByRole("button", { name: "Gửi" }).click()

    await expect(page.getByText(/Đăng nhập/).first()).toBeVisible({ timeout: 20_000 })
    // Không được rơi vào nhánh lỗi chung.
    await expect(page.getByText(/Xin lỗi, mình chưa trả lời được/)).toHaveCount(0)
    await page.screenshot({ path: "test-results/vong3-khach-modal-dang-nhap.png" })
})

test("từ tab Tài liệu của môn: nút Hỏi FrosTES → ?ask=1, tự cuộn + focus ô nhập", async ({ page }) => {
    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto("/vi/subjects/PRF192/resources")
    await viewer

    // Nút trên dòng tài liệu là icon-only, nhãn a11y đầy đủ là "Hỏi FrosTES về tài liệu này".
    const askButton = page.getByRole("button", { name: "Hỏi FrosTES về tài liệu này" })
    await expect(askButton.first()).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1_500) // chờ hydrate, bấm sớm thì handler điều hướng chưa gắn
    await askButton.first().click()

    await expect(page).toHaveURL(/\/resources\/[0-9a-f-]{36}\?.*ask=1/, { timeout: 30_000 })
    const composer = composerOf(page)
    await expect(composer).toBeVisible({ timeout: 60_000 })
    await expect(composer).toBeFocused({ timeout: 20_000 })
})
