import { expect, test } from "@playwright/test"

import { loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — tab "Luyện tập" của môn (FE `99324b9`).
 *
 * Bám môn PRF192 vì đó là môn duy nhất trên apitest có CẢ ngân hàng câu hỏi
 * `status=ready` LẪN bộ thẻ (seed trong phiên nghiệm thu này). Môn khác còn rỗng →
 * empty state, không chứng minh được gì.
 */

const PRACTICE = "/vi/subjects/PRF192/practice"
const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

test("flashcard SM-2: chấm điểm trên UI ghi thẳng vào máy chủ (không mất khi tải lại)", async ({
    page,
    request,
}) => {
    const token = await loginAs(page, "student")
    const deckState = async () => {
        const res = await request.get(`${API}/subjects/PRF192/practice/flashcards`, {
            headers: { authorization: `Bearer ${token}` },
        })
        const { data } = (await res.json()) as {
            data: { decks: { cards: { id: string; progress: { lastReviewedAt: string | null } }[] }[] }
        }
        return data.decks.flatMap((d) => d.cards)
    }
    /** Mốc ôn gần nhất của cả bộ — tăng nghĩa là lần chấm vừa rồi đã ghi xuống máy chủ. */
    const lastReviewAt = (cards: { progress: { lastReviewedAt: string | null } }[]) =>
        Math.max(0, ...cards.map((c) => (c.progress.lastReviewedAt ? Date.parse(c.progress.lastReviewedAt) : 0)))
    const before = lastReviewAt(await deckState())

    const viewer = waitForViewer(page)
    await page.goto(PRACTICE)
    await viewer
    await page.waitForTimeout(1_000) // chờ React hydrate rồi mới bấm
    await page.getByRole("button", { name: "Mở" }).nth(1).click() // thẻ Flashcards
    await expect(page.getByText("Thẻ 1/", { exact: false })).toBeVisible({ timeout: 30_000 })

    await page.getByRole("button", { name: "Lật thẻ" }).click()
    // Nhãn nút chấm điểm kèm khoảng lặp lại ("Được · 1 ngày") → khớp theo tiền tố.
    await page.getByRole("button", { name: /^Được/ }).click()
    await expect(page.getByText("Thẻ 1/", { exact: false })).toBeHidden({ timeout: 15_000 })

    // Tiến độ nằm ở MÁY CHỦ, không phải state component: trước đây F5 là mất sạch.
    expect(lastReviewAt(await deckState())).toBeGreaterThan(before)
})

test("quiz luyện tập: đề không kèm đáp án, nộp xong mới hiện đáp án đúng + giải thích", async ({ page }) => {
    const requests: string[] = []
    page.on("request", (r) => {
        if (r.url().includes("/practice/quiz")) requests.push(`${r.method()} ${r.url()}`)
    })

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto(PRACTICE)
    await viewer
    await page.waitForTimeout(1_000) // chờ React hydrate rồi mới bấm
    await page.getByRole("button", { name: "Mở" }).first().click() // thẻ Trắc nghiệm
    await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click()

    await expect(page.getByText("Câu 1", { exact: false })).toBeVisible({ timeout: 30_000 })
    // Trước khi nộp, HTML của trang KHÔNG được chứa lời giải thích (rò đáp án).
    await expect(page.getByText("Giải thích")).toHaveCount(0)

    const options = page.getByRole("radio")
    const total = await options.count()
    for (let i = 0; i < total; i += 4) await options.nth(i).click()

    await page.getByRole("button", { name: "Nộp bài" }).click()
    await expect(page.getByText("Kết quả luyện tập")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText("Đáp án đúng").first()).toBeVisible()
    await expect(page.getByText("Giải thích").first()).toBeVisible()

    expect(requests.some((r) => r.startsWith("POST") && r.includes("/quiz/submit"))).toBe(true)
})

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
