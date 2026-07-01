import type { GraphQLResponse } from "../../types"

/**
 * A single interview question drawn for the voice-interview mode. A thin
 * projection of a flashcard card — the model `answer`/`explanation` is withheld
 * so opening devtools cannot reveal the expected answer (grading reloads it
 * server-side by card id). Mirrors backend `InterviewCardData`.
 */
export interface InterviewCardData {
    /** Card id — pass back to `gradeInterviewAnswer` as `flashcardCardId`. */
    id: string
    /** Deck the card was drawn from — pass back as `flashcardDeckId`. */
    deckId: string
    /** The question prompt to answer aloud (Markdown). */
    question: string
    /** Interview seniority level (junior/middle/senior/staff); null when unset. */
    level?: string | null
    /** Technology tags for the question (e.g. ["NestJS", "Redis"]). */
    tags?: Array<string>
}

/** Apollo response shape for the `drawInterviewCard` query. */
export interface QueryDrawInterviewCardResponse {
    /** Top-level `drawInterviewCard` field wrapping the standard API response. */
    drawInterviewCard: GraphQLResponse<InterviewCardData>
}
