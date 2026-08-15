"use client"

import useSWR from "swr"
import { getMyMastery, type MasteryView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's per-subject mastery levels. */
export const MY_MASTERY_SWR_KEY = "GET_MY_MASTERY_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyMasterySwr}. `null` disables the
 * fetch (guest, or the `me` query still in flight). Import this from a call site that
 * needs to `mutate` the entry — never hand-write the tuple.
 */
export const myMasteryKey = (viewerId: string | null) =>
    viewerId ? ([MY_MASTERY_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyMastery}.
 *
 * The key carries the VIEWER ID — mastery is the caller's own progress, so the global
 * key made A's levels the first thing B saw after a same-tab account switch.
 */
export const useGetMyMasterySwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Array<MasteryView>, Error>(
        authenticated ? myMasteryKey(viewerId) : null,
        () => getMyMastery(),
    )

    return swr
}
