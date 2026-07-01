import type { GraphQLResponse } from "../../types"

/** Per-grade next-interval preview (in days) for a due card's rating buttons. */
export interface QueryFlashcardNextIntervals {
    /** Days until next review if graded Again (0). */
    again: number
    /** Days until next review if graded Hard (1). */
    hard: number
    /** Days until next review if graded Good (2). */
    good: number
    /** Days until next review if graded Easy (3). */
    easy: number
}

/** One flashcard due for review today (SM-2 scheduler). */
export interface QueryMyDueFlashcardData {
    /** Opaque id of the card (passed to `reviewFlashcard`). */
    cardId: string
    /** Title of the deck the card belongs to (shown as context). */
    deckTitle: string
    /** Front (prompt) text shown first. */
    front: string
    /** Back (answer) text revealed after flipping. */
    back: string
    /** Per-grade next-interval preview (days), from the card's current SM-2 state. */
    nextIntervals: QueryFlashcardNextIntervals
}

/** The viewer's due-flashcards payload: a count plus the cards to review. */
export interface QueryMyDueFlashcardsData {
    /** Today's actionable queue = overdue reviews + capped new batch (NOT the whole backlog). */
    dueCount: number
    /** Overdue review cards (learned once, now past due). */
    dueReviewCount: number
    /** New cards offered today = min(newTotalCount, daily new limit). */
    newCount: number
    /** Total never-reviewed cards (full new backlog). */
    newTotalCount: number
    /** The cards to review (capped by the query `limit`). */
    cards: Array<QueryMyDueFlashcardData>
}

/** Apollo response shape for the `myDueFlashcards` query. */
export interface QueryMyDueFlashcardsResponse {
    /** Top-level `myDueFlashcards` field wrapping the standard API response. */
    myDueFlashcards: GraphQLResponse<QueryMyDueFlashcardsData>
}
