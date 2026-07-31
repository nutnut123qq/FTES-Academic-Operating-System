"use client"

import useSWR from "swr"
import { getLessonDocuments, type LessonDocumentView } from "@/modules/api/rest/course"

/**
 * Loads a lesson's document/slide attachments (`GET /lessons/{id}/documents`).
 *
 * Shared by {@link LessonDocumentsBlock} (renders the attachment list inline) and the
 * {@link LessonReader} top bar (gates the "Tài liệu buổi học" button on a non-empty list).
 * Both call this hook with the SAME SWR key `["lesson-documents", lessonId]`, so the fetch
 * dedupes to a single request per lesson (no double-fetch). The endpoint is auth-aware —
 * for a viewer with no access it 403s; the caught fallback yields an empty list so the
 * block self-hides and the reader button stays hidden.
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
