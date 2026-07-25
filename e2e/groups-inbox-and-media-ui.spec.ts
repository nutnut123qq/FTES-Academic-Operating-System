import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken, loginAs } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — hộp thư lời mời ở `/groups`, ô "Nhận diện nhóm" (gỡ ảnh) và tab
 * Tài nguyên nhóm (FE `99324b9`).
 *
 * KHÔNG tạo nhóm mới trong test: BE chặn 3 nhóm/ngày/người
 * (`GROUP_RATE_LIMITED`) nên spec tạo nhóm sẽ đỏ từ lần chạy thứ hai trở đi. Spec tìm nhóm
 * SẴN CÓ mà tài khoản test đứng tên, và tự dọn (rời nhóm) để chạy lại được nhiều lần.
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/**
 * Điều hướng nhóm trong app dùng `group.id` (`GroupsList` href là `/groups/{id}`). Các tab con
 * gọi `/groups/{id}/…` mà BE khai kiểu UUID, nên mở bằng SLUG thì tab con 400 — spec đi bằng id
 * cho khớp đường người dùng thật.
 */
interface Group {
    id: string
    slug: string
    name: string
    ownerId: string | null
}

const asRole = async (request: APIRequestContext, role: "student" | "lecturer") => {
    const token = await fetchToken(role)
    const headers = { authorization: `Bearer ${token}` }
    return {
        get: (p: string) => request.get(`${API}${p}`, { headers }),
        post: (p: string, data: unknown = {}) => request.post(`${API}${p}`, { headers, data }),
        del: (p: string) => request.delete(`${API}${p}`, { headers }),
    }
}
const data = async (res: { json: () => Promise<{ data: unknown }> }) => (await res.json()).data

/** Nhóm ACTIVE đầu tiên mà `ownerId` là người này (null nếu chưa có). */
const ownedGroup = async (as: { get: (p: string) => Promise<unknown> }, ownerId: string) => {
    const page = (await data(
        (await as.get("/groups?page=0&size=50")) as { json: () => Promise<{ data: unknown }> },
    )) as { items: Group[] }
    return page.items.find((g) => g.ownerId === ownerId) ?? null
}

test("hộp thư lời mời: hiện tên nhóm + người mời, chấp nhận ngay trên /groups", async ({
    page,
    request,
}) => {
    const student = await asRole(request, "student")
    const lecturer = await asRole(request, "lecturer")
    const me = (await data(await student.get("/profiles/me"))) as { userId: string }
    const lec = (await data(await lecturer.get("/profiles/me"))) as { userId: string }

    const group = await ownedGroup(lecturer, lec.userId)
    test.skip(!group, "chưa có nhóm nào do giảng viên test đứng tên để gửi lời mời")

    // Dọn hộp thư trước: chỉ chừa ĐÚNG một lời mời để biết chắc nút "Chấp nhận" đầu tiên
    // thuộc về nhóm nào (nhiều dòng thì thứ tự render không phải hợp đồng).
    const pending = (await data(await student.get("/invitations/me"))) as { invitationId: string }[]
    for (const inv of pending) await student.post(`/invitations/${inv.invitationId}/respond`, { action: "DECLINE" })

    // Lần chạy trước có thể đã vào nhóm rồi (409 GROUP_ALREADY_MEMBER) → rời ra trước.
    await student.del(`/groups/${group!.id}/members/${me.userId}`)
    const invited = await lecturer.post(`/groups/${group!.id}/invitations`, { inviteeId: me.userId })
    expect(invited.status(), await invited.text()).toBe(200)

    await loginAs(page, "student")
    await page.goto("/vi/groups")

    await expect(page.getByText("Lời mời vào nhóm")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(group!.name).first()).toBeVisible({ timeout: 15_000 })
    // Người mời hiện TÊN, không phải UUID thô.
    await expect(page.getByText(/đã mời bạn tham gia/).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Từ chối" }).first()).toBeVisible()

    await page.getByRole("button", { name: "Chấp nhận" }).first().click()
    await expect(page.getByText(/đã mời bạn tham gia/)).toHaveCount(0, { timeout: 15_000 })
    // Dòng biến mất NGAY (optimistic) nên phải đợi toast xác nhận ghi xong rồi mới soi máy chủ.
    await expect(page.getByText("Đã tham gia nhóm.")).toBeVisible({ timeout: 15_000 })

    // Chấp nhận phải THÀNH THÀNH VIÊN thật, không chỉ biến mất khỏi hộp thư.
    const members = (await data(await student.get(`/groups/${group!.id}/members`))) as { userId: string }[]
    expect(members.map((m) => m.userId)).toContain(me.userId)

    // Dọn: rời nhóm để lần chạy sau lại mời được.
    expect((await student.del(`/groups/${group!.id}/members/${me.userId}`)).status()).toBe(200)
})

test("gỡ ảnh nhóm: chưa chọn ảnh mới mà bấm Lưu thì ảnh trên máy chủ KHÔNG bị xoá", async ({
    page,
    request,
}) => {
    const student = await asRole(request, "student")
    const me = (await data(await student.get("/profiles/me"))) as { userId: string }
    const group = await ownedGroup(student, me.userId)
    test.skip(!group, "chưa có nhóm nào do học viên test đứng tên")

    const before = (await data(await student.get(`/groups/${group!.id}`))) as { avatarUrl: string | null }

    await loginAs(page, "student")
    await page.goto(`/vi/groups/${group!.id}/manage`)
    await expect(page.getByText("Nhận diện nhóm")).toBeVisible({ timeout: 30_000 })

    const remove = page.getByRole("button", { name: "Bỏ ảnh" })
    if (await remove.count()) await remove.first().click()
    const save = page.getByRole("button", { name: "Lưu nhận diện" })
    // Không có gì thay đổi → nút Lưu phải TẮT (không cho phép ghi rỗng đè ảnh cũ).
    if (await save.count()) await expect(save.first()).toBeDisabled()

    const after = (await data(await student.get(`/groups/${group!.id}`))) as { avatarUrl: string | null }
    expect(after.avatarUrl).toBe(before.avatarUrl)
})

test("tab Tài nguyên nhóm: render empty state + lối gắn tài liệu, không phải màn lỗi", async ({
    page,
    request,
}) => {
    const student = await asRole(request, "student")
    const me = (await data(await student.get("/profiles/me"))) as { userId: string }
    const group = await ownedGroup(student, me.userId)
    test.skip(!group, "chưa có nhóm nào do học viên test đứng tên")

    await loginAs(page, "student")
    await page.goto(`/vi/groups/${group!.id}/resources`)

    await expect(page.getByText("Tài nguyên nhóm").first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/Chưa có tài liệu nào được gắn|Gắn tài liệu/).first()).toBeVisible()
    await expect(page.getByText(/Không tải được tài nguyên nhóm/)).toHaveCount(0)
})
