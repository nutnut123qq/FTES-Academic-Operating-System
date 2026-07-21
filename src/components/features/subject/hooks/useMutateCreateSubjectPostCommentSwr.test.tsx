import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig, unstable_serialize, useSWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const addComment = vi.fn()
const toastDanger = vi.fn()
const requireAuth = vi.fn(() => true)

vi.mock("@/modules/api/rest/community", () => ({
    addComment: (postId: string, request: { body: string; parentId?: string }) =>
        addComment(postId, request),
}))
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))
vi.mock("@heroui/react", () => ({ toast: { danger: (message: string) => toastDanger(message) } }))
vi.mock("@/hooks/useRequireAuth", () => ({ useRequireAuth: () => ({ requireAuth }) }))

import { useMutateCreateSubjectPostCommentSwr } from "./useMutateCreateSubjectPostCommentSwr"
import { subjectPostCommentsKey, type SubjectPostThread } from "./useQuerySubjectPostCommentsSwr"

/**
 * Unit — the discussion-tab comment write. This hook exists because the tab used to
 * fake it: the old `onSubmit` patched the SWR cache and returned `true` without ever
 * calling the API, so comments vanished on reload. The contract pinned here is:
 * the write really happens, it appears optimistically, and a failure puts the cache
 * back exactly as it was.
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

beforeEach(() => {
    addComment.mockReset()
    toastDanger.mockReset()
    requireAuth.mockReset()
    requireAuth.mockReturnValue(true)
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
})
