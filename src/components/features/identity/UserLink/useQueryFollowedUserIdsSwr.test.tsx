import React from "react"
import { SWRConfig } from "swr"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link useQueryFollowedUserIdsSwr} (batch follow state for a LIST of authors).
 *
 * The REST edge is mocked, SWR is real, so these pin the parts the backend contract
 * forces on us:
 *  - the 100-id cap: a longer list is CHUNKED client-side (past the cap the BE answers
 *    `400 COMMUNITY_FOLLOW_BATCH_TOO_LARGE`), and the lots are unioned,
 *  - the same set of authors in any render order shares ONE cache entry (one request),
 *  - guests never call the endpoint (it reads the caller's own edges → 401),
 *  - a partly failing fan-out still reports the lots that DID load; only a total
 *    failure surfaces an error.
 */

const getFollowedUserIds = vi.fn()
const hoisted = { authenticated: true }

vi.mock("@/modules/api/rest/community", () => ({
    getFollowedUserIds: (userIds: Array<string>) => getFollowedUserIds(userIds),
    FOLLOW_BATCH_LIMIT: 100,
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated: hoisted.authenticated } }),
}))

import {
    chunkFollowTargets,
    normalizeFollowTargets,
    useQueryFollowedUserIdsSwr,
} from "./useQueryFollowedUserIdsSwr"

/** `user-000` … `user-NNN`, already in sorted order (zero-padded on purpose). */
const ids = (count: number, offset = 0): Array<string> =>
    Array.from({ length: count }, (_, index) => `user-${String(index + offset).padStart(3, "0")}`)

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
)

beforeEach(() => {
    hoisted.authenticated = true
    getFollowedUserIds.mockReset()
    getFollowedUserIds.mockResolvedValue([])
})

describe("useQueryFollowedUserIdsSwr", () => {
    it("asks once for a short list and answers isFollowing per user", async () => {
        getFollowedUserIds.mockResolvedValue(["b"])

        const { result } = renderHook(() => useQueryFollowedUserIdsSwr(["a", "b", "c"]), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isFollowing("b")).toBe(true))
        expect(getFollowedUserIds).toHaveBeenCalledTimes(1)
        expect(getFollowedUserIds).toHaveBeenCalledWith(["a", "b", "c"])
        expect(result.current.isFollowing("a")).toBe(false)
        expect(result.current.isFollowing(null)).toBe(false)
    })

    it("chunks past the 100-id cap and unions the lots", async () => {
        const all = ids(250)
        getFollowedUserIds.mockImplementation(async (lot: Array<string>) => [lot[0]])

        const { result } = renderHook(() => useQueryFollowedUserIdsSwr(all), { wrapper })

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        expect(getFollowedUserIds).toHaveBeenCalledTimes(3)
        const lots = getFollowedUserIds.mock.calls.map((call) => call[0] as Array<string>)
        expect(lots.map((lot) => lot.length)).toEqual([100, 100, 50])
        // Every id is asked exactly once, in the normalized (sorted) order.
        expect(lots.flat()).toEqual(all)
        // Union of the three answers — each lot reported its first id as followed.
        expect(result.current.isFollowing("user-000")).toBe(true)
        expect(result.current.isFollowing("user-100")).toBe(true)
        expect(result.current.isFollowing("user-200")).toBe(true)
        expect(result.current.isFollowing("user-001")).toBe(false)
    })

    it("dedupes, drops nullish and shares one cache entry across render orders", async () => {
        getFollowedUserIds.mockResolvedValue([])

        // Two lists of the SAME authors in different order (a feed column and a
        // sidebar, say) must collapse onto one key → one request for the screen.
        const { result } = renderHook(
            () => ({
                left: useQueryFollowedUserIdsSwr(["b", "a", null, "b"]),
                right: useQueryFollowedUserIdsSwr(["a", "b", "a", undefined]),
            }),
            { wrapper },
        )

        await waitFor(() => expect(getFollowedUserIds).toHaveBeenCalledTimes(1))
        expect(getFollowedUserIds).toHaveBeenCalledWith(["a", "b"])
        expect(result.current.left.idsKey).toBe("a,b")
        expect(result.current.right.idsKey).toBe("a,b")
    })

    it("never calls the endpoint for a guest", async () => {
        hoisted.authenticated = false

        const { result } = renderHook(() => useQueryFollowedUserIdsSwr(["a", "b"]), { wrapper })

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(getFollowedUserIds).not.toHaveBeenCalled()
        expect(result.current.isFollowing("a")).toBe(false)
    })

    it("keeps the lots that loaded when only some fail, and errors only when all fail", async () => {
        const all = ids(150)
        getFollowedUserIds.mockImplementation(async (lot: Array<string>) => {
            if (lot.length === 50) throw new Error("rate limited")
            return [lot[0]]
        })

        const partial = renderHook(() => useQueryFollowedUserIdsSwr(all), { wrapper })
        await waitFor(() => expect(partial.result.current.isFollowing("user-000")).toBe(true))
        expect(partial.result.current.error).toBeUndefined()

        getFollowedUserIds.mockRejectedValue(new Error("down"))
        const total = renderHook(() => useQueryFollowedUserIdsSwr(ids(3, 500)), {
            wrapper,
        })
        await waitFor(() => expect(total.result.current.error).toBeInstanceOf(Error))
        expect(total.result.current.isFollowing("user-500")).toBe(false)
    })
})

describe("normalizeFollowTargets / chunkFollowTargets", () => {
    it("normalizes to a sorted, deduped, non-empty id list", () => {
        expect(normalizeFollowTargets(["b", null, "a", "b", undefined, ""])).toEqual(["a", "b"])
        expect(normalizeFollowTargets([])).toEqual([])
    })

    it("chunks exactly at the cap boundary", () => {
        expect(chunkFollowTargets(ids(100)).length).toBe(1)
        expect(chunkFollowTargets(ids(101)).map((lot) => lot.length)).toEqual([100, 1])
        expect(chunkFollowTargets([])).toEqual([])
    })
})
