"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { reactToPost, unreactPost } from "@/modules/api/rest/community"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { matchesGroupFeedKey, type GroupPost } from "./useQueryGroupFeedSwr"

/**
 * Toggles the current user's like on a group feed post. A group post IS a community
 * post, so the write goes through the community reaction endpoint
 * (`PUT/DELETE /community/reactions`, targetType POST — change group-social-engagement §5.2).
 * Optimistic: flip like + count on the `["group-feed", groupId]` cache, then call the
 * BE; on failure roll back to the pre-toggle snapshot. Guests get the
 * `AuthenticationModal` and nothing toggles.
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

            // capture pre-toggle liked state so we know which endpoint to call + how to roll back
            let wasLiked = false
            await mutate<Array<GroupPost>>(
                matchesGroupFeedKey(groupId),
                (current) =>
                    current?.map((post) => {
                        if (post.id !== postId) {
                            return post
                        }
                        wasLiked = post.liked
                        const nextLiked = !post.liked
                        return {
                            ...post,
                            liked: nextLiked,
                            likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
                        }
                    }),
                { revalidate: false },
            )

            try {
                if (wasLiked) {
                    await unreactPost(postId)
                } else {
                    await reactToPost(postId)
                }
            } catch {
                // rollback the optimistic flip
                await mutate<Array<GroupPost>>(
                    matchesGroupFeedKey(groupId),
                    (current) =>
                        current?.map((post) => {
                            if (post.id !== postId) {
                                return post
                            }
                            return {
                                ...post,
                                liked: wasLiked,
                                likes: Math.max(0, post.likes + (wasLiked ? 1 : -1)),
                            }
                        }),
                    { revalidate: false },
                )
            }
        },
        [groupId, mutate, requireAuth],
    )
}
