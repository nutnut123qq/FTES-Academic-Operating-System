"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { getSubjectFlashcards } from "@/modules/api/rest/subject/subject"
import type {
    FlashcardDecksView,
    FlashcardProgressView,
    ReviewFlashcardResultView,
} from "@/modules/api/rest/subject/types"

/**
 * A single practice flashcard, flattened out of the subject's decks together with the
 * CALLER's SM-2 progress (`GET /api/v1/subjects/{code}/practice/flashcards` returns
 * deck + cards + progress in one batched read).
 */
export interface PracticeFlashcard {
    id: string
    /** Front of the card (question side). */
    term: string
    /** Back of the card (answer side). */
    definition: string
    /** Deck title — rendered as the card's topic chip. */
    tag: string
    /** Owning deck id (the review response reports the deck's remaining due count). */
    deckId: string
    /** Server-side SM-2 state of this card for the signed-in learner. */
    progress: FlashcardProgressView
    /** Position inside its deck (BE ordering). */
    sortOrder: number
}

/** SWR cache key of one subject's flashcard payload. */
export const practiceFlashcardsKey = (code: string) =>
    ["subject-practice-flashcards", code] as const

/**
 * Flattens the deck payload into one review queue.
 *
 * Cards that are DUE (never reviewed, or `dueAt <= now` per the BE) come first so a
 * session always starts with what the learner actually owes; within each group the BE
 * deck order / `sortOrder` is preserved.
 */
export const flattenPracticeFlashcards = (
    view: FlashcardDecksView | undefined | null,
): Array<PracticeFlashcard> => {
    const cards: Array<PracticeFlashcard> = []
    for (const deck of view?.decks ?? []) {
        for (const card of deck.cards ?? []) {
            cards.push({
                id: card.id,
                term: card.front,
                definition: card.back,
                tag: deck.title,
                deckId: deck.id,
                progress: card.progress,
                sortOrder: card.sortOrder,
            })
        }
    }
    // stable partition: due first, original order kept inside each group
    return [
        ...cards.filter((card) => card.progress?.due === true),
        ...cards.filter((card) => card.progress?.due !== true),
    ]
}

/**
 * Writes ONE server review outcome back into the cached deck payload.
 *
 * The new `progress` (ease / interval / `dueAt` / `due`) is the SERVER's — SM-2 runs in
 * the BE and is persisted, so it survives a reload. The deck's `dueCount` is replaced
 * by the `deckDueCount` the same response carries, and the subject total is recomputed
 * from the decks, keeping the "N thẻ đến hạn" badge honest without a refetch.
 */
export const applyFlashcardReview = (
    view: FlashcardDecksView | undefined,
    result: ReviewFlashcardResultView,
): FlashcardDecksView | undefined => {
    if (!view) return view
    const decks = view.decks.map((deck) => {
        if (deck.id !== result.deckId) return deck
        return {
            ...deck,
            dueCount: result.deckDueCount,
            cards: deck.cards.map((card) =>
                card.id === result.cardId ? { ...card, progress: result.progress } : card,
            ),
        }
    })
    return {
        ...view,
        decks,
        dueCount: decks.reduce((total, deck) => total + (deck.dueCount ?? 0), 0),
    }
}

/**
 * Loads a subject's curated practice flashcards plus the caller's SM-2 progress.
 *
 * One authenticated read serves a whole session (deck + cards + progress + due
 * counters); `canManage` mirrors the BE curate check and gates the deck/card CRUD
 * affordances.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectPracticeFlashcardsSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? practiceFlashcardsKey(code) : null,
        async (): Promise<FlashcardDecksView> => getSubjectFlashcards(code),
    )

    const cards = useMemo(() => flattenPracticeFlashcards(data), [data])

    return {
        code,
        cards,
        decks: data?.decks ?? [],
        /** Cards due right now across every deck of the subject. */
        dueCount: data?.dueCount ?? 0,
        totalCards: data?.totalCards ?? 0,
        /** Caller may create/edit/delete decks and cards of this subject. */
        canManage: data?.canManage ?? false,
        isLoading,
        error,
        mutate,
    }
}
