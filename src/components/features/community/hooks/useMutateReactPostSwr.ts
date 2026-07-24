"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { reactToPost, unreactPost } from "@/modules/api/rest/community"
import {
    mutateCommunityFeeds,
    patchFeedPostInPages,
} from "./useQueryCommunityFeedSwr"
import { postDetailKey, type PostDetail } from "./useQueryPostDetailSwr"

/** Apply the like toggle to a post-shaped item (feed row or detail). */
const applyLike = <T extends { id: string; likes: number; liked: boolean }>(
    item: T,
    postId: string,
): T => {
    if (item.id !== postId) {
        return item
    }
    const nextLiked = !item.liked
    return { ...item, liked: nextLiked, likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)) }
}

/**
 * Toggles the current user's like on a community post with optimistic update +
 * rollback, mutating BOTH the feed caches (every `useSWRInfinite` community-feed
 * aggregate, via {@link mutateCommunityFeeds}) and the post detail cache
 * (`["post-detail", postId]`) so the feed row and detail page stay consistent.
 * Guests get the `AuthenticationModal` and nothing toggles.
 *
 * The write hits the community REST reactions API (`PUT`/`DELETE
 * /community/reactions`). ANY failure — transport reject OR a non-2xx envelope
 * (`RestError`) — rolls the optimistic state back by re-applying the toggle
 * (`applyLike` is its own inverse); on success the post-detail cache is
 * revalidated so its authoritative `likeCount`/`likedByMe` reconcile.
 */
export const useMutateReactPostSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate, cache } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (postId: string, nextLiked: boolean) => {
            if (!requireAuth("auth.context.like")) {
                return
            }

            // snapshot the detail cache for rollback; the paged feed reverts by
            // re-applying the (involutive) toggle.
            let detailSnapshot: PostDetail | undefined
            const toggleFeed = () =>
                mutateCommunityFeeds(cache, mutate, (pages) =>
                    patchFeedPostInPages(pages, postId, (post) => applyLike(post, postId)),
                )

            await toggleFeed()
            await mutate<PostDetail>(
                postDetailKey(postId),
                (current) => {
                    detailSnapshot = current
                    return current ? applyLike(current, postId) : current
                },
                { revalidate: false },
            )

            try {
                if (nextLiked) {
                    await reactToPost(postId, { reactionType: "LIKE" })
                } else {
                    await unreactPost(postId)
                }
            } catch {
                // Only a failure of the WRITE (transport reject OR RestError envelope)
                // rolls back the optimistic state.
                await toggleFeed()
                await mutate(postDetailKey(postId), detailSnapshot, { revalidate: false })
                toast.danger(t("engagement.likeFailed"))
                return
            }

            // The reaction is committed → reconcile the detail cache's authoritative
            // counts. A revalidation refetch error here must NOT undo the like.
            await mutate(postDetailKey(postId)).catch(() => {})
        },
        [mutate, cache, requireAuth, t],
    )
}
