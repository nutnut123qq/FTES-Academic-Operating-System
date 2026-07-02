"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { subjectFeedKey, type FeedScope, type SubjectPost } from "./useQuerySubjectFeedSwr"

/**
 * Toggles the current user's like on a subject "Thảo luận" post. No BE contract
 * exists, so this is a LOCAL-ONLY optimistic mutation of the
 * `["subject-feed", subjectId, scope]` cache. Guests get the
 * `AuthenticationModal` and nothing toggles.
 *
 * // ponytail: mock BE — no subject reaction contract yet.
 *
 * @param subjectId - the owning subject id.
 * @param scope - the active feed scope (part of the cache key).
 */
export const useMutateReactSubjectPostSwr = (subjectId: string, scope: FeedScope) => {
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (postId: string) => {
            if (!requireAuth("auth.context.like")) {
                return
            }
            await mutate<Array<SubjectPost>>(
                subjectFeedKey(subjectId, scope),
                (current) =>
                    current?.map((post) => {
                        if (post.id !== postId) {
                            return post
                        }
                        const nextLiked = !post.liked
                        return {
                            ...post,
                            liked: nextLiked,
                            reactions: Math.max(0, post.reactions + (nextLiked ? 1 : -1)),
                        }
                    }),
                { revalidate: false },
            )
        },
        [subjectId, scope, mutate, requireAuth],
    )
}
