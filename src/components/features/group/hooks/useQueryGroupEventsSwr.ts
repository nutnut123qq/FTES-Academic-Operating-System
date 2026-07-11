"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { listGroupEvents, type GroupEvent as GroupEventDto } from "@/modules/api/rest/group"

/** A group event mapped to the row contract (§7/§14). */
export interface GroupEvent {
    id: string
    title: string
    /** Localized start date-time label. */
    dateLabel: string
    /** Optional venue/location. */
    location?: string
}

/** Locale-aware "Fri, 05/07 · 19:00"-style label from an ISO start timestamp. */
const formatEventDate = (iso: string, locale: string): string => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return ""
    }
    return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

/**
 * Loads a group's events from the real group REST API
 * (`GET /api/v1/groups/{id}/events`). `attendeeCount` is dropped from the mapped
 * shape because the BE always returns 0 (no RSVP contract — see the row UI).
 */
export const useQueryGroupEventsSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        // `locale` keys the cache because the mapped rows carry locale-formatted
        // `dateLabel`s — an in-place locale switch must re-derive them.
        groupId ? ["GET_GROUP_EVENTS", groupId, locale] : null,
        async (): Promise<Array<GroupEvent>> => {
            const items = await listGroupEvents(groupId, { limit: 50 })
            return (items ?? []).map((dto: GroupEventDto) => ({
                id: dto.id,
                title: dto.title,
                dateLabel: formatEventDate(dto.startsAt, locale),
                location: dto.location || undefined,
            }))
        },
    )
    return { events: data ?? [], isLoading, error, mutate }
}
