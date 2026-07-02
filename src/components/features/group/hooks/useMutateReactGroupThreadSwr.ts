"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { groupThreadsKey, type GroupThread } from "./useQueryGroupThreadsSwr"

/**
 * Toggles the current user's like on a group discussion thread. No discussion
 * reaction contract exists on the BE, so this is a LOCAL-ONLY optimistic
 * mutation of the `["group-threads", groupId]` cache. Guests get the
 * `AuthenticationModal` and nothing toggles.
 *
 * // ponytail: mock BE — no discussion reaction contract yet.
 *
 * @param groupId - the owning group id.
 */
export const useMutateReactGroupThreadSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (threadId: string) => {
            if (!requireAuth("auth.context.like")) {
                return
            }
            await mutate<Array<GroupThread>>(
                groupThreadsKey(groupId),
                (current) =>
                    current?.map((thread) => {
                        if (thread.id !== threadId) {
                            return thread
                        }
                        const nextLiked = !thread.liked
                        return {
                            ...thread,
                            liked: nextLiked,
                            likes: Math.max(0, thread.likes + (nextLiked ? 1 : -1)),
                        }
                    }),
                { revalidate: false },
            )
        },
        [groupId, mutate, requireAuth],
    )
}
