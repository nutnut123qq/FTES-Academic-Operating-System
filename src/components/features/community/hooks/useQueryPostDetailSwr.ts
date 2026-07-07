"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { queryCommunityPost } from "@/modules/api/graphql/queries/query-community-post"
import type { FeedPost } from "@/modules/api/graphql/queries/query-community-feed"
import { formatRelativeTime } from "./relativeTime"

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
}

/** SWR cache key for a post's detail — shared by the detail page, the inline
 * comment thread, and the like/comment mutation hooks (ONE source of truth). */
export const postDetailKey = (postId: string) => ["post-detail", postId]

/**
 * Map a BE `Post` to the detail view contract. The BE GraphQL `post(id)` is minimal:
 * it carries NO body, likes, or comments (those live behind the community REST module,
 * which is not reachable with the current token). They degrade to "" / 0 / [] rather
 * than being fabricated — the detail shows author · time · title honestly.
 */
const toPostDetail = (post: FeedPost, locale: string): PostDetail => ({
    id: post.id,
    author: post.author.displayName ?? post.author.username ?? "",
    authorUsername: post.author.username ?? post.author.id,
    timeLabel: formatRelativeTime(post.createdAt, locale),
    title: post.title ?? "",
    body: "",
    likes: 0,
    liked: false,
    comments: [],
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
