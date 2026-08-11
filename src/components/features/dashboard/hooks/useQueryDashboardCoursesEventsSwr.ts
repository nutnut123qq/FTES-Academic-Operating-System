"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { dayjs } from "@/modules/dayjs"
import {
    getEvents,
    getMyEventRegistrations,
    type EventRegistrationView,
} from "@/modules/api/rest/event"
import {
    toEventType,
    toLocationType,
    type EventLocationType,
    type EventType,
} from "@/components/features/event/hooks/useQueryEventsSwr"
import { useAppSelector } from "@/redux/hooks"

/** How many upcoming events the dashboard rail lists — the rest live on `/events`. */
export const UPCOMING_EVENT_LIMIT = 3

/**
 * Backend lifecycle statuses a viewer can still turn up to (ENDED/CANCELLED/DRAFT cannot).
 *
 * `ONGOING` is only meaningful together with the `endAt`-based time filter below: an
 * ONGOING event has by definition already started, so pairing this set with a
 * `startAt > now` test would make the entry dead code and silently drop an event that
 * began ten minutes ago and runs for another two hours.
 */
const UPCOMING_STATUSES: ReadonlySet<string> = new Set(["PUBLISHED", "ONGOING"])

/**
 * Registration statuses that still mean "I have a seat" — CANCELLED / NO_SHOW rows come
 * back from the same endpoint and must not be marked. `ATTENDED` belongs here: check-in
 * opens `checkinOpenBeforeMinutes` (default 60') BEFORE `startAt`, so a viewer who has
 * already scanned in for an event that has not started yet holds an `ATTENDED` row —
 * dropping it would un-mark the one person who is provably going.
 */
const ACTIVE_REGISTRATION_STATUSES: ReadonlySet<string> = new Set([
    "CONFIRMED",
    "WAITLISTED",
    "ATTENDED",
])

/** One upcoming event row of the dashboard COURSES tab. */
export interface DashboardUpcomingEvent {
    /** Event slug — the row key AND the `/events/{slug}` route segment. */
    slug: string
    /** Event title. */
    title: string
    /** Event kind, lowercased into the `eventSystem.types.*` label key. */
    type: EventType
    /** Location modality, or `null` when the backend left it blank (chip hidden). */
    locationType: EventLocationType | null
    /** `eventSystem.dayLabels.*` key when the event falls today/tomorrow, else `null`. */
    dayKey: "today" | "tomorrow" | null
    /** Start time `HH:mm` in the active locale — paired with {@link dayKey}. */
    timeLabel: string
    /** Full weekday + date + time label, used when {@link dayKey} is `null`. */
    dateLabel: string
    /** True when the viewer holds a live (CONFIRMED/WAITLISTED) registration for this event. */
    registered: boolean
}

/** Full weekday + date label in the active locale ("T6, 05/07 19:00"). */
const formatFullDate = (date: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)

/** Start time only, in the active locale — pairs with a "Hôm nay"/"Ngày mai" label. */
const formatTime = (date: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date)

/** The ids of events the viewer still holds a seat at (CANCELLED registrations dropped). */
const toRegisteredEventIds = (
    registrations: Array<EventRegistrationView>,
): ReadonlySet<string> =>
    new Set(
        registrations
            .filter((registration) =>
                ACTIVE_REGISTRATION_STATUSES.has((registration.status ?? "").toUpperCase()))
            .map((registration) => registration.eventId),
    )

/**
 * The viewer's next few events for the dashboard COURSES tab.
 *
 * `GET /api/v1/events` takes NO query parameters (no paging, no sort, no "upcoming"
 * filter), so the window is derived here: keep {@link UPCOMING_STATUSES} whose
 * `startAt` is still in the future, sort ascending, cut to {@link UPCOMING_EVENT_LIMIT}.
 *
 * "Đã đăng ký" cannot come from the list DTO — `myRegistrationStatus` is always null
 * there (only the by-slug detail endpoint resolves it) — so the flag is joined in the
 * client from `GET /api/v1/event/registrations/me` on `EventView.id === registration.eventId`.
 * That call is auth-only and its shared hook is NOT gated, so it is gated here instead
 * and a failure degrades to "no marks" rather than blanking the public event list.
 *
 * The locale is part of the SWR key because the date labels are formatted eagerly.
 */
export const useQueryDashboardCoursesEventsSwr = () => {
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useSWR(
        ["dashboard", "courses", "events", locale, authenticated],
        async (): Promise<Array<DashboardUpcomingEvent>> => {
            const [views, registrations] = await Promise.all([
                getEvents(),
                authenticated
                    // a failed/expired session must not blank the (public) event list —
                    // the rows still render, just without the "đã đăng ký" mark.
                    ? getMyEventRegistrations().catch(() => [] as Array<EventRegistrationView>)
                    : Promise.resolve([] as Array<EventRegistrationView>),
            ])
            const registeredIds = toRegisteredEventIds(registrations)
            const now = Date.now()
            const today = dayjs()
            return (views ?? [])
                .filter((view) => {
                    if (!UPCOMING_STATUSES.has((view.status ?? "").toUpperCase())) {
                        return false
                    }
                    // "still attendable" = has not ENDED yet, so an in-progress event stays
                    // listed. Fall back to startAt when endAt is missing (then the row drops
                    // the moment it starts — the honest read of a single known timestamp).
                    // NaN (missing/broken on both) compares false → the row drops, as intended.
                    const endsAt = new Date(view.endAt || view.startAt).getTime()
                    return endsAt > now
                })
                .sort(
                    (left, right) =>
                        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
                )
                .slice(0, UPCOMING_EVENT_LIMIT)
                .map((view): DashboardUpcomingEvent => {
                    const start = dayjs(view.startAt)
                    const startDate = start.toDate()
                    return {
                        slug: view.slug,
                        title: view.title,
                        type: toEventType(view.type),
                        locationType: toLocationType(view.locationType),
                        dayKey: start.isSame(today, "day")
                            ? "today"
                            : start.isSame(today.add(1, "day"), "day")
                                ? "tomorrow"
                                : null,
                        timeLabel: formatTime(startDate, locale),
                        dateLabel: formatFullDate(startDate, locale),
                        registered: registeredIds.has(view.id),
                    }
                })
        },
    )

    return {
        events: data ?? [],
        isLoading,
        error,
        mutate,
    }
}
