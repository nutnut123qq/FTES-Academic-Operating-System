import type { GraphQLResponse } from "../../types"
import type { FlashcardDeckEntity } from "@/modules/types/entities/flashcard-deck"

/** Apollo response shape for the `flashcardDecksByCourse` query. */
export interface QueryFlashcardDecksByCourseResponse {
    /** Top-level `flashcardDecksByCourse` field wrapping the standard API response. */
    flashcardDecksByCourse: GraphQLResponse<Array<FlashcardDeckEntity>>
}
