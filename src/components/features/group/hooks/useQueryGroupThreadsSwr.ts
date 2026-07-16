"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { listGroupThreads, type GroupThreadDto } from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A discussion thread (§7, change group-social-engagement). */
export interface GroupThread {
    id: string
    title: string
    /** Author display — falls back to the author id (feed DTO has no profile join). */
    author: string
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

const toGroupThread = (dto: GroupThreadDto, locale: string): GroupThread => ({
    id: dto.id,
    title: dto.title,
    author: dto.authorId,
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
