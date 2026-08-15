"use client"

import useSWR from "swr"
import {
    getMyMasteryForSubject,
    type MasteryView,
} from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's mastery on one subject. */
export const MY_MASTERY_FOR_SUBJECT_SWR_KEY = "GET_MY_MASTERY_FOR_SUBJECT_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyMasteryForSubjectSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myMasteryForSubjectKey = (
    viewerId: string | null,
    subjectId: string,
) =>
    viewerId && subjectId
        ? ([MY_MASTERY_FOR_SUBJECT_SWR_KEY, viewerId, subjectId] as const)
        : null

/**
 * SWR query wrapper for {@link getMyMasteryForSubject}.
 *
 * The key carries the VIEWER ID — `subjectId` names the subject, not the student, so on
 * the old key every account looking at the same subject shared one mastery entry.
 */
export const useGetMyMasteryForSubjectSwr = (subjectId: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<MasteryView, Error>(
        authenticated ? myMasteryForSubjectKey(viewerId, subjectId) : null,
        () => getMyMasteryForSubject(subjectId),
    )

    return swr
}
