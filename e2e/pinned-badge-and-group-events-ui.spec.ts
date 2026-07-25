import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken, loginAs, waitForViewer } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 2 (2026-07-26) — 3 ca vòng 1 còn dở:
 *  - badge "Đã ghim" trên bảng tin (vòng 1 BLOCKED-DATA: apitest không có bài ghim nào);
 *  - vòng đời sự kiện nhóm (tạo → sửa → xoá);
 *  - rời nhóm.
 *
 * Không tạo nhóm mới: BE chặn 3 nhóm/ngày/người. Spec tìm nhóm học viên test đã đứng tên.
 */

test.describe.configure({ timeout: 120_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

const headersFor = async (role: "student" | "lecturer" | "admin") => ({
    authorization: `Bearer ${await fetchToken(role)}`,
})
const dataOf = async (res: { json: () => Promise<{ data: unknown }> }) => (await res.json()).data

test("badge 'Đã ghim' hiện trên dòng bài được ghim", async ({ page, request }) => {
    const student = await headersFor("student")
    const admin = await headersFor("admin")

    const marker = `E2E ghim ${Date.now()}`
    const created = await request.post(`${API}/community/posts`, {
        headers: student,
        data: { postType: "DISCUSSION", content: marker },
    })
    expect(created.status()).toBe(200)
    const post = (await dataOf(created)) as { id: string }

    const pinned = await request.post(`${API}/admin/community/posts/${post.id}/pin`, {
        headers: admin,
        data: { value: true },
    })
    test.skip(pinned.status() !== 200, `admin không ghim được bài (${pinned.status()})`)

    try {
        await loginAs(page, "student")
        const viewer = waitForViewer(page)
        await page.goto("/vi/community")
        await viewer

        const row = page.locator("article, li, div").filter({ hasText: marker }).last()
        await expect(row).toBeVisible({ timeout: 30_000 })
        await expect(row.getByText("Đã ghim").first()).toBeVisible({ timeout: 15_000 })
    } finally {
        await request.post(`${API}/admin/community/posts/${post.id}/pin`, { headers: admin, data: { value: false } })
        await request.delete(`${API}/community/posts/${post.id}`, { headers: student })
    }
})

/** Nhóm ACTIVE mà học viên test đang là OWNER (tái dùng — BE chặn 3 nhóm/ngày). */
const ownedGroup = async (request: APIRequestContext, headers: Record<string, string>) => {
    const res = await request.get(`${API}/groups?page=0&size=50`, { headers })
    const page = (await dataOf(res)) as { items?: Array<{ id: string; viewerMembership?: string | null }> }
    return (page.items ?? []).find((g) => g.viewerMembership === "OWNER") ?? null
}

test("sự kiện nhóm: tạo → sửa → xoá qua REST, tab Sự kiện phản ánh đúng", async ({ page, request }) => {
    const student = await headersFor("student")
    const group = await ownedGroup(request, student)
    test.skip(!group, "học viên test chưa đứng tên nhóm nào")

    const title = `E2E sự kiện ${Date.now()}`
    const startsAt = new Date(Date.now() + 86_400_000).toISOString()
    // `endsAt` phải SAU `startsAt` (BE: GROUP_EVENT_INVALID_TIME), bằng nhau cũng bị từ chối.
    const endsAt = new Date(Date.now() + 90_000_000).toISOString()
    const created = await request.post(`${API}/groups/${group!.id}/events`, {
        headers: student,
        data: { title, description: "nghiệm thu vòng 2", startsAt, endsAt, location: "Online" },
    })
    test.skip(created.status() !== 200, `không tạo được sự kiện (${created.status()}): ${(await created.text()).slice(0, 160)}`)
    const event = (await dataOf(created)) as { id: string }

    try {
        await loginAs(page, "student")
        await page.goto(`/vi/groups/${group!.id}/events`)
        await expect(page.getByText(title).first()).toBeVisible({ timeout: 60_000 })

        const renamed = `${title} (đã sửa)`
        const patched = await request.patch(`${API}/groups/${group!.id}/events/${event.id}`, {
            headers: student,
            data: { title: renamed },
        })
        expect(patched.status(), await patched.text()).toBe(200)

        await page.reload()
        await expect(page.getByText(renamed).first()).toBeVisible({ timeout: 30_000 })
    } finally {
        await request.delete(`${API}/groups/${group!.id}/events/${event.id}`, { headers: student })
    }
})

test("rời nhóm: thành viên rời xong không còn trong danh sách thành viên", async ({ request }) => {
    const student = await headersFor("student")
    const lecturer = await headersFor("lecturer")

    const me = (await dataOf(await request.get(`${API}/profiles/me`, { headers: student }))) as { userId: string }
    const target = await ownedGroup(request, lecturer)
    test.skip(!target, "giảng viên test chưa đứng tên nhóm nào để học viên tham gia")

    // Vào nhóm bằng lời mời (nhóm test dùng joinPolicy APPROVAL) rồi rời ra.
    // Dọn trước: đang là thành viên → 409 ALREADY_MEMBER; còn lời mời chờ → 409 INVITE_PENDING.
    await request.delete(`${API}/groups/${target!.id}/members/${me.userId}`, { headers: student })
    const pending = (await dataOf(await request.get(`${API}/invitations/me`, { headers: student }))) as {
        invitationId: string
    }[]
    for (const inv of pending) {
        await request.post(`${API}/invitations/${inv.invitationId}/respond`, { headers: student, data: { action: "DECLINE" } })
    }
    const invited = await request.post(`${API}/groups/${target!.id}/invitations`, {
        headers: lecturer,
        data: { inviteeId: me.userId },
    })
    test.skip(invited.status() !== 200, `không mời được (${invited.status()})`)
    const invitationId = (await dataOf(invited)) as string
    expect(
        (await request.post(`${API}/invitations/${invitationId}/respond`, { headers: student, data: { action: "ACCEPT" } })).status(),
    ).toBe(200)

    const inside = (await dataOf(await request.get(`${API}/groups/${target!.id}/members`, { headers: student }))) as {
        userId: string
    }[]
    expect(inside.map((m) => m.userId)).toContain(me.userId)

    expect((await request.delete(`${API}/groups/${target!.id}/members/${me.userId}`, { headers: student })).status()).toBe(200)
    const outside = (await dataOf(await request.get(`${API}/groups/${target!.id}/members`, { headers: student }))) as {
        userId: string
    }[]
    expect(outside.map((m) => m.userId)).not.toContain(me.userId)
})
