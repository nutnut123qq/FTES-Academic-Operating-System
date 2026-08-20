import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig, unstable_serialize, useSWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — WHO the community-hub comment write says wrote the comment.
 *
 * Three surfaces post through this one hook (the feed's inline thread, the post detail
 * page, the group feed), and all three used to append a node labelled "Bạn" with no avatar
 * at all. One revalidation later the server row replaced it with the author's real name and
 * photo, so every comment a person wrote visibly re-identified itself a beat after they sent
 * it — the regression the project owner reported ("my avatar and my name only show up a
 * moment later"). The node is now signed from the session card the app shell already
 * hydrated, which is the same profile the BE resolves for that account, so the swap is
 * invisible. The caller's "Bạn" survives only for a session that cannot name anybody.
 */

const addComment = vi.fn()
const requireAuth = vi.fn(() => true)
/** The signed-in session the hook signs its optimistic node from; `null` = not hydrated. */
const session = vi.hoisted(() => ({ current: null as unknown }))

vi.mock("@/modules/api/rest/community", () => ({
    addComment: (postId: string, request: { body: string; parentId?: string }) =>
        addComment(postId, request),
}))
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "vi" }))
vi.mock("@heroui/react", () => ({ toast: { danger: vi.fn() } }))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ requireAuth, requireAuthAsync: async () => requireAuth() }),
}))
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { user: { user: unknown } }) => unknown) =>
        selector({ user: { user: session.current } }),
}))
// The feed-side comment counter is a separate concern with its own tests; stub it so this
// spec only exercises the post-detail node.
vi.mock("./useQueryCommunityFeedSwr", () => ({
    mutateCommunityFeeds: vi.fn(async () => undefined),
    patchFeedPostInPages: vi.fn((pages: unknown) => pages),
    toMediaItems: vi.fn(() => []),
}))

import { useMutateCreatePostCommentSwr } from "./useMutateCreatePostCommentSwr"
import { postDetailKey, toComment, type PostDetail } from "./useQueryPostDetailSwr"
import type { CommunityPostCommentNode } from "@/modules/api/graphql/queries/query-community-post"

const POST = "post-1"

/** An already-loaded detail cache, so the optimistic append has somewhere to land. */
const seed = {
    id: POST,
    author: "A",
    authorUsername: "a",
    timeLabel: "1 giờ trước",
    title: "t",
    body: "b",
    likes: 0,
    liked: false,
    comments: [],
    media: [],
} as unknown as PostDetail

const setup = () => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
    )
    const { result } = renderHook(
        () => ({ submit: useMutateCreatePostCommentSwr(), swr: useSWRConfig() }),
        { wrapper },
    )
    return { result, key: postDetailKey(POST) }
}

const input = {
    postId: POST,
    body: "bình luận mới",
    authorLabel: "Bạn",
    authorUsername: "you",
    justNowLabel: "vừa xong",
}

/** The optimistic node the hook parked in the detail cache mid-write. */
const lastComment = (
    result: ReturnType<typeof setup>["result"],
    key: ReturnType<typeof setup>["key"],
) =>
    (result.current.swr.cache.get(unstable_serialize(key))?.data as PostDetail | undefined)
        ?.comments.at(-1)

beforeEach(() => {
    addComment.mockReset()
    requireAuth.mockReset()
    requireAuth.mockReturnValue(true)
    session.current = {
        id: "u1",
        username: "minhdev",
        displayName: "Minh Dev",
        avatar: "https://cdn/minh.png",
    }
})

describe("useMutateCreatePostCommentSwr — the writer's own identity", () => {
    it("signs the optimistic node with the writer's name, handle AND photo", async () => {
        // Leave the write pending: the placeholder is then exactly what the reader is
        // looking at while the comment is in flight.
        addComment.mockReturnValue(new Promise(() => {}))
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        void result.current.submit(input)

        await waitFor(() => {
            const node = lastComment(result, key)
            expect(node?.author).toBe("Minh Dev")
            expect(node?.authorUsername).toBe("minhdev")
            expect(node?.authorAvatar).toBe("https://cdn/minh.png")
        })
    })

    it("says exactly what the REAL mapper will say, so nothing swaps when the row lands", async () => {
        addComment.mockReturnValue(new Promise(() => {}))
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        void result.current.submit(input)

        // The stored row, run through the same `toComment` the revalidation uses: this is
        // the identity that will replace the placeholder a moment later. Comparing the two
        // is the actual no-flicker guarantee — not a restatement of the values above.
        const stored = toComment(
            {
                id: "real-id",
                body: "bình luận mới",
                createdAt: "2026-08-17T00:00:00Z",
                author: {
                    id: "u1",
                    username: "minhdev",
                    displayName: "Minh Dev",
                    avatarUrl: "https://cdn/minh.png",
                },
                replies: [],
            } as unknown as CommunityPostCommentNode,
            "vi",
        )

        await waitFor(() => {
            const node = lastComment(result, key)
            expect(node?.author).toBe(stored.author)
            expect(node?.authorUsername).toBe(stored.authorUsername)
            expect(node?.authorAvatar).toBe(stored.authorAvatar)
        })
    })

    it("keeps the caller's 'Bạn' fallback when the session cannot name the viewer", async () => {
        session.current = null
        addComment.mockReturnValue(new Promise(() => {}))
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        void result.current.submit(input)

        await waitFor(() => {
            const node = lastComment(result, key)
            expect(node?.author).toBe("Bạn")
            expect(node?.authorUsername).toBe("you")
            expect(node?.authorAvatar).toBeNull()
        })
    })

    it("appends nothing at all for a blocked guest", async () => {
        requireAuth.mockReturnValue(false)
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        const ok = await result.current.submit(input)

        expect(ok).toBe(false)
        expect(addComment).not.toHaveBeenCalled()
        expect(lastComment(result, key)).toBeUndefined()
    })
})
