"use client"

import useSWRMutation from "swr/mutation"
import {
    addFlashcardCards,
    createFlashcardDeck,
    deleteFlashcardDeck,
    reviewFlashcard,
} from "@/modules/api/rest/subject/subject"
import type {
    FlashcardCardInput,
    FlashcardCardView,
    FlashcardDeckView,
    ReviewFlashcardResultView,
} from "@/modules/api/rest/subject/types"

/** Argument of one card review. */
export interface FlashcardReviewArg {
    /** Subject code (uppercased route segment). */
    code: string
    cardId: string
    /** SM-2 self-grade 0..5 — `< 3` is a lapse (see `PRACTICE_SM2_GRADES`). */
    grade: number
}

/**
 * Records one review.
 *
 * SM-2 is computed and PERSISTED by the BE; the response carries the card's new state
 * (ease / interval / `dueAt`) and the deck's remaining due count, which is what the UI
 * renders — the client never schedules a card itself.
 */
export const reviewPracticeCard = async (
    arg: FlashcardReviewArg,
): Promise<ReviewFlashcardResultView> =>
    reviewFlashcard(arg.code, arg.cardId, { grade: arg.grade })

/** SWR-mutation wrapper for {@link reviewPracticeCard}. */
export const useMutateSubjectFlashcardReviewSwr = () =>
    useSWRMutation<ReviewFlashcardResultView, Error, string, FlashcardReviewArg>(
        "SUBJECT_FLASHCARD_REVIEW_SWR",
        async (_key, { arg }) => reviewPracticeCard(arg),
    )

// ------------------------------------------------------------------ curator writes

/** Argument of a deck creation (optionally with its cards in the same request). */
export interface CreateFlashcardDeckArg {
    code: string
    title: string
    description?: string
    cards?: Array<FlashcardCardInput>
}

/** SWR-mutation wrapper for `POST /subjects/{code}/practice/flashcards/decks`. */
export const useMutateCreateFlashcardDeckSwr = () =>
    useSWRMutation<FlashcardDeckView, Error, string, CreateFlashcardDeckArg>(
        "SUBJECT_FLASHCARD_DECK_CREATE_SWR",
        async (_key, { arg }) =>
            createFlashcardDeck(arg.code, {
                title: arg.title,
                description: arg.description,
                cards: arg.cards,
            }),
    )

/** Argument of an append-cards call. */
export interface AddFlashcardCardsArg {
    code: string
    deckId: string
    cards: Array<FlashcardCardInput>
}

/** SWR-mutation wrapper for `POST /…/flashcards/decks/{deckId}/cards`. */
export const useMutateAddFlashcardCardsSwr = () =>
    useSWRMutation<Array<FlashcardCardView>, Error, string, AddFlashcardCardsArg>(
        "SUBJECT_FLASHCARD_CARDS_ADD_SWR",
        async (_key, { arg }) => addFlashcardCards(arg.code, arg.deckId, { cards: arg.cards }),
    )

/** Argument of a deck deletion (cascades its cards and every learner's progress). */
export interface DeleteFlashcardDeckArg {
    code: string
    deckId: string
}

/**
 * SWR-mutation wrapper for `DELETE /…/flashcards/decks/{deckId}`.
 *
 * Resolves `true` rather than the endpoint's empty body, so a caller can tell a
 * successful delete from a failed one (the toast helper reports failures as `null`).
 */
export const useMutateDeleteFlashcardDeckSwr = () =>
    useSWRMutation<boolean, Error, string, DeleteFlashcardDeckArg>(
        "SUBJECT_FLASHCARD_DECK_DELETE_SWR",
        async (_key, { arg }) => {
            await deleteFlashcardDeck(arg.code, arg.deckId)
            return true
        },
    )
