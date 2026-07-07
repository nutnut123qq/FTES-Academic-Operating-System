"use client"

import useSWR from "swr"

/** A single practice flashcard (front term / back definition + topic tag). */
export interface PracticeFlashcard {
    id: string
    term: string
    definition: string
    tag: string
}

/**
 * Loads a subject's practice flashcard deck.
 *
 * The BE subject module exposes no curated per-subject practice deck (distinct from
 * AI-generated decks). Rather than fabricate cards, the hook returns empty and the
 * reviewer renders its empty state; the shape is unchanged for a later drop-in.
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useQuerySubjectPracticeFlashcardsSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-practice-flashcards", subjectId],
        async (): Promise<Array<PracticeFlashcard>> => [],
    )
    return { cards: data ?? [], isLoading, error, mutate }
}
