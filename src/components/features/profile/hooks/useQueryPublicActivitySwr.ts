"use client"

import useSWR from "swr"
import { getActivityTimeline } from "@/modules/api/rest/activity"
import type { ActivityView } from "@/modules/api/rest/activity"
import { toActivityKind, type ActivityKind } from "@/components/features/activity/model"
import { shiftIso, vnTodayIso } from "@/components/features/gamification/StreakHeatmap/model"
import { useAppSelector } from "@/redux/hooks"

/** One row of a public profile's activity timeline. */
export interface PublicActivityItem {
    id: string
    kind: ActivityKind
    /** Dotted BE event type; rendered through `activityMessageKey` + i18n, never raw. */
    type: string
    /** ISO timestamp of the event. */
    time: string
}

/** One day of the activity grid: a Vietnam-day ISO date and how many events landed on it. */
export interface PublicActivityDay {
    date: string
    count: number
}

/** Activity payload behind the public profile's Activity tab. */
export interface PublicActivity {
    /** Newest-first activity rows (capped at {@link TIMELINE_ROWS}). */
    timeline: Array<PublicActivityItem>
    /** Sparse per-day event counts (only days with ≥1 event). */
    days: Array<PublicActivityDay>
    /**
     * How many whole weeks ending today the grid may render WITHOUT inventing data.
     * `0` = not enough coverage to draw a grid at all. See {@link fetchPublicActivity}.
     */
    coveredWeeks: number
    /** True when paging stopped at {@link MAX_PAGES} before exhausting the user's history. */
    isPartial: boolean
}

/** Widest grid the tab draws (matches the streak heatmap's 12-week window). */
const GRID_WEEKS = 12
/** BE clamps `limit` to 50 (`TimelineService.MAX_LIMIT`). */
const PAGE_SIZE = 50
/** Hard cap on paging so one profile view can never fan out unboundedly. */
const MAX_PAGES = 4
/** How many timeline rows the tab lists. */
const TIMELINE_ROWS = 20

/**
 * Buckets an event instant into a Vietnam calendar day (`yyyy-mm-dd`), matching how
 * {@link vnTodayIso} keys "today" — so the newest column is the viewer's *server* day
 * regardless of the viewer's own timezone.
 */
const vnDayOf = (iso: string): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso))

/** Inclusive day span between two `yyyy-mm-dd` dates. */
const daysBetween = (fromIso: string, toIso: string): number => {
    const from = Date.parse(`${fromIso}T00:00:00Z`)
    const to = Date.parse(`${toIso}T00:00:00Z`)
    return Math.floor((to - from) / 86_400_000) + 1
}

/**
 * Loads a user's visible activity and folds it into (a) a newest-first timeline and
 * (b) sparse per-day counts for the contribution grid.
 *
 * The BE has NO per-day aggregate endpoint for another user — `GET /gamification/me/
 * activity-days` is self-scoped, and `GET /profiles/{username}/timeline` is served by a
 * stub port that always returns `[]`. The only real source is `GET /activities?userId=`,
 * which returns individual dated events newest-first behind a keyset cursor, already
 * privacy-filtered for the caller (PUBLIC for outsiders, +FOLLOWERS for followers, all
 * for self).
 *
 * ## Why `coveredWeeks` exists
 * A contribution grid asserts "nothing happened" for every un-shaded cell, so it may only
 * span days we have COMPLETE data for. Because rows arrive newest-first, fetching the
 * first N pages yields *every* visible event in `[oldestFetchedDay, today]` — that range
 * is exact, and anything older is simply unknown. So:
 *
 * - paging ran out of pages (`nextCursor === null`) → the whole window is known → 12 weeks;
 * - otherwise → clamp to whole weeks inside `[oldestFetchedDay, today]` (`floor(days / 7)`).
 *
 * A very busy user therefore gets a SHORTER but truthful grid rather than a full-width one
 * with fabricated blanks. Under a week of coverage returns `0` and the grid is not drawn.
 */
export const fetchPublicActivity = async (userId: string): Promise<PublicActivity> => {
    const today = vnTodayIso()
    const windowStart = shiftIso(today, -(GRID_WEEKS * 7 - 1))

    const events: Array<ActivityView> = []
    let cursor: string | undefined
    let exhausted = false
    for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await getActivityTimeline({ userId, cursor, limit: PAGE_SIZE })
        events.push(...(result.items ?? []))
        cursor = result.nextCursor
        if (!cursor) {
            exhausted = true
            break
        }
        // stop as soon as we've paged past the widest grid we would ever draw
        const oldest = events[events.length - 1]
        if (oldest && vnDayOf(oldest.occurredAt) < windowStart) {
            break
        }
    }

    const countByDay = new Map<string, number>()
    let oldestDay = today
    for (const event of events) {
        const day = vnDayOf(event.occurredAt)
        if (day < oldestDay) {
            oldestDay = day
        }
        if (day >= windowStart && day <= today) {
            countByDay.set(day, (countByDay.get(day) ?? 0) + 1)
        }
    }

    const coveredFrom = exhausted
        ? windowStart
        : oldestDay < windowStart
            ? windowStart
            : oldestDay
    const coveredWeeks = Math.min(
        GRID_WEEKS,
        Math.floor(daysBetween(coveredFrom, today) / 7),
    )

    return {
        timeline: events.slice(0, TIMELINE_ROWS).map((event) => ({
            id: event.eventId,
            kind: toActivityKind(event.type),
            type: event.type,
            time: event.occurredAt,
        })),
        days: [...countByDay].map(([date, count]) => ({ date, count })),
        coveredWeeks,
        isPartial: !exhausted,
    }
}

/**
 * Loads the activity behind a public profile's Activity tab.
 *
 * Auth-gated on purpose: `GET /activities` requires a signed-in caller holding
 * `activity.read`, so guests key to `null` (no request, `data === undefined`) and the tab
 * renders a sign-in notice instead of an empty grid that would falsely read as "this user
 * has done nothing".
 *
 * @param userId - BE user UUID of the profile being viewed (from `GET /profiles/{username}`).
 */
export const useQueryPublicActivitySwr = (userId: string | undefined) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useSWR(
        userId && authenticated ? ["public-profile-activity", userId] : null,
        () => fetchPublicActivity(userId as string),
    )
    return { activity: data, isLoading, error, mutate, authenticated }
}
