"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { listAnnouncements } from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A group announcement (§7). */
export interface GroupAnnouncement {
    id: string
    title: string
    body: string
    timeLabel: string
}

/** Loads a group's announcements from the real group REST API (pinned first). */
export const useQueryGroupAnnouncementsSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? ["GET_GROUP_ANNOUNCEMENTS", groupId] : null,
        async (): Promise<Array<GroupAnnouncement>> => {
            const items = await listAnnouncements(groupId, { limit: 50 })
            return (items ?? [])
                .slice()
                .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                .map((dto) => ({
                    id: dto.id,
                    title: dto.title,
                    body: dto.content,
                    timeLabel: formatRelativeTime(dto.createdAt, locale),
                }))
        },
    )
    return { announcements: data ?? [], isLoading, error, mutate }
}
