"use client"

import useSWR from "swr"
import {
    getMyCareerApplications,
    type CareerOpportunityApplication,
} from "@/modules/api/rest/career"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's job/opportunity applications. */
export const MY_CAREER_APPLICATIONS_SWR_KEY = "GET_MY_CAREER_APPLICATIONS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCareerApplicationsSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCareerApplicationsKey = (viewerId: string | null) =>
    viewerId ? ([MY_CAREER_APPLICATIONS_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyCareerApplications}.
 *
 * The key carries the VIEWER ID — where an account applied and how each application is
 * going is among the most sensitive things this app holds, and on the old global key it
 * was one cache entry shared by every user of the tab.
 */
export const useGetMyCareerApplicationsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<CareerOpportunityApplication[], Error>(
        authenticated ? myCareerApplicationsKey(viewerId) : null,
        () => getMyCareerApplications(),
    )

    return swr
}
