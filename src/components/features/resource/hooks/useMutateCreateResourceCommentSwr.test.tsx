import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig, unstable_serialize, useSWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const postResourceComment = vi.fn()

vi.mock("@/modules/api/rest/resource", () => ({
    postResourceComment: (resourceId: string, request: unknown) =>
        postResourceComment(resourceId, request),
    // The key factory lives beside the query hook, which imports this reader — the mock must
    // expose it or the ESM named import fails at load time. It is never called here.
    getResourceComments: vi.fn(),
}))

import { useMutateCreateResourceCommentSwr } from "./useMutateCreateResourceCommentSwr"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import type { ResourceCommentsPage } from "@/modules/api/rest/resource"

/**
 * Unit — the resource Q&A write (C-4). The page used to only revalidate after the POST, so
 * a comment sat invisible for a whole round-trip; the contract pinned here is that the row
 * shows up immediately, carries the SERVER's id once the write lands (never the temporary
 * one — a delete keyed on a fake id would 404), and that a failed write leaves the thread
 * byte-for-byte as it was rather than stranding a comment that was never saved.
 */

const PAGE = 1
const VIEWER = "viewer-uuid"

/** One existing root comment, as `GET /resources/{id}/comments` would return it. */
const seed = (): ResourceCommentsPage => ({
    items: [
        {
            id: "c1",
            userId: "someone-else",
            parentId: null,
            content: "câu hỏi cũ",
            status: "VISIBLE",
            createdAt: "2026-07-01T00:00:00Z",
            replies: [],
        },
    ],
    page: PAGE,
    size: 20,
    total: 1,
})

/** Render the hook against an isolated SWR cache pre-seeded with a comments page. */
const setup = (resourceId: string) => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
    )
    const { result } = renderHook(
        () => ({ create: useMutateCreateResourceCommentSwr(), swr: useSWRConfig() }),
        { wrapper },
    )
    const key = resourceCommentsSwrKey(resourceId, PAGE)
    const read = () =>
        result.current.swr.cache.get(unstable_serialize(key))?.data as
            | ResourceCommentsPage
            | undefined
    return { result, key, read }
}

beforeEach(() => {
    postResourceComment.mockReset()
})

describe("useMutateCreateResourceCommentSwr", () => {
    it("shows the comment before the POST resolves, then swaps in the server row", async () => {
        // Hold the POST open so the optimistic state is observable mid-flight.
        let resolvePost: (value: unknown) => void = () => {}
        postResourceComment.mockImplementation(
            () => new Promise((resolve) => { resolvePost = resolve }),
        )
        const { result, key, read } = setup("resource-optimistic")
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        const pending = result.current.create.submit({
            resourceId: "resource-optimistic",
            page: PAGE,
            request: { content: "câu hỏi mới" },
            viewerId: VIEWER,
        })

        await waitFor(() => expect(read()?.items).toHaveLength(2))
        const optimistic = read()?.items[0]
        // New roots go on top (BE lists them newest-first) and carry the viewer's id, so the
        // row renders as "you" without inventing an author client-side.
        expect(optimistic?.content).toBe("câu hỏi mới")
        expect(optimistic?.userId).toBe(VIEWER)
        expect(read()?.total).toBe(2)

        resolvePost({
            id: "server-id",
            userId: VIEWER,
            parentId: null,
            content: "câu hỏi mới",
            status: "VISIBLE",
            createdAt: "2026-07-25T00:00:00Z",
            replies: [],
        })
        await pending

        await waitFor(() => expect(read()?.items[0]?.id).toBe("server-id"))
        expect(postResourceComment).toHaveBeenCalledWith("resource-optimistic", {
            content: "câu hỏi mới",
        })
    })

    it("rolls the thread back and rejects when the write fails", async () => {
        postResourceComment.mockRejectedValue(new Error("boom"))
        const { result, key, read } = setup("resource-rollback")
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        await expect(
            result.current.create.submit({
                resourceId: "resource-rollback",
                page: PAGE,
                request: { content: "sẽ hỏng" },
                viewerId: VIEWER,
            }),
        ).rejects.toThrow("boom")

        await waitFor(() => {
            const page = read()
            expect(page?.items).toHaveLength(1)
            expect(page?.items[0]?.id).toBe("c1")
            expect(page?.total).toBe(1)
        })
    })

    it("nests a reply under its parent instead of adding a root", async () => {
        postResourceComment.mockResolvedValue({
            id: "reply-server-id",
            userId: VIEWER,
            parentId: "c1",
            content: "trả lời",
            status: "VISIBLE",
            createdAt: "2026-07-25T00:00:00Z",
            replies: [],
        })
        const { result, key, read } = setup("resource-reply")
        await result.current.swr.mutate(key, seed(), { revalidate: false })

        await result.current.create.submit({
            resourceId: "resource-reply",
            page: PAGE,
            request: { parentId: "c1", content: "trả lời" },
            viewerId: VIEWER,
        })

        await waitFor(() => expect(read()?.items[0]?.replies).toHaveLength(1))
        expect(read()?.items).toHaveLength(1)
        expect(read()?.items[0]?.replies[0]?.id).toBe("reply-server-id")
    })
})
