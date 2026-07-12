"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import {
    querySubjectCommunity,
    SubjectFeedScope,
    type SubjectCommunityCommentNode,
    type SubjectCommunityReplyNode,
} from "@/modules/api/graphql/queries/query-subject-community"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** Client-side feed scope facet. */
export type FeedScope = "forYou" | "following" | "trending"

/** Maps the client scope facet to the BE `SubjectFeedScope` enum. */
const toSubjectFeedScope = (scope: FeedScope): SubjectFeedScope => {
    switch (scope) {
        case "following":
            return SubjectFeedScope.Following
        case "trending":
            return SubjectFeedScope.Trending
        case "forYou":
        default:
            return SubjectFeedScope.ForYou
    }
}

/**
 * Comment thread for a subject "Thảo luận" post. Real data is read from the same
 * `subjectWorkspace(subjectId).community(scope: ...)` connection that powers the feed:
 * `Post.comments` is batch-resolved (top-level + one reply level) per post.
 */
export interface SubjectPostThread {
    /** The subject post id. */
    id: string
    /** Flat one-level comment list. */
    comments: Array<PostComment>
}

/** SWR cache key for a subject post's comment thread. */
export const subjectPostCommentsKey = (
    subjectId: string,
    postId: string,
    scope: FeedScope,
) => ["subject-post-comments", subjectId, postId, scope]

/** Map a BE reply node to the flat `PostComment` reply contract. */
const toReply = (reply: SubjectCommunityReplyNode, locale: string): PostComment => ({
    id: reply.id,
    author: reply.author.displayName ?? reply.author.username ?? "",
    authorUsername: reply.author.username ?? reply.author.id,
    text: reply.body,
    timeLabel: formatRelativeTime(reply.createdAt, locale),
})

/** Map a BE top-level comment node (with its one-level replies) to `PostComment`. */
const toComment = (comment: SubjectCommunityCommentNode, locale: string): PostComment => ({
    ...toReply(comment, locale),
    replies: comment.replies.map((reply) => toReply(reply, locale)),
})

/**
 * Lazily loads a subject post's comment thread (only once expanded) from the real BE.
 *
 * @param subjectId - the owning subject id.
 * @param postId - the subject post whose comments to load.
 * @param enabled - true once the post has been expanded at least once.
 * @param scope - the feed scope to query; defaults to "forYou".
 */
export const useQuerySubjectPostCommentsSwr = (
    subjectId: string,
    postId: string,
    enabled: boolean,
    scope: FeedScope = "forYou",
) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? subjectPostCommentsKey(subjectId, postId, scope) : null,
        async (): Promise<SubjectPostThread> => {
            const result = await querySubjectCommunity({
                subjectId,
                scope: toSubjectFeedScope(scope),
            })
            const post = result.data?.subjectWorkspace?.community.items.find(
                (item) => item.id === postId,
            )
            if (!post) {
                throw new Error("post not found")
            }
            return {
                id: post.id,
                comments: post.comments.map((comment) => toComment(comment, locale)),
            }
        },
    )
    return { thread: data, isLoading, error, mutate }
}
