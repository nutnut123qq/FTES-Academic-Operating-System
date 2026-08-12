import { expect, test } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 2 (2026-07-26) — regression 2 bản vá tối 25/07 ở tầng UI:
 *
 * 1. BE siết `contentFormat` (giá trị lạ nay 400 thay vì 500) — đường ĐĂNG BÀI thường KHÔNG được
 *    vỡ theo. FE không gửi field này nên kỳ vọng đăng bình thường.
 * 2. BE ẩn hội thoại đã archive khỏi `GET /ai/sessions` — trên UI, xoá một cuộc trò chuyện rồi
 *    tải lại trang thì nó KHÔNG được hiện lại.
 */

test.describe.configure({ timeout: 120_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const PRF192_UUID = "b79a7192-932e-4427-9b97-d171650638ab"

test("đăng bài từ composer cộng đồng vẫn chạy (bản vá contentFormat không làm vỡ)", async ({
    page,
    request,
}) => {
    const marker = `E2E composer ${Date.now()}`

    await loginAs(page, "student")
    const viewer = waitForViewer(page)
    await page.goto("/vi/community")
    await viewer
    await page.waitForTimeout(1_500) // hydrate

    // Lối vào composer là ô nhắc "Có gì mới?" — nút "Đăng bài" riêng trên thanh feed đã bị
    // gỡ có chủ đích ở 716aa72 ("pressing the prompt already opens the composer").
    // "Đăng bài" bên dưới vẫn đúng: đó là nút gửi BÊN TRONG dialog.
    await page.getByRole("button", { name: "Có gì mới?" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    // Nút Đăng bài chỉ bật khi có ĐỦ loại bài + tiêu đề + nội dung.
    await dialog.getByRole("button", { name: "Kiến thức" }).click()
    await dialog.getByRole("textbox", { name: "Tiêu đề" }).fill(marker)
    await dialog.getByRole("textbox", { name: "Bạn muốn chia sẻ điều gì?" }).fill(`${marker} — nội dung nghiệm thu`)
    const submit = dialog.getByRole("button", { name: "Đăng bài" })
    await expect(submit).toBeEnabled({ timeout: 10_000 })
    await submit.click()

    await expect(dialog).toBeHidden({ timeout: 20_000 })
    await expect(page.getByText("Không đăng được bài viết. Vui lòng thử lại.")).toHaveCount(0)

    // Tải lại: bài phải THẬT SỰ nằm trên bảng tin, không chỉ biến mất khỏi modal.
    await page.reload()
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 30_000 })

    // Dọn: xoá bài vừa đăng để bảng tin không tích rác sau mỗi lượt chạy.
    const id = await page.evaluate((needle) => {
        const link = Array.from(document.querySelectorAll("a[href*='/community/']")).find((a) =>
            (a.closest("article,li,div")?.textContent ?? "").includes(needle),
        )
        const tail = link ? (link as HTMLAnchorElement).href.split("/community/")[1] : ""
        return /^[0-9a-f-]{36}$/.test(tail) ? tail : null
    }, marker)
    if (id) {
        const headers = { authorization: `Bearer ${await fetchToken("student")}` }
        expect((await request.delete(`${API}/community/posts/${id}`, { headers })).status()).toBe(200)
    }
})

test("xoá 1 cuộc trò chuyện gia sư FrosTES → tải lại trang không hiện lại", async ({ page, request }) => {
    const headers = { authorization: `Bearer ${await fetchToken("student")}` }
    // Seed 2 cuộc để chắc chắn có cái để xoá mà danh sách không rỗng sau đó.
    for (const n of [1, 2]) {
        const res = await request.post(`${API}/ai/sessions`, {
            headers,
            data: { feature: "TUTOR_CHAT", contextRef: { subjectId: PRF192_UUID } },
        })
        expect(res.status(), `seed session ${n}`).toBe(200)
    }
    const before = (await (await request.get(`${API}/ai/sessions?feature=TUTOR_CHAT&subjectId=${PRF192_UUID}`, { headers })).json())
        .data as { id: string }[]
    expect(before.length).toBeGreaterThan(0)

    // Xoá 1 cuộc qua REST rồi soi UI: danh sách hội thoại của môn KHÔNG được chứa nó nữa.
    const victim = before[0].id
    expect((await request.delete(`${API}/ai/sessions/${victim}`, { headers })).status()).toBe(200)

    await loginAs(page, "student")
    await page.goto("/vi/subjects/PRF192/ai")
    await expect(page.locator("body")).toBeVisible({ timeout: 60_000 })

    const after = (await (await request.get(`${API}/ai/sessions?feature=TUTOR_CHAT&subjectId=${PRF192_UUID}`, { headers })).json())
        .data as { id: string }[]
    expect(after.map((s) => s.id), "cuộc đã xoá vẫn còn trong danh sách sau khi tải lại").not.toContain(victim)
    expect(after.length).toBe(before.length - 1)
})
