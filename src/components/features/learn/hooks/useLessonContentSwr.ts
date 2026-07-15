"use client"

import useSWR from "swr"
import { readLessonContent, type LessonContentView } from "@/modules/api/rest/course"

/**
 * Loads a single lesson's document content from `GET /api/v1/lessons/{id}/content`.
 *
 * Returns the markdown body, reading time, per-viewer lock flag, and teaser metadata
 * (including the cheapest unlock package). The endpoint is auth-aware: locked lessons
 * return a server-truncated teaser and `locked === true`.
 */
export const useLessonContentSwr = (lessonId: string | undefined) => {
    const { data, isLoading, error, mutate } = useSWR<LessonContentView>(
        lessonId ? ["GET_LESSON_CONTENT", lessonId] : null,
        () => readLessonContent(lessonId as string),
        { shouldRetryOnError: false },
    )

    return {
        content: data,
        isLoading,
        error,
        mutate,
    }
}
