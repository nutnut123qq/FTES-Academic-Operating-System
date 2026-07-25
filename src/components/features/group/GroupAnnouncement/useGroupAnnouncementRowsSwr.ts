"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { listAnnouncements } from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A group announcement row as the tab renders (and edits) it. */
export interface GroupAnnouncementRow {
    id: string
    title: string
    /** The announcement body (`content` on the wire). */
    body: string
    /** Pinned announcements sort to the top and carry a badge. */
    pinned: boolean
    /** Localized "x minutes ago" label. */
    timeLabel: string
}

/** SWR cache key of a group's announcements (locale rides along — rows are formatted). */
export const groupAnnouncementsKey = (groupId: string) => ["GET_GROUP_ANNOUNCEMENTS", groupId]

/**
 * Loads a group's announcements (`GET /groups/{id}/announcements`), pinned first.
 *
 * Unlike the read-only list hook this one KEEPS `pinned` on every row, because the
 * owner's edit form has to round-trip it (a PATCH that dropped `pinned` would silently
 * unpin whatever it edits).
 *
 * @param groupId - the owning group id.
 */
export const useGroupAnnouncementRowsSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? [...groupAnnouncementsKey(groupId), locale] : null,
        async (): Promise<Array<GroupAnnouncementRow>> => {
            const items = await listAnnouncements(groupId, { limit: 50 })
            return (items ?? [])
                .slice()
                .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                .map((dto) => ({
                    id: dto.id,
                    title: dto.title,
                    body: dto.content,
                    pinned: dto.pinned ?? false,
                    timeLabel: formatRelativeTime(dto.createdAt, locale),
                }))
        },
    )
    return { announcements: data ?? [], isLoading, error, mutate }
}
