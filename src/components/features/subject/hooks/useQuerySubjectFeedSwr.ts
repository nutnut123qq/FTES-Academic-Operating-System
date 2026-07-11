"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import {
    querySubjectCommunity,
    type SubjectCommunityPost,
} from "@/modules/api/graphql/queries/query-subject-community"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** Feed filter scope. */
export type FeedScope = "forYou" | "following" | "trending"

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
}

/**
 * SWR cache key for a subject's "Thảo luận" feed (shared with the like hook).
 * Keyed on `locale` (the mapped rows carry locale-formatted `timeLabel`s, so an
 * in-place locale switch must re-derive them). NOT keyed on `FeedScope`: the BE
 * `subjectWorkspace.community` connection is not scope-aware, so all scopes share
 * one cache entry — one fetch, one coherent like cache across tabs.
 */
export const subjectFeedKey = (subjectId: string, locale: string) => [
    "subject-feed",
    subjectId,
    locale,
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
})

/**
 * Loads a subject's discussion feed from the real BE GraphQL
 * `subjectWorkspace(subjectId).community` (a subject-scoped `PostConnection`).
 * Requires auth (viewer-scoped visibility); a guest / error surfaces via `error`
 * and the tab renders its empty/error state.
 *
 * mock BE — the `community` field is a single subject-scoped connection and is NOT
 * scope-aware: the `forYou` / `following` / `trending` tabs have no BE contract, so
 * `scope` is a client-side view label only and does NOT key the cache — all tabs
 * share one feed + one coherent like cache (see {@link subjectFeedKey}).
 */
export const useQuerySubjectFeedSwr = (subjectId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        subjectId ? subjectFeedKey(subjectId, locale) : null,
        async (): Promise<Array<SubjectPost>> => {
            const result = await querySubjectCommunity({ subjectId })
            const connection = result.data?.subjectWorkspace?.community
            return (connection?.items ?? []).map((item) => toSubjectPost(item, locale))
        },
    )
    return { posts: data ?? [], isLoading, error, mutate }
}
