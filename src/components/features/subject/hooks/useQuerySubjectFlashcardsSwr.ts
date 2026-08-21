"use client"

import useSWR from "swr"

import { getSubjectFlashcards } from "@/modules/api/rest/subject"
import type { FlashcardDecksView } from "@/modules/api/rest/subject/types"

/**
 * The subject's flashcard decks (`GET /api/v1/subjects/{code}/practice/flashcards`).
 *
 * The paid decks arrive ALREADY TRIMMED for a viewer without a membership — the BE ships
 * `previewLimit` cards and sets `locked`, so there is nothing here to hide client-side and
 * nothing a reader could recover from the network tab. This hook only carries the answer
 * through; deciding what a locked deck looks like is the surface's job.
 */
export const useQuerySubjectFlashcardsSwr = (subjectCode: string | null | undefined) => {
    const { data, isLoading, error, mutate } = useSWR<FlashcardDecksView>(
        subjectCode ? ["subject-flashcards", subjectCode] : null,
        async () => getSubjectFlashcards(subjectCode as string),
    )

    return { view: data ?? null, isLoading, error, mutate }
}
