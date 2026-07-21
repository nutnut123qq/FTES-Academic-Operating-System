"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import {
    queryCommunityPost,
    type CommunityPostCommentNode,
    type CommunityPostNode,
    type CommunityPostReplyNode,
} from "@/modules/api/graphql/queries/query-community-post"
import type { PostMediaItem } from "@/components/blocks/feed/PostMediaGrid"
import { formatRelativeTime } from "./relativeTime"
import { toMediaItems } from "./useQueryCommunityFeedSwr"

/** A comment on a post. Replies are flat, one level deep (Threads-like). */
export interface PostComment {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    text: string
    timeLabel: string
    /** One-level replies under this top-level comment (absent on replies). */
    replies?: Array<PostComment>
}

/** Full post detail (BE `Post` mapped to the detail view). */
export interface PostDetail {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    title: string
    body: string
    likes: number
    /** Whether the current user has liked this post. */
    liked: boolean
    comments: Array<PostComment>
    /** Image attachments in server order; empty when the post has none. */
    media: Array<PostMediaItem>
}

/** SWR cache key for a post's detail — shared by the detail page, the inline
 * comment thread, and the like/comment mutation hooks (ONE source of truth). */
export const postDetailKey = (postId: string) => ["post-detail", postId]

/** Map a BE comment reply node to the flat `PostComment` reply contract. */
const toReply = (reply: CommunityPostReplyNode, locale: string): PostComment => ({
    id: reply.id,
    author: reply.author.displayName ?? reply.author.username ?? "",
    authorUsername: reply.author.username ?? reply.author.id,
    text: reply.body,
    timeLabel: formatRelativeTime(reply.createdAt, locale),
})

/** Map a BE top-level comment node (with its one-level replies) to `PostComment`. */
const toComment = (comment: CommunityPostCommentNode, locale: string): PostComment => ({
    ...toReply(comment, locale),
    replies: comment.replies.map((reply) => toReply(reply, locale)),
})

/**
 * Map a BE `Post` to the detail view contract. The gateway now returns the full `body`,
 * the `likeCount`/`likedByMe` engagement and the `comments` thread, so the detail renders
 * real content and a live comment list instead of the previous "" / 0 / [] placeholders.
 */
const toPostDetail = (post: CommunityPostNode, locale: string): PostDetail => ({
    id: post.id,
    author: post.author.displayName ?? post.author.username ?? "",
    authorUsername: post.author.username ?? post.author.id,
    timeLabel: formatRelativeTime(post.createdAt, locale),
    title: post.title ?? "",
    body: post.body ?? "",
    likes: post.likeCount,
    liked: post.likedByMe,
    comments: post.comments.map((comment) => toComment(comment, locale)),
    media: toMediaItems(post.media),
})

/** Fetch + map a single post; a not-found / not-visible id throws (Apollo error) → caller degrades. */
const fetchPostDetail = async (postId: string, locale: string): Promise<PostDetail> => {
    const result = await queryCommunityPost({ id: postId })
    const post = result.data?.post
    if (!post) {
        throw new Error("post not found")
    }
    return toPostDetail(post, locale)
}

/** Loads a post's detail from the real BE GraphQL `post(id)`. */
export const useQueryPostDetailSwr = (postId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        postDetailKey(postId),
        () => fetchPostDetail(postId, locale),
    )
    return { post: data, isLoading, error, mutate }
}

/**
 * Lazy variant used by the inline comment thread: fetches the SAME
 * `["post-detail", postId]` cache but only once the post is expanded (key is
 * `null` until then), so comments never load with the feed. Reusing the detail
 * cache keeps the inline thread, the detail page, and comment mutations in sync.
 *
 * @param postId - the post whose comments to load.
 * @param enabled - true once the post has been expanded at least once.
 */
export const useQueryPostCommentsSwr = (postId: string, enabled: boolean) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? postDetailKey(postId) : null,
        () => fetchPostDetail(postId, locale),
    )
    return { post: data, isLoading, error, mutate }
}
