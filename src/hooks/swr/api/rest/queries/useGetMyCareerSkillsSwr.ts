"use client"

import useSWR from "swr"
import {
    getMyCareerSkills,
    type CareerSkillProgress,
} from "@/modules/api/rest/career"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's career skill progress. */
export const MY_CAREER_SKILLS_SWR_KEY = "GET_MY_CAREER_SKILLS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCareerSkillsSwr}. `null` disables
 * the fetch (guest, or the `me` query still in flight). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCareerSkillsKey = (viewerId: string | null) =>
    viewerId ? ([MY_CAREER_SKILLS_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyCareerSkills}.
 *
 * The key carries the VIEWER ID — skill levels are the caller's own assessment results,
 * which on the shared key leaked to the next account signed in inside the same tab.
 */
export const useGetMyCareerSkillsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<CareerSkillProgress[], Error>(
        authenticated ? myCareerSkillsKey(viewerId) : null,
        () => getMyCareerSkills(),
    )

    return swr
}
