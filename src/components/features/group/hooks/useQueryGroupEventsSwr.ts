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
    /** Real count of members who RSVP'd GOING. */
    attendeeCount: number
    /** Whether the current caller has RSVP'd GOING. */
    attending: boolean
}

/** SWR cache key for a group's events (shared with the RSVP mutation hook). */
export const groupEventsKey = (groupId: string) => ["GET_GROUP_EVENTS", groupId]

/**
 * Matches every locale variant of a group's events cache key. The live key carries
 * the locale (rows hold locale-formatted `dateLabel`s), so the RSVP mutation hook
 * revalidates with this key-filter.
 */
export const matchesGroupEventsKey =
    (groupId: string) =>
    (key: unknown): boolean => {
        const base = groupEventsKey(groupId)
        return Array.isArray(key) && key[0] === base[0] && key[1] === base[1]
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
 * (`GET /api/v1/groups/{id}/events`). Rows now carry live RSVP state
 * (`attendeeCount` + `attending`) — change group-identity-media-rules-rsvp.
 */
export const useQueryGroupEventsSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? [...groupEventsKey(groupId), locale] : null,
        async (): Promise<Array<GroupEvent>> => {
            const items = await listGroupEvents(groupId, { limit: 50 })
            return (items ?? []).map((dto: GroupEventDto) => ({
                id: dto.id,
                title: dto.title,
                dateLabel: formatEventDate(dto.startsAt, locale),
                location: dto.location || undefined,
                attendeeCount: dto.attendeeCount ?? 0,
                attending: dto.attending ?? false,
            }))
        },
    )
    return { events: data ?? [], isLoading, error, mutate }
}
