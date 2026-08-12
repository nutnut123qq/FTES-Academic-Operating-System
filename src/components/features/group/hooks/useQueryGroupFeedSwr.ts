"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { getGroupFeed, type GroupPostSummary } from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A group post (§7). */
export interface GroupPost {
    id: string
    /**
     * Display name of the author, or `""` when the BE sent no author card. It is NEVER
     * the author id any more — the card renders the shared "member" label instead, so a
     * uuid can't end up as somebody's name.
     */
    author: string
    /** URL-facing username for profile link + hovercard; `""` when there is no profile. */
    authorUsername: string
    /** Author's uploaded avatar (BE `GroupPostSummary.author.avatarUrl`); null = no photo. */
    authorAvatar?: string | null
    /** Author's platform staff role (BE `UserCard.staffRole`); null = ordinary member. */
    authorStaffRole?: string | null
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
 * BE via `community.getPostEngagement`) AND an `author` display card (`GroupDtos.UserCard`,
 * batch-loaded per page by `GroupAuthorEnricher`) — this mapper used to ignore it and
 * degrade BOTH the name and the username to `authorId`, which is how a uuid ended up as
 * the author's name and the avatar fell back to a face generated from that uuid.
 *
 * Empty (not the id) when the card is absent: the name is then supplied by the card as a
 * shared "member" label, and an empty username makes `UserLink` render plain text rather
 * than a profile link that could only ever 404.
 */
const toGroupPost = (dto: GroupPostSummary, locale: string): GroupPost => ({
    id: dto.id,
    author: dto.author?.displayName ?? dto.author?.username ?? "",
    authorUsername: dto.author?.username ?? "",
    authorAvatar: dto.author?.avatarUrl ?? null,
    authorStaffRole: dto.author?.staffRole ?? null,
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
