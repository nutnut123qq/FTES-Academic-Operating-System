"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { likeGroupThread, unlikeGroupThread } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { matchesGroupThreadsKey, type GroupThread } from "./useQueryGroupThreadsSwr"

/**
 * Toggles the current user's LIKE on a group discussion thread via the real REST
 * reaction endpoint (`PUT/DELETE /groups/{id}/discussion/threads/{threadId}/reactions`
 * — change group-social-engagement §2.2). Optimistic flip on the `["group-threads",
 * groupId]` cache, then call the BE; roll back on failure. Guests get the
 * `AuthenticationModal` and nothing toggles.
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

            let wasLiked = false
            const applyToggle = (liked: boolean) =>
                mutate<Array<GroupThread>>(
                    matchesGroupThreadsKey(groupId),
                    (current) =>
                        current?.map((thread) => {
                            if (thread.id !== threadId) {
                                return thread
                            }
                            return {
                                ...thread,
                                liked,
                                likes: Math.max(0, thread.likes + (liked ? 1 : -1)),
                            }
                        }),
                    { revalidate: false },
                )

            await mutate<Array<GroupThread>>(
                matchesGroupThreadsKey(groupId),
                (current) =>
                    current?.map((thread) => {
                        if (thread.id !== threadId) {
                            return thread
                        }
                        wasLiked = thread.liked
                        const nextLiked = !thread.liked
                        return {
                            ...thread,
                            liked: nextLiked,
                            likes: Math.max(0, thread.likes + (nextLiked ? 1 : -1)),
                        }
                    }),
                { revalidate: false },
            )

            try {
                if (wasLiked) {
                    await unlikeGroupThread(groupId, threadId)
                } else {
                    await likeGroupThread(groupId, threadId)
                }
            } catch {
                await applyToggle(wasLiked)
            }
        },
        [groupId, mutate, requireAuth],
    )
}
