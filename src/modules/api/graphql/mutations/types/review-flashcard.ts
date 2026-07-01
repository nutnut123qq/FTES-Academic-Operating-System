import type { GraphQLResponse } from "../../types"

/** Payload inside `reviewFlashcard.data` after the standard API wrapper. */
export interface ReviewFlashcardData {
    /** ISO timestamp the card is next due after applying the SM-2 grade. */
    dueAt: string
}

/** GraphQL `ReviewFlashcardRequest` body. */
export interface ReviewFlashcardRequest {
    /** Id of the card being graded. */
    cardId: string
    /** SM-2 grade: 0=Again, 1=Hard, 2=Good, 3=Easy. */
    grade: number
}

/** Apollo response shape for `reviewFlashcard`. */
export interface MutateReviewFlashcardResponse {
    /** Top-level `reviewFlashcard` field wrapping the standard API response. */
    reviewFlashcard: GraphQLResponse<ReviewFlashcardData>
}
