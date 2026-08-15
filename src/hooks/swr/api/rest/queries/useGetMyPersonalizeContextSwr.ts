"use client"

import useSWR from "swr"
import {
    getMyPersonalizeContext,
    type RecommendationPersonalizeContext,
} from "@/modules/api/rest/recommendation"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's personalisation context. */
export const MY_PERSONALIZE_CONTEXT_SWR_KEY = "GET_MY_PERSONALIZE_CONTEXT_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyPersonalizeContextSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myPersonalizeContextKey = (
    viewerId: string | null,
    request?: { limit?: number },
) =>
    viewerId ? ([MY_PERSONALIZE_CONTEXT_SWR_KEY, viewerId, request] as const) : null

/**
 * SWR query wrapper for {@link getMyPersonalizeContext}.
 *
 * The key carries the VIEWER ID — the context is a behavioural profile built from the
 * caller's own activity, so a shared cache entry handed B a picture of A's interests.
 */
export const useGetMyPersonalizeContextSwr = (request?: {
    limit?: number
}) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<RecommendationPersonalizeContext, Error>(
        authenticated ? myPersonalizeContextKey(viewerId, request) : null,
        () => getMyPersonalizeContext(request),
    )

    return swr
}
