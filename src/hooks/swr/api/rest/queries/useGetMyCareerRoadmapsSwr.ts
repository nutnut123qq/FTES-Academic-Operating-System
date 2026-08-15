"use client"

import useSWR from "swr"
import { getMyCareerRoadmaps, type CareerMyRoadmap } from "@/modules/api/rest/career"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's enrolled career roadmaps. */
export const MY_CAREER_ROADMAPS_SWR_KEY = "GET_MY_CAREER_ROADMAPS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCareerRoadmapsSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCareerRoadmapsKey = (viewerId: string | null) =>
    viewerId ? ([MY_CAREER_ROADMAPS_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyCareerRoadmaps}.
 *
 * The key carries the VIEWER ID — the roadmap list is per-account progress, not a public
 * catalogue, so a shared entry would show B the roadmaps (and completion) of A.
 */
export const useGetMyCareerRoadmapsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<CareerMyRoadmap[], Error>(
        authenticated ? myCareerRoadmapsKey(viewerId) : null,
        () => getMyCareerRoadmaps(),
    )

    return swr
}
