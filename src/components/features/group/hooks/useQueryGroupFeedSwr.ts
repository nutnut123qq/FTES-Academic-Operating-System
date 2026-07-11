"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { getGroupFeed, type GroupPostSummary } from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A group post (§7). */
export interface GroupPost {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    text: string
    /** Like count. mock BE - endpoint pending: no group-post reaction contract → seeded 0. */
    likes: number
    /** Whether the current user has liked this post. mock BE - endpoint pending. */
    liked: boolean
    /** Comment count. mock BE - endpoint pending: no group-post comment contract → seeded 0. */
    comments: number
}

/** SWR cache key for a group's feed (shared with the group like mutation hook). */
export const groupFeedKey = (groupId: string) => ["group-feed", groupId]

/**
 * Matches every locale variant of a group's feed cache key. The live key carries
 * the locale (see {@link useQueryGroupFeedSwr}), so mutation hooks must revalidate
 * with this key-filter rather than the bare {@link groupFeedKey}, which no longer
 * matches the cached entry exactly.
 */
export const matchesGroupFeedKey =
    (groupId: string) =>
    (key: unknown): boolean => {
        const base = groupFeedKey(groupId)
        return Array.isArray(key) && key[0] === base[0] && key[1] === base[1]
    }

/**
 * Maps a BE community post summary to the feed-card shape. The community feed
 * contract only carries author id + post title + timestamp, so the author's
 * display name / username fall back to the author id, and the card body shows
 * the post title. mock BE - endpoint pending: reactions (likes/liked) and
 * comment counts have no group-post contract yet → seeded to 0/false.
 */
const toGroupPost = (dto: GroupPostSummary, locale: string): GroupPost => ({
    id: dto.id,
    author: dto.authorId,
    authorUsername: dto.authorId,
    timeLabel: formatRelativeTime(dto.createdAt, locale),
    text: dto.title,
    likes: 0,
    liked: false,
    comments: 0,
})

/** Loads a group's feed from the real group REST API (community feed slice). */
export const useQueryGroupFeedSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? [...groupFeedKey(groupId), locale] : null,
        async (): Promise<Array<GroupPost>> => {
            const slice = await getGroupFeed(groupId, { limit: 50 })
            return (slice.items ?? []).map((dto) => toGroupPost(dto, locale))
        },
    )
    return { posts: data ?? [], isLoading, error, mutate }
}
