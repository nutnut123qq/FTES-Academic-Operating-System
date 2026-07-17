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
    /** Like count (change group-social-engagement — hydrated by the group feed DTO). */
    likes: number
    /** Whether the current user has liked this post. */
    liked: boolean
    /** Comment count. */
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
 * Maps a BE group post summary to the feed-card shape. The group feed slice now
 * carries live engagement (`likeCount`/`commentCount`/`likedByMe`, hydrated by the
 * BE via `community.getPostEngagement`). The feed DTO still only carries the author
 * id (no profile join), so the author display name / username fall back to it.
 */
const toGroupPost = (dto: GroupPostSummary, locale: string): GroupPost => ({
    id: dto.id,
    author: dto.authorId,
    authorUsername: dto.authorId,
    timeLabel: formatRelativeTime(dto.createdAt, locale),
    text: dto.title,
    likes: dto.likeCount ?? 0,
    liked: dto.likedByMe ?? false,
    comments: dto.commentCount ?? 0,
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
