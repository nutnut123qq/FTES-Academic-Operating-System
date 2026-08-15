"use client"

import useSWR from "swr"
import {
    getMyProgression,
    type ProgressionView,
} from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link myProgressionSwrKey}). */
const GET_MY_PROGRESSION_SWR_KEY = "GET_MY_PROGRESSION_SWR"

/**
 * The SWR key this hook subscribes to — the composed viewer snapshot (dropdown +
 * profile) and the level-up toast host read ONE cache.
 *
 * Exported as a BUILDER rather than a bare prefix so a call site cannot rebuild the
 * array by hand and silently drift from the hook: the viewer id is part of the key,
 * and a hand-written `["GET_MY_PROGRESSION_SWR"]` would match nothing.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 */
export const myProgressionSwrKey = (viewerId: string) => [GET_MY_PROGRESSION_SWR_KEY, viewerId]

/**
 * SWR query for the current user's XP/level progression snapshot
 * ({@link getMyProgression}, `GET /api/v1/gamification/me/progression`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired and
 * `data === undefined`.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}). "Somebody is signed
 * in" is not an identity: on the bare key, signing out of A and into B in the same tab
 * re-keys to the same cache entry and B reads A's XP/level straight from the cache —
 * which ALSO makes the diff-based level-up toast fire off A's numbers.
 *
 * Polls on a 60s `refreshInterval`. The global {@link SwrProvider} disables
 * `revalidateOnFocus`/`revalidateOnReconnect`, so without an explicit interval
 * this snapshot would freeze at its first fetch once mounted persistently in the
 * composed viewer snapshot — the "live" XP/level in the dropdown and profile
 * would go stale and the level-up celebration would never re-trigger. XP accrues
 * on a backend worker with no socket, so polling is the revalidation path (same
 * cadence as the quest board).
 */
export const useGetMyProgressionSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<ProgressionView, Error>(
        authenticated && viewerId ? myProgressionSwrKey(viewerId) : null,
        () => getMyProgression(),
        { refreshInterval: 60_000 },
    )

    return swr
}
