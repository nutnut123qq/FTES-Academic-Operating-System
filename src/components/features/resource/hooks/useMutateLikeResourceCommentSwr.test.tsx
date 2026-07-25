import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig, unstable_serialize, useSWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const likeResourceComment = vi.fn()
const unlikeResourceComment = vi.fn()

vi.mock("@/modules/api/rest/resource", () => ({
    likeResourceComment: (commentId: string) => likeResourceComment(commentId),
    unlikeResourceComment: (commentId: string) => unlikeResourceComment(commentId),
    // The key factory lives beside the query hook, which imports this reader — the mock must
    // expose it or the ESM named import fails at load time. It is never called here.
    getResourceComments: vi.fn(),
}))

import { useMutateLikeResourceCommentSwr } from "./useMutateLikeResourceCommentSwr"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import type { ResourceCommentsPage } from "@/modules/api/rest/resource"

/**
 * Unit — the resource comment heart (`PUT`/`DELETE /resources/comments/{id}/like`).
 *
 * The affordance was hidden while the BE had no endpoint; now that it exists the contract
 * pinned here is that the heart reacts BEFORE the round-trip, that the number the BE ships
 * back wins over the local guess (so a like somebody else landed mid-flight is not lost to
 * a client-side recount), and that a refusal leaves the row exactly as it was — including
 * for a REPLY, which carries its own counter.
 */

const RESOURCE = "resource-uuid"
const PAGE = 1

/** A root comment with one reply, as `GET /resources/{id}/comments` returns them. */
const seed = (): ResourceCommentsPage => ({
    items: [
        {
            id: "c1",
            userId: "someone-else",
            parentId: null,
            content: "câu hỏi",
            status: "VISIBLE",
            createdAt: "2026-07-01T00:00:00Z",
            likeCount: 4,
            likedByMe: false,
            replies: [
                {
                    id: "r1",
                    userId: "another",
                    parentId: "c1",
                    content: "trả lời",
                    status: "VISIBLE",
                    createdAt: "2026-07-02T00:00:00Z",
                    likeCount: 2,
                    likedByMe: true,
                    replies: [],
                },
            ],
        },
    ],
    page: PAGE,
    size: 20,
    total: 1,
})

/** Render the hook against an isolated SWR cache pre-seeded with a comments page. */
const setup = () => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
    )
    const { result } = renderHook(
        () => ({ like: useMutateLikeResourceCommentSwr(), swr: useSWRConfig() }),
        { wrapper },
    )
    const key = resourceCommentsSwrKey(RESOURCE, PAGE)
    const read = () =>
        result.current.swr.cache.get(unstable_serialize(key))?.data as
            | ResourceCommentsPage
            | undefined
    const root = () => read()!.items[0]
    const reply = () => read()!.items[0].replies[0]
    return { result, key, read, root, reply }
}

beforeEach(() => {
    likeResourceComment.mockReset()
    unlikeResourceComment.mockReset()
})

describe("useMutateLikeResourceCommentSwr", () => {
    it("fills the heart and bumps the count before the PUT resolves", async () => {
        // Hold the PUT open so the optimistic state is observable mid-flight.
        let resolveLike: (value: unknown) => void = () => {}
        likeResourceComment.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveLike = resolve
                }),
        )
        const { result, key, root } = setup()
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        const pending = result.current.like.toggle({
            commentId: "c1",
            resourceId: RESOURCE,
            page: PAGE,
            nextLiked: true,
        })

        await waitFor(() => expect(root().likedByMe).toBe(true))
        expect(root().likeCount).toBe(5)

        // The BE is authoritative: two other people liked while the call was in flight.
        resolveLike({ active: true, likeCount: 7 })
        await pending

        expect(root().likeCount).toBe(7)
        expect(root().likedByMe).toBe(true)
        expect(likeResourceComment).toHaveBeenCalledWith("c1")
    })

    it("restores the previous heart and count when the write fails", async () => {
        likeResourceComment.mockRejectedValue(new Error("boom"))
        const { result, key, root } = setup()
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        await expect(
            result.current.like.toggle({
                commentId: "c1",
                resourceId: RESOURCE,
                page: PAGE,
                nextLiked: true,
            }),
        ).rejects.toThrow()

        expect(root().likedByMe).toBe(false)
        expect(root().likeCount).toBe(4)
    })

    it("rolls back off the FRESH cache, keeping a comment posted mid-flight", async () => {
        let rejectLike: (error: Error) => void = () => {}
        likeResourceComment.mockImplementation(
            () =>
                new Promise((_resolve, reject) => {
                    rejectLike = reject
                }),
        )
        const { result, key, read, root } = setup()
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        const pending = result.current.like.toggle({
            commentId: "c1",
            resourceId: RESOURCE,
            page: PAGE,
            nextLiked: true,
        })
        await waitFor(() => expect(root().likedByMe).toBe(true))

        // A refetch (or another writer) lands a NEW root while the like is in flight.
        await result.current.swr.mutate(
            key,
            (current?: ResourceCommentsPage) =>
                current
                    ? {
                          ...current,
                          items: [
                              {
                                  id: "c0",
                                  userId: "viewer",
                                  parentId: null,
                                  content: "bài mới",
                                  status: "VISIBLE",
                                  createdAt: "2026-07-03T00:00:00Z",
                                  likeCount: 0,
                                  likedByMe: false,
                                  replies: [],
                              },
                              ...current.items,
                          ],
                          total: current.total + 1,
                      }
                    : current,
            { revalidate: false },
        )

        rejectLike(new Error("boom"))
        await expect(pending).rejects.toThrow()

        // A snapshot restore would have erased "c0"; the functional revert keeps it and
        // only undoes the like.
        expect(read()!.items.map((item) => item.id)).toEqual(["c0", "c1"])
        expect(read()!.items[1].likedByMe).toBe(false)
        expect(read()!.items[1].likeCount).toBe(4)
    })

    it("unlikes a REPLY without touching its root's counter", async () => {
        unlikeResourceComment.mockResolvedValue({ active: false, likeCount: 1 })
        const { result, key, root, reply } = setup()
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        await result.current.like.toggle({
            commentId: "r1",
            resourceId: RESOURCE,
            page: PAGE,
            nextLiked: false,
        })

        expect(unlikeResourceComment).toHaveBeenCalledWith("r1")
        expect(reply()).toMatchObject({ likedByMe: false, likeCount: 1 })
        expect(root()).toMatchObject({ likedByMe: false, likeCount: 4 })
    })
})
