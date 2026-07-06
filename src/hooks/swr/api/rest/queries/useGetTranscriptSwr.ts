"use client"

import useSWR from "swr"
import { getTranscript, type TranscriptRef } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link getTranscript}.
 */
export const useGetTranscriptSwr = (lessonId: string) => {
    const swr = useSWR<TranscriptRef, Error>(
        ["GET_TRANSCRIPT_SWR", lessonId],
        () => getTranscript(lessonId),
    )

    return swr
}
