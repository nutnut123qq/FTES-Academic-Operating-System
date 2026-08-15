"use client"

import useSWR from "swr"
import { getTeachingCourses } from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import type { CourseSummary } from "@/modules/api/rest/course/types"

/**
 * The signed-in instructor's OWNED courses (every status), newest-updated first —
 * the data source for the "Khoá tôi dạy" page. Reuses `GET /courses/teaching`.
 * Gated on the REACTIVE session flag `state.keycloak.authenticated` (mirrors
 * {@link useQueryMyCoursesSwr}) so signed-out viewers get an empty list — the SWR
 * key is null, the fetch never runs, `isLoading` stays false and the page falls
 * through to the empty branch (no 401 spam).
 *
 * The gate MUST come from redux, not from a `localStorage` read taken during render:
 * local storage is not reactive, so a sign-in with no page load never re-rendered this
 * hook and the page stayed empty until F5.
 */
export const useQueryTeachingCoursesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR<Array<CourseSummary>>(
        authenticated && viewerId ? ["course-teaching", viewerId] : null,
        () => getTeachingCourses({ page: 0, size: 100 }),
    )
    return {
        courses: data ?? [],
        hasCourses: (data ?? []).length > 0,
        isLoading: authenticated && isLoading,
        error,
        mutate,
    }
}
