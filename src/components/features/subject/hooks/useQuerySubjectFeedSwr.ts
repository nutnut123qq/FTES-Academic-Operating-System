"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import {
    querySubjectCommunity,
    SubjectFeedScope,
    type SubjectCommunityPost,
} from "@/modules/api/graphql/queries/query-subject-community"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { toMediaItems } from "@/components/features/community/hooks/useQueryCommunityFeedSwr"
import type { PostMediaItem } from "@/components/blocks/feed/PostMediaGrid"

/** Feed filter scope. */
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

/** A subject community post. */
export interface SubjectPost {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    title: string
    snippet: string
    reactions: number
    /** Whether the current user has liked this post (drives optimistic toggle). */
    liked: boolean
    /** Comment count for the discussion engagement bar. */
    comments: number
    /** Image attachments in server order (BE `Post.media`); empty when the post has none. */
    media: Array<PostMediaItem>
}

/**
 * SWR cache key for a subject's "Thảo luận" feed (shared with the like hook).
 * Keyed on `locale` (the mapped rows carry locale-formatted `timeLabel`s, so an
 * in-place locale switch must re-derive them) AND on `scope` now that the BE
 * `subjectWorkspace.community` is scope-aware.
 */
export const subjectFeedKey = (subjectId: string, locale: string, scope: FeedScope) => [
    "subject-feed",
    subjectId,
    locale,
    scope,
]

/** Map a BE `Post` (subjectWorkspace.community) to the discussion card contract. */
const toSubjectPost = (post: SubjectCommunityPost, locale: string): SubjectPost => ({
    id: post.id,
    author: post.author.displayName ?? post.author.username ?? "",
    authorUsername: post.author.username ?? post.author.id,
    timeLabel: formatRelativeTime(post.createdAt, locale),
    title: post.title ?? "",
    snippet: post.snippet ?? post.body ?? "",
    reactions: post.likeCount,
    liked: post.likedByMe,
    comments: post.commentCount,
    media: toMediaItems(post.media),
})

/**
 * Loads a subject's discussion feed from the real BE GraphQL
 * `subjectWorkspace(subjectId).community(scope: ...)` (a subject-scoped `PostConnection`).
 * Requires auth (viewer-scoped visibility); a guest / error surfaces via `error`
 * and the tab renders its empty/error state.
 */
export const useQuerySubjectFeedSwr = (subjectId: string, scope: FeedScope) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        subjectId ? subjectFeedKey(subjectId, locale, scope) : null,
        async (): Promise<Array<SubjectPost>> => {
            const result = await querySubjectCommunity({
                subjectId,
                scope: toSubjectFeedScope(scope),
            })
            const connection = result.data?.subjectWorkspace?.community
            return (connection?.items ?? []).map((item) => toSubjectPost(item, locale))
        },
    )
    return { posts: data ?? [], isLoading, error, mutate }
}
