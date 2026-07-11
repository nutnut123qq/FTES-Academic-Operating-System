"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { matchesGroupFeedKey, type GroupPost } from "./useQueryGroupFeedSwr"

/**
 * Toggles the current user's like on a group feed post. No group-post reaction
 * contract exists on the BE, so this is a LOCAL-ONLY optimistic mutation of the
 * `["group-feed", groupId]` cache (there is nothing to roll back to). Guests get
 * the `AuthenticationModal` and nothing toggles.
 *
 * // ponytail: mock BE — replace with the real group-reaction mutation + rollback
 * once a group-post reaction contract lands.
 *
 * @param groupId - the owning group id.
 */
export const useMutateReactGroupPostSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (postId: string) => {
            if (!requireAuth("auth.context.like")) {
                return
            }
            await mutate<Array<GroupPost>>(
                matchesGroupFeedKey(groupId),
                (current) =>
                    current?.map((post) => {
                        if (post.id !== postId) {
                            return post
                        }
                        const nextLiked = !post.liked
                        return {
                            ...post,
                            liked: nextLiked,
                            likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
                        }
                    }),
                { revalidate: false },
            )
        },
        [groupId, mutate, requireAuth],
    )
}
