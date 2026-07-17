"use client"

import useSWR from "swr"
import {
    getLessonAssignments,
    type AssignmentView,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getLessonAssignments}. Gated on `lessonId` (the
 * `contentId` route param). Auth + lesson access required — a 401/403 surfaces as
 * the SWR error, so the caller can simply render nothing when there is no list.
 */
export const useGetLessonAssignmentsSwr = (lessonId: string) => {
    const swr = useSWR<Array<AssignmentView>, Error>(
        lessonId ? ["LESSON_ASSIGNMENTS_SWR", lessonId] : null,
        () => {
            if (!lessonId) {
                throw new Error("lessonId is required")
            }
            return getLessonAssignments(lessonId)
        },
    )

    return swr
}
