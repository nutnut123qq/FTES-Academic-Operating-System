"use client"

import useSWR from "swr"
import {
    getLessonComments,
    type LessonCommentsPage,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getLessonComments}. Gated on `contentId` (the
 * lessonId route param). Auth + FULL lesson access required.
 */
export const useGetLessonCommentsSwr = (contentId: string, page: number) => {
    const swr = useSWR<LessonCommentsPage, Error>(
        contentId ? ["LESSON_COMMENTS_SWR", contentId, page] : null,
        () => {
            if (!contentId) {
                throw new Error("contentId is required")
            }
            return getLessonComments(contentId, { page })
        },
    )

    return swr
}
