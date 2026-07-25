import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getGroup = vi.fn()

vi.mock("@/modules/api/rest/group", () => ({
    getGroup: (groupId: string) => getGroup(groupId),
}))

import { useQueryGroupSwr } from "./useQueryGroupSwr"

/**
 * Unit — the group detail mapping.
 *
 * What is pinned here is `viewerMembership`: the BE resolves it on
 * `GET /groups/{id}` (the caller's role, `null` when not a member) and the join /
 * leave CTA is driven by it — dropping it in the mapper made every existing member
 * see "Join" again, whose press then 409s `GROUP_ALREADY_MEMBER`.
 */

const DTO = {
    id: "g-1",
    name: "CLB Lập trình",
    slug: "clb-lap-trinh",
    groupType: "CLUB",
    visibility: "PUBLIC",
    memberCount: 12,
    status: "ACTIVE",
    ownerId: "owner-1",
    createdAt: "2026-07-25T00:00:00Z",
}

const setup = () => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>{children}</SWRConfig>
    )
    return renderHook(() => useQueryGroupSwr("g-1"), { wrapper })
}

beforeEach(() => {
    getGroup.mockReset()
})

describe("useQueryGroupSwr", () => {
    it("carries the BE viewerMembership through to the mapped header", async () => {
        getGroup.mockResolvedValue({ ...DTO, viewerMembership: "MEMBER" })

        const { result } = setup()

        await waitFor(() => expect(result.current.group).toBeDefined())
        expect(result.current.group?.viewerMembership).toBe("MEMBER")
    })

    it("maps an absent membership to null (non-member / anonymous viewer)", async () => {
        getGroup.mockResolvedValue(DTO)

        const { result } = setup()

        await waitFor(() => expect(result.current.group).toBeDefined())
        expect(result.current.group?.viewerMembership).toBeNull()
    })
})
