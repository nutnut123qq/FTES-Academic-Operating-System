"use client"

import useSWR from "swr"
import { getMyStreak, type StreakView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link myStreakSwrKey}). */
const GET_MY_STREAK_SWR_KEY = "GET_MY_STREAK_SWR"

/**
 * The SWR key this hook subscribes to, for callers that need to `mutate()` it
 * (the streak popover revalidates it after a freeze is consumed).
 *
 * Exported as a BUILDER rather than a bare prefix so a call site cannot rebuild
 * the array by hand and silently drift from the hook: the viewer id is now part
 * of the key, and a hand-written `["GET_MY_STREAK_SWR"]` would match nothing —
 * the mutate would no-op and the UI would just quietly stop updating.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 */
export const myStreakSwrKey = (viewerId: string) => [GET_MY_STREAK_SWR_KEY, viewerId]

/**
 * SWR query wrapper for {@link getMyStreak} (`GET /api/v1/gamification/me/streak`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired (no 401
 * + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks the quest-board change wires into the streak chip / navbar.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}). "Somebody is signed
 * in" is not an identity: on the bare key, signing out of A and into B in the same tab
 * re-keys to the same cache entry and B reads A's streak straight from the cache
 * (stale-while-revalidate, and inside `dedupingInterval` without even re-fetching).
 */
export const useGetMyStreakSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<StreakView, Error>(
        authenticated && viewerId ? myStreakSwrKey(viewerId) : null,
        () => getMyStreak(),
    )

    return swr
}
