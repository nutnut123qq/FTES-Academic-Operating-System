"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import { deleteChallengeComment } from "@/modules/api/rest/challenges/challenges"
import type { ChallengeCommentPage } from "@/modules/api/rest/challenges/types"
import { tombstoneChallengeComment } from "./challengeCommentTree"
import { challengeCommentsSwrKey } from "./useQueryChallengeCommentsSwr"

/** Trigger arg: the comment to delete + the cached thread page it is rendered on. */
export interface DeleteChallengeCommentArg {
    commentId: string
    /** The challenge's real UUID (`ChallengeView.id`), not the routing slug. */
    challengeId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
}

/**
 * Soft-deletes one challenge comment (`DELETE /api/v1/challenges/comments/{commentId}`).
 *
 * The row is tombstoned in the cache immediately — mirroring the BE's soft delete, so the
 * replies under a deleted parent stay visible — the refetch then swaps in the real
 * tombstone body the server wrote, and the pre-delete snapshot is restored if the request
 * fails. `remove` rejects on failure so the caller can toast; the BE is the real authority
 * on who may delete (author OR subject approver), so a viewer the FE could not confirm as
 * the author is simply refused with a 403 rather than silently succeeding.
 *
 * @returns `remove(arg)` plus `isMutating`.
 */
export const useMutateDeleteChallengeCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const [isMutating, setIsMutating] = useState(false)

    const remove = useCallback(
        async (arg: DeleteChallengeCommentArg): Promise<void> => {
            const key = challengeCommentsSwrKey(arg.challengeId, arg.page)

            let snapshot: ChallengeCommentPage | undefined
            setIsMutating(true)
            await mutate<ChallengeCommentPage>(
                key,
                (current) => {
                    snapshot = current
                    return current
                        ? tombstoneChallengeComment(current, arg.commentId)
                        : current
                },
                { revalidate: false },
            )

            try {
                await deleteChallengeComment(arg.commentId)
                await mutate(key).catch(() => undefined)
            } catch (error) {
                await mutate(key, snapshot, { revalidate: false })
                throw error instanceof Error ? error : new Error(String(error))
            } finally {
                setIsMutating(false)
            }
        },
        [mutate],
    )

    return { remove, isMutating }
}
