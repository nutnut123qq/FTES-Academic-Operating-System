"use client"

import useSWR from "swr"
import { getActivityTimeline } from "@/modules/api/rest/activity"
import { useAppSelector } from "@/redux/hooks"
import { toActivityKind, type ActivityKind } from "../model"

export type { ActivityKind }

/** One row of the user activity timeline. */
export interface ActivityItem {
    id: string
    kind: ActivityKind
    /** Dotted BE event type; rendered through `activityMessageKey` + i18n, never raw. */
    type: string
    /** ISO timestamp; rendered as relative time in the feed. */
    time: string
}

/**
 * Loads the signed-in viewer's activity timeline from the real Activity Engine
 * REST API (`GET /activities?userId=…`).
 *
 * The BE event carries a dotted `type` + ref ids but NO rendered sentence, so the row
 * text is produced on the FE from the type (see `../model`). The `/activities/types`
 * catalog is deliberately NOT fetched: its `description` column is seeded
 * Vietnamese-only and covers only catalogued types, so it produced Vietnamese prose for
 * English viewers and raw dotted types for everything else.
 */
export const useQueryActivitySwr = () => {
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { data, isLoading, error, mutate } = useSWR(
        viewerId ? ["GET_ACTIVITY_TIMELINE", viewerId] : null,
        async (): Promise<Array<ActivityItem>> => {
            const page = await getActivityTimeline({ userId: viewerId, limit: 30 })
            return (page.items ?? []).map((event) => ({
                id: event.eventId,
                kind: toActivityKind(event.type),
                type: event.type,
                time: event.occurredAt,
            }))
        },
    )
    return { activity: data ?? [], isLoading, error, mutate }
}
