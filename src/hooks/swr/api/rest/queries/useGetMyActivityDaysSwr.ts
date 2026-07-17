"use client"

import useSWR from "swr"
import {
    getMyActivityDays,
    type ActivityDaysView,
} from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/** Shared SWR key prefix — the streak popover heatmap and the composed viewer
 * snapshot read ONE cache per `weeks` window. */
export const GET_MY_ACTIVITY_DAYS_SWR_KEY = "GET_MY_ACTIVITY_DAYS_SWR"

/**
 * SWR query for the current user's per-day XP window
 * ({@link getMyActivityDays}, `GET /api/v1/gamification/me/activity-days`),
 * used to shade the streak heatmap.
 *
 * Auth-gated: guests key to `null` (no request, `data === undefined`). The
 * `weeks` argument is part of the key so distinct windows cache independently.
 *
 * Polls on a 60s `refreshInterval`. The global {@link SwrProvider} disables
 * `revalidateOnFocus`/`revalidateOnReconnect`, so without an explicit interval
 * the heatmap would freeze at its first fetch once mounted persistently — today's
 * XP cell would never shade in as the user earns XP. Polling is the revalidation
 * path (XP accrues on a backend worker with no socket).
 *
 * @param weeks - Size of the activity window in weeks (default 12).
 */
export const useGetMyActivityDaysSwr = (weeks = 12) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<ActivityDaysView, Error>(
        authenticated ? [GET_MY_ACTIVITY_DAYS_SWR_KEY, weeks] : null,
        () => getMyActivityDays({ weeks }),
        { refreshInterval: 60_000 },
    )

    return swr
}
