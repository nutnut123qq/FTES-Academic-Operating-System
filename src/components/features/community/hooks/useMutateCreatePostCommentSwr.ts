"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { mutateCreateCommunityPostComment } from "@/modules/api/graphql/mutations/mutation-create-community-post-comment"
import { COMMUNITY_FEED_KEY, type CommunityPost } from "./useQueryCommunityFeedSwr"
import { postDetailKey, type PostComment, type PostDetail } from "./useQueryPostDetailSwr"

/** Input for a comment/reply submission. */
export interface SubmitCommentInput {
    /** The post being commented on. */
    postId: string
    /** The comment body (already trimmed non-empty by the caller). */
    body: string
    /** Author label for the optimistic node ("Bạn"/"You"). */
    authorLabel: string
    /** Localized "just now" time label for the optimistic node. */
    justNowLabel: string
    /** When replying, the parent top-level comment id (one level only). */
    parentCommentId?: string
}

/**
 * Creates a comment (top-level or one-level reply) on a community post with an
 * optimistic append to the `["post-detail", postId]` cache (which the inline
 * thread and detail page share) plus a +1 to the feed cache's comment count.
 * On explicit failure the optimistic node is removed, counts revert, and the
 * caller is told to restore the draft (via the thrown error / false return).
 *
 * Guests get the `AuthenticationModal` and nothing is appended.
 *
 * @returns `submit(input)` resolving `true` on success, `false` on failure or a
 * blocked guest — callers use `false` to keep the draft in the composer.
 */
export const useMutateCreatePostCommentSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (input: SubmitCommentInput): Promise<boolean> => {
            if (!requireAuth("auth.context.comment")) {
                return false
            }

            const tempId = `tmp-${Date.now()}`
            const optimistic: PostComment = {
                id: tempId,
                author: input.authorLabel,
                text: input.body,
                timeLabel: input.justNowLabel,
            }

            let detailSnapshot: PostDetail | undefined
            let feedSnapshot: Array<CommunityPost> | undefined

            await mutate<PostDetail>(
                postDetailKey(input.postId),
                (current) => {
                    detailSnapshot = current
                    if (!current) {
                        return current
                    }
                    if (input.parentCommentId) {
                        return {
                            ...current,
                            comments: current.comments.map((comment) =>
                                comment.id === input.parentCommentId
                                    ? { ...comment, replies: [...(comment.replies ?? []), optimistic] }
                                    : comment,
                            ),
                        }
                    }
                    return { ...current, comments: [...current.comments, optimistic] }
                },
                { revalidate: false },
            )
            await mutate<Array<CommunityPost>>(
                COMMUNITY_FEED_KEY,
                (current) => {
                    feedSnapshot = current
                    return current?.map((post) =>
                        post.id === input.postId ? { ...post, comments: post.comments + 1 } : post,
                    )
                },
                { revalidate: false },
            )

            try {
                const result = await mutateCreateCommunityPostComment({
                    request: {
                        postId: input.postId,
                        parentCommentId: input.parentCommentId ?? null,
                        body: input.body,
                    },
                })
                const envelope = result?.data?.createCommunityPostComment
                if (envelope && envelope.success === false) {
                    throw new Error(envelope.error ?? envelope.message ?? "comment failed")
                }
                return true
            } catch (error) {
                if (error instanceof Error && error.message === "comment failed") {
                    await mutate(postDetailKey(input.postId), detailSnapshot, { revalidate: false })
                    await mutate(COMMUNITY_FEED_KEY, feedSnapshot, { revalidate: false })
                    toast.danger(t("engagement.commentFailed"))
                    return false
                }
                // Missing BE (transport reject) → keep the optimistic comment.
                return true
            }
        },
        [mutate, requireAuth, t],
    )
}
