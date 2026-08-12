"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { listGroupThreads, type GroupThreadDto } from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A discussion thread (§7, change group-social-engagement). */
export interface GroupThread {
    id: string
    title: string
    /**
     * Author display name, or `""` when the BE sent no profile card. NEVER the author id —
     * printing the uuid is exactly what this surface used to do.
     */
    author: string
    /** URL-facing username for the profile link + hovercard; `""` when unknown. */
    authorUsername: string
    /** Author's avatar (BE `UserCard.avatarUrl`); null = no photo, initials tile instead. */
    authorAvatar: string | null
    /** Author's platform staff role (BE `UserCard.staffRole`); null = ordinary member. */
    authorStaffRole: string | null
    /** Thread body (markdown). */
    content: string
    /** Reply count. */
    replies: number
    /** Like count for the discussion engagement bar. */
    likes: number
    /** Whether the current user has liked this thread. */
    liked: boolean
    /** Localized "last active" relative-time label. */
    lastActivityLabel: string
}

/** SWR cache key for a group's discussion threads (shared with the like/compose hooks). */
export const groupThreadsKey = (groupId: string) => ["group-threads", groupId]

/**
 * Matches every locale variant of a group's threads cache key. The live key carries
 * the locale, so mutation hooks revalidate with this key-filter rather than the bare
 * {@link groupThreadsKey}.
 */
export const matchesGroupThreadsKey =
    (groupId: string) =>
    (key: unknown): boolean => {
        const base = groupThreadsKey(groupId)
        return Array.isArray(key) && key[0] === base[0] && key[1] === base[1]
    }

/**
 * Maps a BE thread onto the row contract. The BE has been sending an `author` card
 * (`GroupDtos.UserCard`, batch-loaded by `GroupAuthorEnricher`) all along — this mapper
 * used to ignore it and put `authorId` in the name slot, which is how a raw uuid ended up
 * printed under every discussion title.
 *
 * Empty string (not the id) when the card is absent: `UserLink` then renders a shared
 * "member" label, and a blank username makes it plain text instead of a profile link that
 * could only ever 404.
 */
export const toGroupThread = (dto: GroupThreadDto, locale: string): GroupThread => ({
    id: dto.id,
    title: dto.title,
    author: dto.author?.displayName ?? dto.author?.username ?? "",
    authorUsername: dto.author?.username ?? "",
    authorAvatar: dto.author?.avatarUrl ?? null,
    authorStaffRole: dto.author?.staffRole ?? null,
    content: dto.content,
    replies: dto.replyCount,
    likes: dto.likeCount,
    liked: dto.likedByMe,
    lastActivityLabel: formatRelativeTime(dto.lastActivityAt, locale),
})

/** Loads a group's discussion threads from the real REST API (sorted last-active desc). */
export const useQueryGroupThreadsSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? [...groupThreadsKey(groupId), locale] : null,
        async (): Promise<Array<GroupThread>> => {
            const page = await listGroupThreads(groupId, { limit: 30 })
            return (page.items ?? []).map((dto) => toGroupThread(dto, locale))
        },
    )
    return { threads: data ?? [], isLoading, error, mutate }
}
