"use client"

import useSWR from "swr"
import {
    getMyCourseRating,
    type CourseRatingItem,
} from "@/modules/api/rest/course"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's own rating on a course. */
export const MY_COURSE_RATING_SWR_KEY = "GET_MY_COURSE_RATING_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCourseRatingSwr}. `null` disables
 * the fetch (guest / unresolved viewer, or no course id). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCourseRatingKey = (viewerId: string | null, courseId: string) =>
    viewerId && courseId
        ? ([MY_COURSE_RATING_SWR_KEY, viewerId, courseId] as const)
        : null

/**
 * SWR query wrapper for {@link getMyCourseRating}. Gated on `courseId` AND
 * `enabled` (pass the viewer's authenticated flag) so anonymous viewers never
 * fire the auth-only endpoint. Resolves to `null` when the user hasn't rated.
 *
 * The key also carries the VIEWER ID: `courseId` names the course and `enabled` only
 * says somebody is signed in, so the old key made "my rating on this course" a single
 * shared entry — after a same-tab account switch B's rating form was pre-filled with A's
 * stars and review text, and submitting it would overwrite B's own rating with A's words.
 */
export const useGetMyCourseRatingSwr = (courseId: string, enabled: boolean) => {
    const viewerId = useViewerScopeId()
    const swr = useSWR<CourseRatingItem | null, Error>(
        enabled ? myCourseRatingKey(viewerId, courseId) : null,
        () => {
            if (!courseId) {
                throw new Error("courseId is required")
            }
            return getMyCourseRating(courseId)
        },
    )

    return swr
}
