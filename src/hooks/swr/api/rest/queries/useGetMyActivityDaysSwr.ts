"use client"

import useSWR from "swr"
import {
    getMyActivityDays,
    type ActivityDaysView,
} from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link myActivityDaysSwrKey}). */
const GET_MY_ACTIVITY_DAYS_SWR_KEY = "GET_MY_ACTIVITY_DAYS_SWR"

/**
 * The SWR key this hook subscribes to for one `weeks` window — the streak popover
 * heatmap and the composed viewer snapshot read ONE cache per (viewer, window).
 *
 * Exported as a BUILDER rather than a bare prefix so a call site cannot rebuild the
 * array by hand and silently drift from the hook: the viewer id is now part of the
 * key, and a hand-written `["GET_MY_ACTIVITY_DAYS_SWR", 12]` would match nothing —
 * the mutate would no-op and the heatmap would quietly stop refreshing.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 * @param weeks - size of the activity window in weeks.
 */
export const myActivityDaysSwrKey = (viewerId: string, weeks: number) =>
    [GET_MY_ACTIVITY_DAYS_SWR_KEY, viewerId, weeks]

/**
 * SWR query for the current user's per-day XP window
 * ({@link getMyActivityDays}, `GET /api/v1/gamification/me/activity-days`),
 * used to shade the streak heatmap.
 *
 * Auth-gated: guests key to `null` (no request, `data === undefined`). The
 * `weeks` argument is part of the key so distinct windows cache independently.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}). "Somebody is signed
 * in" is not an identity: on the bare key, signing out of A and into B in the same tab
 * re-keys to the same cache entry and B reads A's activity heatmap straight from the
 * cache (stale-while-revalidate, and inside `dedupingInterval` without re-fetching).
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
    const viewerId = useViewerScopeId()
    const swr = useSWR<ActivityDaysView, Error>(
        authenticated && viewerId ? myActivityDaysSwrKey(viewerId, weeks) : null,
        () => getMyActivityDays({ weeks }),
        { refreshInterval: 60_000 },
    )

    return swr
}
