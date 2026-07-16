"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { votePoll } from "@/modules/api/rest/community"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { pollSwrKey } from "./useQueryPollSwr"

/**
 * Casts a poll vote. The vote is auth-gated (guests get the `AuthenticationModal`),
 * then written to the real BE `POST /api/v1/community/posts/{postId}/poll-votes`
 * with the option's genuine UUID. On success both poll cache keys (explicit post +
 * the "latest" discovery key) are revalidated so `myOptionId`/`voteCount` reflect
 * the server tally.
 *
 * The caller owns the optimistic reveal; a thrown error (guests return `false`
 * instead) means the write failed and the caller should roll back.
 *
 * @returns `true` when the vote was accepted, `false` for guests.
 */
export const useMutatePollVoteSwr = () => {
    const { requireAuth } = useRequireAuth()
    const { mutate } = useSWRConfig()

    return useCallback(
        async (postId: string, optionId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.vote")) {
                return false
            }
            await votePoll(postId, { optionId })
            await Promise.all([
                mutate(pollSwrKey(postId)),
                mutate(pollSwrKey()),
            ])
            return true
        },
        [requireAuth, mutate],
    )
}
