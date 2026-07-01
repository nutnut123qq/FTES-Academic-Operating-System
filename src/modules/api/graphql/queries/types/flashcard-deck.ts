import type { GraphQLResponse } from "../../types"
import type { FlashcardDeckEntity } from "@/modules/types/entities/flashcard-deck"

/** Apollo response shape for the `flashcardDeck` query. */
export interface QueryFlashcardDeckResponse {
    /** Top-level `flashcardDeck` field wrapping the standard API response. */
    flashcardDeck: GraphQLResponse<FlashcardDeckEntity>
}
