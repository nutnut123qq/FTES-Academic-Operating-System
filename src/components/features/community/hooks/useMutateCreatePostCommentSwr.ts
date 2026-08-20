"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useViewerAuthorCard, viewerAuthorName } from "@/hooks/useViewerAuthorCard"
import { addComment } from "@/modules/api/rest/community"
import {
    mutateCommunityFeeds,
    patchFeedPostInPages,
    type CommunityFeedPage,
} from "./useQueryCommunityFeedSwr"
import { postDetailKey, type PostComment, type PostDetail } from "./useQueryPostDetailSwr"

/** Apply a signed delta to the target post's comment count across every feed page. */
const patchFeedCommentCount = (postId: string, delta: number) =>
    (pages: Array<CommunityFeedPage> | undefined): Array<CommunityFeedPage> | undefined =>
        patchFeedPostInPages(pages, postId, (post) => ({
            ...post,
            comments: Math.max(0, post.comments + delta),
        }))

/** Input for a comment/reply submission. */
export interface SubmitCommentInput {
    /** The post being commented on. */
    postId: string
    /** The comment body (already trimmed non-empty by the caller). */
    body: string
    /**
     * FALLBACK author label for the optimistic node ("Bạn"/"You"). Used only when the
     * viewer's own session card is unavailable: with a card the node is signed with the
     * REAL display name, because that is what the server row replacing it will carry — a
     * "Bạn" that turns into "Nguyễn Văn A" one round-trip later is the rename this
     * fallback exists to avoid, not to cause.
     */
    authorLabel: string
    /**
     * FALLBACK URL-facing username for the optimistic node's profile link + hovercard,
     * used on the same terms as {@link SubmitCommentInput.authorLabel}.
     */
    authorUsername: string
    /** Localized "just now" time label for the optimistic node. */
    justNowLabel: string
    /** When replying, the parent top-level comment id (one level only). */
    parentCommentId?: string
}

/**
 * Creates a comment (top-level or one-level reply) on a community post with an
 * optimistic append to the `["post-detail", postId]` cache (which the inline
 * thread and detail page share) plus a +1 to the comment count on EVERY
 * community-feed cache holding the post (For You + the following/campus/trending
 * tab variants), via a key matcher — the previous single-key patch missed the
 * active tab whenever it wasn't For You. On explicit failure the optimistic node
 * is removed, the count is reverted symmetrically, and the caller is told to
 * restore the draft (via the thrown error / false return).
 *
 * The optimistic node is SIGNED with the viewer's own identity — name, handle AND
 * avatar — read from the session card already in the store ({@link useViewerAuthorCard},
 * no extra request). It used to carry a bare "Bạn"/"You" and no avatar at all, so the
 * writer's own comment appeared unphotographed under a pronoun and then silently renamed
 * itself to their real name + photo when the revalidation landed. The card is the same
 * profile the BE resolves for that account, so the swap is now invisible. Only a viewer
 * the store cannot name (guest / unhydrated session) falls back to the caller's labels.
 *
 * Guests get the `AuthenticationModal` and nothing is appended.
 *
 * @returns `submit(input)` resolving `true` on success, `false` on failure or a
 * blocked guest — callers use `false` to keep the draft in the composer.
 */
export const useMutateCreatePostCommentSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate, cache } = useSWRConfig()
    const { requireAuthAsync } = useRequireAuth()
    const viewer = useViewerAuthorCard()

    return useCallback(
        async (input: SubmitCommentInput): Promise<boolean> => {
            if (!(await requireAuthAsync("auth.context.comment"))) {
                return false
            }

            const tempId = `tmp-${Date.now()}`
            const optimistic: PostComment = {
                id: tempId,
                author: viewerAuthorName(viewer, input.authorLabel),
                authorUsername: viewer?.username ?? input.authorUsername,
                authorAvatar: viewer?.avatarUrl ?? null,
                text: input.body,
                timeLabel: input.justNowLabel,
            }

            let detailSnapshot: PostDetail | undefined

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
            // +1 on EVERY feed-tab cache that holds this post (For You / following /
            // campus / trending), not only the default For You cache — a post
            // commented from another tab lives under that tab's key.
            await mutateCommunityFeeds(cache, mutate, patchFeedCommentCount(input.postId, 1))

            try {
                await addComment(input.postId, {
                    body: input.body,
                    parentId: input.parentCommentId,
                })
            } catch {
                // Only a failure of the WRITE (transport reject OR RestError envelope)
                // rolls back the optimistic node + feed count and tells the caller to
                // keep the draft.
                await mutate(postDetailKey(input.postId), detailSnapshot, { revalidate: false })
                // revert the +1 symmetrically across the same feed caches
                await mutateCommunityFeeds(cache, mutate, patchFeedCommentCount(input.postId, -1))
                toast.danger(t("engagement.commentFailed"))
                return false
            }

            // The comment is created → revalidate the shared post-detail cache so the
            // optimistic node is replaced by the server comment (real id + ordering).
            // A revalidation refetch error must NOT report a failed write.
            await mutate(postDetailKey(input.postId)).catch(() => {})
            return true
        },
        [mutate, cache, requireAuthAsync, viewer, t],
    )
}
