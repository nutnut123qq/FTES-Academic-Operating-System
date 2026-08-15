"use client"

import useSWR from "swr"
import { getMyAiQuota } from "@/modules/api/rest/ai"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's remaining AI quota per feature. */
export const MY_AI_QUOTA_SWR_KEY = "GET_MY_AI_QUOTA_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyAiQuotaSwr}. `null` disables the
 * fetch (guest, or the `me` query still in flight). Import this from a call site that
 * needs to `mutate` the entry — never hand-write the tuple.
 */
export const myAiQuotaKey = (viewerId: string | null) =>
    viewerId ? ([MY_AI_QUOTA_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyAiQuota}.
 *
 * The key carries the VIEWER ID — quota counters are per-account, so on the shared key B
 * was shown A's remaining balance and the UI would enable (or grey out) AI actions on
 * the strength of somebody else's usage.
 */
export const useGetMyAiQuotaSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Record<string, number>, Error>(
        authenticated ? myAiQuotaKey(viewerId) : null,
        () => getMyAiQuota(),
    )

    return swr
}
