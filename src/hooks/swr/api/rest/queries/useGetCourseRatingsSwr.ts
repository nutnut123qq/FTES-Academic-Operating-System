"use client"

import useSWR from "swr"
import {
    getCourseRatings,
    type CourseRatingSummary,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getCourseRatings}. Gated on `courseId` (the course
 * UUID / `course.rawId`). Public — no auth required.
 */
export const useGetCourseRatingsSwr = (
    courseId: string,
    params?: { page?: number; size?: number },
) => {
    const swr = useSWR<CourseRatingSummary, Error>(
        courseId
            ? ["GET_COURSE_RATINGS_SWR", courseId, params?.page, params?.size]
            : null,
        () => {
            if (!courseId) {
                throw new Error("courseId is required")
            }
            return getCourseRatings(courseId, params)
        },
    )

    return swr
}
