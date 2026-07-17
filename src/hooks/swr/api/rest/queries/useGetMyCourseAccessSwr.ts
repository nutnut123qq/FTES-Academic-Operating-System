"use client"

import useSWR from "swr"
import {
    getMyCourseAccess,
    type CourseAccessStateView,
} from "@/modules/api/rest/course"

/** SWR cache key prefix for the caller's course access state. */
export const COURSE_ACCESS_SWR_KEY = "COURSE_ACCESS_SWR"

/**
 * Builds the SWR key tuple for a course's access state, keyed on the course UUID
 * (`course.rawId`). `null` disables the fetch — pass `undefined` until the detail
 * has loaded, or when the caller has no token / already knows the flag.
 */
export const courseAccessKey = (courseRawId: string | undefined) =>
    courseRawId ? ([COURSE_ACCESS_SWR_KEY, courseRawId] as const) : null

/**
 * SWR query wrapper for {@link getMyCourseAccess}. Reads `{enrolled, purchased,
 * fullAccess}` for the caller on a course. Gated on `courseRawId` (the course
 * UUID); a 401/404 degrades to `null` rather than throwing, so callers using it
 * as a purchase-flag fallback simply keep the flag false. `shouldRetryOnError:
 * false` avoids retrying an auth/not-found error.
 */
export const useGetMyCourseAccessSwr = (courseRawId: string | undefined) => {
    return useSWR<CourseAccessStateView | null, Error>(
        courseAccessKey(courseRawId),
        () => getMyCourseAccess(courseRawId as string).catch(() => null),
        { shouldRetryOnError: false },
    )
}
