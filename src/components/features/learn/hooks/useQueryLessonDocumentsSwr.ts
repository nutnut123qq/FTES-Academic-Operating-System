"use client"

import useSWR from "swr"
import { getLessonDocuments, type LessonDocumentView } from "@/modules/api/rest/course"

/**
 * Loads a lesson's document/slide attachments (`GET /lessons/{id}/documents`).
 *
 * Consumed by the {@link OnThisPage} right-rail "Tài liệu cho lesson này" panel, which
 * lists each attachment as a link the learner opens directly. The SWR key
 * `["lesson-documents", lessonId]` dedupes any other caller on the same lesson to one
 * request. The endpoint is auth-aware — for a viewer with no access it 403s; the caught
 * fallback yields an empty list so the panel self-hides.
 */
export const useQueryLessonDocumentsSwr = (lessonId: string | undefined) => {
    const { data, isLoading, error, mutate } = useSWR(
        lessonId ? ["lesson-documents", lessonId] : null,
        () => getLessonDocuments(lessonId as string).catch((): Array<LessonDocumentView> => []),
        { shouldRetryOnError: false },
    )

    return {
        /** The resolved attachments, or an empty list while loading / when there are none. */
        documents: data ?? [],
        isLoading,
        error,
        mutate,
    }
}
