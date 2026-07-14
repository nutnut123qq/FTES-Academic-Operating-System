"use client"

import useSWR from "swr"
import { getTeachingCourses } from "@/modules/api/rest/course"
import type { CourseSummary } from "@/modules/api/rest/course/types"

/**
 * The signed-in instructor's OWNED courses (every status), newest-updated first —
 * the data source for the "Khoá tôi dạy" page. Reuses `GET /courses/teaching`.
 * Gated on a stored access token (mirrors {@link useQueryMyCoursesSwr}) so anonymous
 * viewers get an empty list — the SWR key is null, the fetch never runs, `isLoading`
 * stays false and the page falls through to the empty branch (no 401 spam).
 */
export const useQueryTeachingCoursesSwr = () => {
    const hasToken =
        typeof window !== "undefined" &&
        !!window.localStorage.getItem("keycloak:access_token")
    const { data, isLoading, error, mutate } = useSWR<Array<CourseSummary>>(
        hasToken ? ["course-teaching"] : null,
        () => getTeachingCourses({ page: 0, size: 100 }),
    )
    return {
        courses: data ?? [],
        hasCourses: (data ?? []).length > 0,
        isLoading: hasToken && isLoading,
        error,
        mutate,
    }
}
