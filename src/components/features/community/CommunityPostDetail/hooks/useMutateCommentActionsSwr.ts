"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { deleteComment, updateComment } from "@/modules/api/rest/community"
import {
    mutateCommunityFeeds,
    patchFeedPostInPages,
    type CommunityFeedPage,
} from "../../hooks/useQueryCommunityFeedSwr"
import {
    postDetailKey,
    type PostComment,
    type PostDetail,
} from "../../hooks/useQueryPostDetailSwr"
import { communityErrorMessageKey } from "./community-error-message"

/** Apply a signed delta to the target post's comment count across every feed page. */
const patchFeedCommentCount = (postId: string, delta: number) =>
    (pages: Array<CommunityFeedPage> | undefined): Array<CommunityFeedPage> | undefined =>
        patchFeedPostInPages(pages, postId, (post) => ({
            ...post,
            comments: Math.max(0, post.comments + delta),
        }))

/** Replace a comment's text anywhere in the flat one-level tree (top level or reply). */
const patchCommentText = (
    comments: Array<PostComment>,
    commentId: string,
    text: string,
): Array<PostComment> =>
    comments.map((comment) => {
        const patched =
            comment.id === commentId ? { ...comment, text } : comment
        if (!patched.replies) {
            return patched
        }
        return {
            ...patched,
            replies: patched.replies.map((reply) =>
                reply.id === commentId ? { ...reply, text } : reply,
            ),
        }
    })

/** Drop a comment (with its replies) or a single reply from the one-level tree. */
const dropComment = (
    comments: Array<PostComment>,
    commentId: string,
): Array<PostComment> =>
    comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) =>
            comment.replies
                ? { ...comment, replies: comment.replies.filter((reply) => reply.id !== commentId) }
                : comment,
        )

/** How many nodes a delete removes (a top-level comment takes its replies with it). */
const removedNodeCount = (comments: Array<PostComment>, commentId: string): number => {
    const topLevel = comments.find((comment) => comment.id === commentId)
    if (topLevel) {
        return 1 + (topLevel.replies?.length ?? 0)
    }
    return comments.some((comment) =>
        (comment.replies ?? []).some((reply) => reply.id === commentId),
    )
        ? 1
        : 0
}

/**
 * Author-only comment writes used by the detail thread: edit
 * (`PATCH /community/comments/{id}`) and delete (`DELETE /community/comments/{id}`).
 *
 * Both patch the shared `["post-detail", postId]` cache optimistically (so the
 * inline feed thread and the detail page move together) and roll back on failure;
 * a delete also adjusts the comment count on every mounted feed cache by the
 * number of nodes it removed (a top-level comment takes its replies with it).
 * 403 / 404 / 429 surface their own message.
 */
export const useMutateCommentActionsSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate, cache } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    const editComment = useCallback(
        async (postId: string, commentId: string, text: string): Promise<boolean> => {
            if (!requireAuth("auth.context.comment")) {
                return false
            }

            let snapshot: PostDetail | undefined
            await mutate<PostDetail>(
                postDetailKey(postId),
                (current) => {
                    snapshot = current
                    return current
                        ? { ...current, comments: patchCommentText(current.comments, commentId, text) }
                        : current
                },
                { revalidate: false },
            )

            try {
                await updateComment(commentId, { content: text })
            } catch (error) {
                await mutate(postDetailKey(postId), snapshot, { revalidate: false })
                toast.danger(t(communityErrorMessageKey(error, "engagement.commentUpdateFailed")))
                return false
            }
            return true
        },
        [mutate, requireAuth, t],
    )

    const removeComment = useCallback(
        async (postId: string, commentId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.comment")) {
                return false
            }

            let snapshot: PostDetail | undefined
            let removed = 0
            await mutate<PostDetail>(
                postDetailKey(postId),
                (current) => {
                    snapshot = current
                    if (!current) {
                        return current
                    }
                    removed = removedNodeCount(current.comments, commentId)
                    return { ...current, comments: dropComment(current.comments, commentId) }
                },
                { revalidate: false },
            )
            if (removed > 0) {
                await mutateCommunityFeeds(cache, mutate, patchFeedCommentCount(postId, -removed))
            }

            try {
                await deleteComment(commentId)
            } catch (error) {
                await mutate(postDetailKey(postId), snapshot, { revalidate: false })
                if (removed > 0) {
                    await mutateCommunityFeeds(cache, mutate, patchFeedCommentCount(postId, removed))
                }
                toast.danger(t(communityErrorMessageKey(error, "engagement.commentDeleteFailed")))
                return false
            }

            // The BE soft-deletes a comment that has replies (tombstone keeping the
            // thread), so the optimistic full removal must reconcile with the server
            // copy. A refetch error here must NOT report a failed delete.
            await mutate(postDetailKey(postId)).catch(() => {})
            return true
        },
        [cache, mutate, requireAuth, t],
    )

    return { editComment, removeComment }
}
