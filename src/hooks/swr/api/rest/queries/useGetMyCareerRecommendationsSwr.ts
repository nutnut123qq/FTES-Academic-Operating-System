"use client"

import useSWR from "swr"
import {
    getMyCareerRecommendations,
    type CareerRecommendation,
} from "@/modules/api/rest/career"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's personalised career recommendations. */
export const MY_CAREER_RECOMMENDATIONS_SWR_KEY = "GET_MY_CAREER_RECOMMENDATIONS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCareerRecommendationsSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCareerRecommendationsKey = (
    viewerId: string | null,
    params?: { kind?: string },
) =>
    viewerId
        ? ([MY_CAREER_RECOMMENDATIONS_SWR_KEY, viewerId, params?.kind] as const)
        : null

/**
 * SWR query wrapper for {@link getMyCareerRecommendations}.
 *
 * The key carries the VIEWER ID — `kind` selects a recommendation flavour, not a person,
 * so the answer (which is derived from the caller's own skills and history) was cached
 * once for everybody.
 */
export const useGetMyCareerRecommendationsSwr = (params?: { kind?: string }) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<CareerRecommendation[], Error>(
        authenticated ? myCareerRecommendationsKey(viewerId, params) : null,
        () => getMyCareerRecommendations(params),
    )

    return swr
}
