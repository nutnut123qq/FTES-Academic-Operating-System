"use client"

import useSWR from "swr"
import {
    getMyCourseRating,
    type CourseRatingItem,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getMyCourseRating}. Gated on `courseId` AND
 * `enabled` (pass the viewer's authenticated flag) so anonymous viewers never
 * fire the auth-only endpoint. Resolves to `null` when the user hasn't rated.
 */
export const useGetMyCourseRatingSwr = (courseId: string, enabled: boolean) => {
    const swr = useSWR<CourseRatingItem | null, Error>(
        enabled && courseId ? ["GET_MY_COURSE_RATING_SWR", courseId] : null,
        () => {
            if (!courseId) {
                throw new Error("courseId is required")
            }
            return getMyCourseRating(courseId)
        },
    )

    return swr
}
