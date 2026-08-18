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
    // Chỉ nhận username THẬT. Rơi về `author.id` là dựng liên kết hồ sơ `/u/<uuid>`:
    // `UserLink` dựng `href` ngay khi trường này khác rỗng, nên một uuid ở đây thành
    // link CHẾT (404) kèm một lượt gọi hovercard cũng 404. Rỗng thì `UserLink` in tên
    // mà KHÔNG bọc link — thà vậy còn hơn liên kết chết. Cùng quy ước với
    // `toCommunityPost`/`toSubjectPost`.
    // Không có cổng sở hữu nào phụ thuộc trường này ở luồng này: `SubjectCommunity`
    // dựng `PostCommentThread` không truyền `onEdit`/`onDelete`, tức luồng thảo luận
    // môn học không có sửa/xoá để mà mất. (Khác `useQueryPostDetailSwr`, nơi id được
    // GIỮ có chủ đích vì `PostCommentThread.isMine` so viewer id với chính trường này.)
    authorUsername: reply.author.username ?? "",
    authorStaffRole: reply.author.staffRole ?? null,
    // The document already selects `avatarUrl`; dropping it here made every commenter
    // render the seeded fallback face, which reads as "this person has no photo" even
    // when they do. Same defect the community feed mappers were fixed for.
    authorAvatar: reply.author.avatarUrl ?? null,
    text: reply.body,
    timeLabel: formatRelativeTime(reply.createdAt, locale),
})

/**
 * Map a BE top-level comment node (with its one-level replies) to `PostComment`.
 *
 * Exported for unit tests: this mapper is what keeps a raw author uuid out of the
 * URL-facing slot on the subject discussion thread (see `toReply`).
 */
export const toComment = (comment: SubjectCommunityCommentNode, locale: string): PostComment => ({
    ...toReply(comment, locale),
    replies: comment.replies.map((reply) => toReply(reply, locale)),
})

/**
 * Lazily loads a subject post's comment thread (only once expanded) from the real BE.
 *
 * ponytail: MÃ CHẾT — tab Thảo luận nay render `CommunityFeedRow`, thread bình luận của nó đọc
 * qua `useQueryPostCommentsSwr` của community. Để lại chờ một lượt dọn riêng (`toComment` vẫn
 * có test riêng, đừng xoá kèm trong cùng lượt).
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
