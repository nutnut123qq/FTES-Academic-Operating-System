import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig, unstable_serialize, useSWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const addComment = vi.fn()
const toastDanger = vi.fn()
const requireAuth = vi.fn(() => true)
/** The signed-in session the hook signs its optimistic node from; `null` = not hydrated. */
const session = vi.hoisted(() => ({ current: null as unknown }))

vi.mock("@/modules/api/rest/community", () => ({
    addComment: (postId: string, request: { body: string; parentId?: string }) =>
        addComment(postId, request),
}))
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))
vi.mock("@heroui/react", () => ({ toast: { danger: (message: string) => toastDanger(message) } }))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ requireAuth, requireAuthAsync: async () => requireAuth() }),
}))
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { user: { user: unknown } }) => unknown) =>
        selector({ user: { user: session.current } }),
}))

import { useMutateCreateSubjectPostCommentSwr } from "./useMutateCreateSubjectPostCommentSwr"
import { subjectPostCommentsKey, type SubjectPostThread } from "./useQuerySubjectPostCommentsSwr"

/**
 * Unit — the discussion-tab comment write. This hook exists because the tab used to
 * fake it: the old `onSubmit` patched the SWR cache and returned `true` without ever
 * calling the API, so comments vanished on reload. The contract pinned here is:
 * the write really happens, it appears optimistically, and a failure puts the cache
 * back exactly as it was.
 *
 * Plus WHO the optimistic node says wrote it. It used to say "Bạn" with no photo, and the
 * revalidation then renamed the row to the author's real name and face — the flicker the
 * project owner reported. The node is now signed from the session card, and the caller's
 * "Bạn" survives only as the fallback for a session that cannot name anybody.
 */

const SUBJECT = "subject-uuid"
const POST = "post-1"
const SCOPE = "forYou" as const

const seed: SubjectPostThread = {
    id: POST,
    comments: [
        { id: "c1", author: "A", authorUsername: "a", text: "cũ", timeLabel: "1 giờ trước" },
    ],
}

/** Render the hook inside an isolated SWR cache pre-seeded with an existing thread. */
const setup = () => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
    )
    const { result } = renderHook(
        () => ({
            submit: useMutateCreateSubjectPostCommentSwr(SUBJECT, SCOPE),
            swr: useSWRConfig(),
        }),
        { wrapper },
    )
    const key = subjectPostCommentsKey(SUBJECT, POST, SCOPE)
    return { result, key }
}

const input = {
    postId: POST,
    body: "bình luận mới",
    authorLabel: "Bạn",
    authorUsername: "me",
    justNowLabel: "vừa xong",
}

/** Read the optimistic node the hook parked in the cache mid-write. */
const firstComment = (
    result: ReturnType<typeof setup>["result"],
    key: ReturnType<typeof setup>["key"],
) =>
    (result.current.swr.cache.get(unstable_serialize(key))?.data as SubjectPostThread | undefined)
        ?.comments.at(-1)

beforeEach(() => {
    addComment.mockReset()
    toastDanger.mockReset()
    requireAuth.mockReset()
    requireAuth.mockReturnValue(true)
    session.current = {
        id: "u1",
        username: "minhdev",
        displayName: "Minh Dev",
        avatar: "https://cdn/minh.png",
    }
})

describe("useMutateCreateSubjectPostCommentSwr", () => {
    it("sends the comment to the API", async () => {
        addComment.mockResolvedValue({ id: "c2" })
        const { result } = setup()

        const ok = await result.current.submit(input)

        expect(ok).toBe(true)
        expect(addComment).toHaveBeenCalledWith(POST, { body: "bình luận mới", parentId: undefined })
    })

    it("rolls the thread back and reports failure when the write fails", async () => {
        addComment.mockRejectedValue(new Error("boom"))
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        const ok = await result.current.submit(input)

        expect(ok).toBe(false)
        expect(toastDanger).toHaveBeenCalledWith("engagement.commentFailed")
        await waitFor(() => {
            const thread = result.current.swr.cache.get(unstable_serialize(key))?.data as
                | SubjectPostThread
                | undefined
            expect(thread?.comments).toHaveLength(1)
            expect(thread?.comments[0]?.id).toBe("c1")
        })
    })

    it("does not send anything for a signed-out visitor", async () => {
        requireAuth.mockReturnValue(false)
        const { result } = setup()

        const ok = await result.current.submit(input)

        expect(ok).toBe(false)
        expect(addComment).not.toHaveBeenCalled()
    })

    it("signs the optimistic node with the writer's own name, handle and photo", async () => {
        // The write is left pending so the placeholder is what sits in the cache — the
        // exact frame the reader looks at while the comment is in flight.
        addComment.mockReturnValue(new Promise(() => {}))
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        void result.current.submit(input)

        await waitFor(() => {
            const node = firstComment(result, key)
            expect(node?.author).toBe("Minh Dev")
            expect(node?.authorUsername).toBe("minhdev")
            expect(node?.authorAvatar).toBe("https://cdn/minh.png")
        })
    })

    it("keeps the caller's 'Bạn' fallback when the session cannot name the viewer", async () => {
        session.current = null
        addComment.mockReturnValue(new Promise(() => {}))
        const { result, key } = setup()
        await result.current.swr.mutate(key, seed, { revalidate: false })

        void result.current.submit(input)

        await waitFor(() => {
            const node = firstComment(result, key)
            expect(node?.author).toBe("Bạn")
            expect(node?.authorUsername).toBe("me")
            expect(node?.authorAvatar).toBeNull()
        })
    })
})
