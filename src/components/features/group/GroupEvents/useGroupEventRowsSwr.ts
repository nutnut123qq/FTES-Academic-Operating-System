"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { listGroupEvents, type GroupEvent as GroupEventDto } from "@/modules/api/rest/group"
import { groupEventsKey } from "../hooks/useQueryGroupEventsSwr"

/**
 * A group event row. Superset of the RSVP-only row shape: it keeps the RAW
 * `description` / `startsAt` / `endsAt` alongside the formatted `dateLabel`, because
 * the owner's edit form has to prefill them (and a PATCH that guessed them back out
 * of a localized label would corrupt the schedule).
 */
export interface GroupEventRow {
    id: string
    title: string
    description: string
    location?: string
    /** ISO-8601 instant — edit-form truth. */
    startsAt: string
    /** ISO-8601 instant, when the event has an end. */
    endsAt?: string
    /** Locale-formatted start label shown in the row meta. */
    dateLabel: string
    /** Real count of members who RSVP'd GOING (server truth). */
    attendeeCount: number
    /** Whether the current caller has RSVP'd GOING. */
    attending: boolean
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
 * Loads a group's events (`GET /groups/{id}/events`) into {@link GroupEventRow}s.
 *
 * It deliberately reuses the SHARED events cache key (`groupEventsKey` + locale) so
 * the existing RSVP mutation keeps working untouched: that hook patches rows by key
 * filter and only rewrites `attending`/`attendeeCount`, spreading the rest through —
 * which leaves the extra edit-form fields intact.
 *
 * @param groupId - the owning group id.
 */
export const useGroupEventRowsSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? [...groupEventsKey(groupId), locale] : null,
        async (): Promise<Array<GroupEventRow>> => {
            const items = await listGroupEvents(groupId, { limit: 50 })
            return (items ?? []).map((dto: GroupEventDto) => ({
                id: dto.id,
                title: dto.title,
                description: dto.description ?? "",
                location: dto.location || undefined,
                startsAt: dto.startsAt,
                endsAt: dto.endsAt || undefined,
                dateLabel: formatEventDate(dto.startsAt, locale),
                attendeeCount: dto.attendeeCount ?? 0,
                attending: dto.attending ?? false,
            }))
        },
    )
    return { events: data ?? [], isLoading, error, mutate }
}
