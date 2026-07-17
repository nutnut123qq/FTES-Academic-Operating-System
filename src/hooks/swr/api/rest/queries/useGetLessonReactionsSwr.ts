"use client"

import useSWR from "swr"
import {
    getLessonReactions,
    type LessonReactionSummaryView,
} from "@/modules/api/rest/course"

/** SWR cache key prefix for the lesson reaction summary (shared with the mutation rollback). */
export const LESSON_REACTIONS_SWR_KEY = "LESSON_REACTIONS_SWR"

/** Builds the SWR key tuple for a lesson's reaction summary (null disables the fetch). */
export const lessonReactionsKey = (lessonId: string | undefined) =>
    lessonId ? ([LESSON_REACTIONS_SWR_KEY, lessonId] as const) : null

/**
 * SWR query wrapper for {@link getLessonReactions}. Reads `{viewCount, likeCount, myReaction}`
 * for a lesson. Gated on `lessonId`; requires at least PREVIEW access — a viewer without it
 * gets a 403 `COURSE_ACCESS_DENIED` surfaced as the SWR error (the footer then degrades to
 * hiding its counts instead of throwing). `shouldRetryOnError: false` avoids retrying that 403.
 */
export const useGetLessonReactionsSwr = (lessonId: string) => {
    const swr = useSWR<LessonReactionSummaryView, Error>(
        lessonReactionsKey(lessonId),
        () => getLessonReactions(lessonId),
        { shouldRetryOnError: false },
    )

    return swr
}
