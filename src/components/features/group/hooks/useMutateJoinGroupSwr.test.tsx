import React from "react"
import { act, renderHook } from "@testing-library/react"
import { SWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const joinGroup = vi.fn()
const removeMember = vi.fn()
const requireAuth = vi.fn(() => true)
let currentUserId: string | undefined = "user-1"

vi.mock("@/modules/api/rest/group", () => ({
    joinGroup: (groupId: string) => joinGroup(groupId),
    removeMember: (groupId: string, userId: string) => removeMember(groupId, userId),
    getGroup: vi.fn(),
}))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ requireAuth, requireAuthAsync: async () => requireAuth() }),
}))
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { user: { user?: { id: string } } }) => unknown) =>
        selector({ user: { user: currentUserId ? { id: currentUserId } : undefined } }),
}))
// The shared toast wrapper: returns the action's value, or null when it throws.
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async <T,>(action: () => Promise<T>) => {
        try {
            return await action()
        } catch {
            return null
        }
    },
}))

import { useMutateJoinGroupSwr } from "./useMutateJoinGroupSwr"

/**
 * Unit — the group membership write.
 *
 * The hook used to be join-only ("BE has no leave endpoint", which was wrong: the BE
 * `leaveOrKick` treats `DELETE /groups/{id}/members/{userId}` with a SELF target as a
 * leave). What is pinned here is the endpoint contract of the leave action: it must
 * target the group AND the viewer's own user id, only fire for an actual member, and
 * roll the status back when the write fails.
 */

const GROUP = "group-1"

/** Render the hook in an isolated SWR cache; `membership` seeds `viewerMembership`. */
const setup = (membership: string | null = "MEMBER") => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
    )
    return renderHook(() => useMutateJoinGroupSwr(GROUP, { viewerMembership: membership }), {
        wrapper,
    })
}

beforeEach(() => {
    joinGroup.mockReset()
    removeMember.mockReset()
    requireAuth.mockReset()
    requireAuth.mockReturnValue(true)
    currentUserId = "user-1"
})

describe("useMutateJoinGroupSwr", () => {
    it("reports the viewer as joined when the BE returns a viewerMembership role", () => {
        const { result } = setup("MEMBER")

        expect(result.current.status).toBe("joined")
        expect(result.current.canLeave).toBe(true)
    })

    it("leaves by deleting the viewer's OWN membership row", async () => {
        removeMember.mockResolvedValue(undefined)
        const { result } = setup("MEMBER")

        await act(async () => {
            await result.current.leave()
        })

        expect(removeMember).toHaveBeenCalledWith(GROUP, "user-1")
        expect(joinGroup).not.toHaveBeenCalled()
    })

    it("rolls the status back to joined when the leave write fails", async () => {
        removeMember.mockRejectedValue(new Error("boom"))
        const { result } = setup("MEMBER")

        await act(async () => {
            await result.current.leave()
        })

        expect(removeMember).toHaveBeenCalledTimes(1)
        expect(result.current.status).toBe("joined")
    })

    it("does not call the endpoint when the viewer is not a member", async () => {
        const { result } = setup(null)

        await act(async () => {
            await result.current.leave()
        })

        expect(result.current.status).toBe("idle")
        expect(removeMember).not.toHaveBeenCalled()
    })

    it("does not call the endpoint for a signed-out visitor", async () => {
        requireAuth.mockReturnValue(false)
        const { result } = setup("MEMBER")

        await act(async () => {
            await result.current.leave()
        })

        expect(removeMember).not.toHaveBeenCalled()
    })

    it("cannot leave when the internal user id is unknown (endpoint is user-scoped)", async () => {
        currentUserId = undefined
        const { result } = setup("MEMBER")

        expect(result.current.canLeave).toBe(false)
        await act(async () => {
            await result.current.leave()
        })

        expect(removeMember).not.toHaveBeenCalled()
    })

    it("joins through the join endpoint and reflects an immediate JOINED result", async () => {
        joinGroup.mockResolvedValue({ result: "JOINED" })
        const { result } = setup(null)

        await act(async () => {
            await result.current.join()
        })

        expect(joinGroup).toHaveBeenCalledWith(GROUP)
        expect(result.current.status).toBe("joined")
    })
})
