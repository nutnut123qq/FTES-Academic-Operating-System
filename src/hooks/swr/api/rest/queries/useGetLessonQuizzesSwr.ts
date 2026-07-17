"use client"

import useSWR from "swr"
import {
    getLessonQuizzes,
    type QuizSummaryView,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getLessonQuizzes}. Gated on `lessonId` (the route
 * `contentId`). FULL lesson access is required — a viewer without it gets a 403
 * `COURSE_ACCESS_DENIED` surfaced as the SWR error, so the caller can render an
 * enroll CTA instead of the quiz list. `shouldRetryOnError: false` keeps that 403
 * from being retried in a loop.
 */
export const useGetLessonQuizzesSwr = (lessonId: string) => {
    const swr = useSWR<Array<QuizSummaryView>, Error>(
        lessonId ? ["LESSON_QUIZZES_SWR", lessonId] : null,
        () => {
            if (!lessonId) {
                throw new Error("lessonId is required")
            }
            return getLessonQuizzes(lessonId)
        },
        { shouldRetryOnError: false },
    )

    return swr
}
