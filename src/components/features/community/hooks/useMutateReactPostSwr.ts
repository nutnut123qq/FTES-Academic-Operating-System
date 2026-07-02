"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { mutateReactCommunityPost } from "@/modules/api/graphql/mutations/mutation-react-community-post"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import { COMMUNITY_FEED_KEY, type CommunityPost } from "./useQueryCommunityFeedSwr"
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
 * rollback, mutating BOTH the feed cache (`["community-feed"]`) and the post
 * detail cache (`["post-detail", postId]`) so the feed row and detail page stay
 * consistent. Guests get the `AuthenticationModal` and nothing toggles.
 *
 * The write reuses the pre-existing `mutateReactCommunityPost`; a mock-transport
 * error (no BE in this skeleton) is treated as success so the optimistic state
 * sticks. Only an explicit `success: false` envelope rolls back.
 */
export const useMutateReactPostSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (postId: string, nextLiked: boolean) => {
            if (!requireAuth("auth.context.like")) {
                return
            }

            // snapshot both caches for rollback
            let feedSnapshot: Array<CommunityPost> | undefined
            let detailSnapshot: PostDetail | undefined

            await mutate<Array<CommunityPost>>(
                COMMUNITY_FEED_KEY,
                (current) => {
                    feedSnapshot = current
                    return current?.map((post) => applyLike(post, postId))
                },
                { revalidate: false },
            )
            await mutate<PostDetail>(
                postDetailKey(postId),
                (current) => {
                    detailSnapshot = current
                    return current ? applyLike(current, postId) : current
                },
                { revalidate: false },
            )

            try {
                const result = await mutateReactCommunityPost({
                    request: { postId, type: nextLiked ? ReactionType.Like : null },
                })
                const envelope = result?.data?.reactToCommunityPost
                // explicit failure envelope → rollback; transport/mock errors are success
                if (envelope && envelope.success === false) {
                    throw new Error(envelope.error ?? envelope.message ?? "react failed")
                }
            } catch (error) {
                // Only roll back on an explicit failure envelope (thrown above);
                // a missing BE (network reject) keeps the optimistic state.
                if (error instanceof Error && error.message === "react failed") {
                    await mutate(COMMUNITY_FEED_KEY, feedSnapshot, { revalidate: false })
                    await mutate(postDetailKey(postId), detailSnapshot, { revalidate: false })
                    toast.danger(t("engagement.likeFailed"))
                }
            }
        },
        [mutate, requireAuth, t],
    )
}
