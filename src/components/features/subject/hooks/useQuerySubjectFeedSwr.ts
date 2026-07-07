"use client"

import useSWR from "swr"

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

/** SWR cache key for a subject's "Thảo luận" feed (shared with the like hook). */
export const subjectFeedKey = (subjectId: string, scope: FeedScope) => [
    "subject-feed",
    subjectId,
    scope,
]

/**
 * Loads a subject's community feed for a scope.
 *
 * The subject **workspace** aggregate only exposes a community `feedRef`/`endpoint`
 * pointer (`/api/v1/community/feed?subjectId=…`) — the posts themselves are owned by
 * the separate community module, which this subject vertical does not wire. Rather
 * than fabricate posts, the feed returns empty and the tab renders its honest empty
 * state until the community feed is integrated. Shape is unchanged so the like +
 * comment interactions remain a drop-in once the real feed lands.
 */
export const useQuerySubjectFeedSwr = (subjectId: string, scope: FeedScope) => {
    const { data, isLoading, error, mutate } = useSWR(
        subjectFeedKey(subjectId, scope),
        async (): Promise<Array<SubjectPost>> => [],
    )
    return { posts: data ?? [], isLoading, error, mutate }
}
