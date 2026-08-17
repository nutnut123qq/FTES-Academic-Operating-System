"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import { postChallengeComment } from "@/modules/api/rest/challenges/challenges"
import { useViewerAuthorCard } from "@/hooks/useViewerAuthorCard"
import type {
    ChallengeCommentPage,
    ChallengeCommentView,
    PostChallengeCommentRequest,
} from "@/modules/api/rest/challenges/types"
import {
    buildOptimisticChallengeComment,
    insertChallengeComment,
    replaceChallengeComment,
} from "./challengeCommentTree"
import { challengeCommentsSwrKey } from "./useQueryChallengeCommentsSwr"

/** Trigger arg: the challenge, the cached page to patch, and the comment payload. */
export interface CreateChallengeCommentArg {
    /** The challenge's real UUID (`ChallengeView.id`), not the routing slug. */
    challengeId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
    request: PostChallengeCommentRequest
    /**
     * Signed-in viewer's id, so the placeholder row renders as their own. The NAME and
     * AVATAR are not passed in: the hook reads the viewer's session card itself, so no
     * caller can forget to sign the row.
     */
    viewerId?: string | null
}

/**
 * Posts a comment (or a one-level reply via `parentId`) on a challenge
 * (`POST /api/v1/challenges/{id}/comments`) and patches the cached thread around it.
 *
 * The node shows up immediately (optimistic), is swapped for the row the server actually
 * stored — real id, server `createdAt`, the resolved author card, and the root the BE
 * re-parented a reply-of-reply onto — once the POST resolves, and the page is restored
 * from the pre-write snapshot when the write fails, so a comment is never left looking
 * saved when it was not.
 *
 * The placeholder is SIGNED with the viewer's own identity, taken from the session card
 * already in the store ({@link useViewerAuthorCard} — no extra request, and no call-site
 * plumbing: every surface that posts a challenge comment gets this), so the writer sees
 * their name and avatar immediately and the row does not re-identify itself when the
 * server's version lands. A guest / not-yet-hydrated session degrades to the id-only row.
 *
 * `submit` REJECTS on a failed write (after rolling the cache back) so the caller keeps
 * the draft and can tell a rate limit (429, 10 comments/minute) from an ordinary failure;
 * a refetch failure AFTER a successful write is swallowed — the comment did land.
 *
 * @returns `submit(arg)` resolving the saved {@link ChallengeCommentView}, plus `isMutating`.
 */
export const useMutateCreateChallengeCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const viewer = useViewerAuthorCard()
    const [isMutating, setIsMutating] = useState(false)

    const submit = useCallback(
        async (arg: CreateChallengeCommentArg): Promise<ChallengeCommentView> => {
            const key = challengeCommentsSwrKey(arg.challengeId, arg.page)
            const optimistic = buildOptimisticChallengeComment(
                arg.request.content,
                arg.request.parentId,
                arg.viewerId,
                viewer,
            )

            let snapshot: ChallengeCommentPage | undefined
            setIsMutating(true)
            await mutate<ChallengeCommentPage>(
                key,
                (current) => {
                    snapshot = current
                    return current ? insertChallengeComment(current, optimistic) : current
                },
                { revalidate: false },
            )

            try {
                const saved = await postChallengeComment(arg.challengeId, arg.request)
                await mutate<ChallengeCommentPage>(
                    key,
                    (current) =>
                        current
                            ? replaceChallengeComment(current, optimistic.id, saved)
                            : current,
                    { revalidate: false },
                )
                // Re-sync ordering/pagination against the server's own view of the thread.
                // A refetch error must NOT surface as a failed comment — the write landed.
                await mutate(key).catch(() => undefined)
                return saved
            } catch (error) {
                await mutate(key, snapshot, { revalidate: false })
                throw error instanceof Error ? error : new Error(String(error))
            } finally {
                setIsMutating(false)
            }
        },
        [mutate, viewer],
    )

    return { submit, isMutating }
}
