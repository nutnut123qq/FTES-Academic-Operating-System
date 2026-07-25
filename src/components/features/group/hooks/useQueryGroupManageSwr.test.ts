import { describe, expect, it } from "vitest"
import type { GroupJoinRequest } from "@/modules/api/rest/group"
import { toJoinRequest } from "./useQueryGroupManageSwr"

/**
 * Unit — the join-request mapping.
 *
 * What is pinned here is the requester's identity: the BE now attaches a profile
 * card to every pending request (`GroupDtos.JoinRequestItemDto` →
 * displayName/username/avatarUrl), and the manage row used to render the raw UUID.
 * The mapping stays DEFENSIVE because the shared REST type has not caught up and a
 * user with no profile row still gets nulls back — an un-enriched request must keep
 * rendering the user id rather than an empty row.
 */

/** The pre-enrichment DTO shape (id / userId / status / message only). */
const BASE: GroupJoinRequest = {
    id: "req-1",
    userId: "11111111-2222-3333-4444-555555555555",
    status: "PENDING",
    message: "Cho em vào nhóm với ạ",
}

describe("toJoinRequest", () => {
    it("uses the display name from the BE author card", () => {
        const row = toJoinRequest({
            ...BASE,
            displayName: "Nguyễn Anh Khoa",
            username: "khoana",
            avatarUrl: "https://cdn.test/a.png",
        } as GroupJoinRequest)

        expect(row.name).toBe("Nguyễn Anh Khoa")
        expect(row.username).toBe("khoana")
        expect(row.avatarUrl).toBe("https://cdn.test/a.png")
        expect(row.userId).toBe(BASE.userId)
        expect(row.message).toBe("Cho em vào nhóm với ạ")
    })

    it("falls back to the username when no display name is set", () => {
        const row = toJoinRequest({
            ...BASE,
            displayName: null,
            username: "khoana",
        } as GroupJoinRequest)

        expect(row.name).toBe("khoana")
        expect(row.displayName).toBeNull()
    })

    it("falls back to the user id when the request carries no author card", () => {
        const row = toJoinRequest(BASE)

        expect(row.name).toBe(BASE.userId)
        expect(row.username).toBeNull()
        expect(row.displayName).toBeNull()
        expect(row.avatarUrl).toBeNull()
    })

    it("treats blank identity fields as missing (never renders an empty name)", () => {
        const row = toJoinRequest({
            ...BASE,
            displayName: "   ",
            username: "",
            avatarUrl: "  ",
        } as GroupJoinRequest)

        expect(row.name).toBe(BASE.userId)
        expect(row.username).toBeNull()
        expect(row.avatarUrl).toBeNull()
    })

    it("keeps an absent message as an empty string", () => {
        const row = toJoinRequest({ ...BASE, message: undefined } as unknown as GroupJoinRequest)

        expect(row.message).toBe("")
    })
})
