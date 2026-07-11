"use client"

import { useCallback } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"

/**
 * Casts a poll vote. The vote is auth-gated (guests get the `AuthenticationModal`).
 *
 * NOTE: the poll DATA is still mock — there is no BE poll-read endpoint, so no real
 * post/option UUID exists to write against. The vote is therefore kept LOCAL (the
 * caller's optimistic reveal stands) rather than wired to
 * `POST /api/v1/community/posts/{id}/poll-votes`, which would `400` on the placeholder
 * ids and revert-then-error on every click. Wire the live write only once a real poll
 * post flows through with genuine UUIDs.
 *
 * @returns `true` when the (local) vote is accepted, `false` for guests.
 */
export const useMutatePollVoteSwr = () => {
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (_postId: string, _optionId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.vote")) {
                return false
            }
            return true
        },
        [requireAuth],
    )
}
