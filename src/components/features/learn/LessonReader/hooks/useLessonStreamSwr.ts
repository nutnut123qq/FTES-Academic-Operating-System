"use client"

import useSWR from "swr"
import { getLessonStreamUrl } from "@/modules/api/rest/course"

/**
 * Loads the signed stream manifest for a lesson, including the freemium preview
 * metadata (`mode`, `previewSeconds`, `cheapestPackage`).
 *
 * `GET /api/v1/courses/lessons/{lessonId}/stream`
 */
export const useLessonStreamSwr = (lessonId: string | undefined) => {
    const { data, isLoading, error, mutate } = useSWR(
        lessonId ? ["GET_LESSON_STREAM", lessonId] : null,
        async () => getLessonStreamUrl(lessonId as string),
    )

    return {
        stream: data,
        isLoading,
        error,
        mutate,
    }
}
