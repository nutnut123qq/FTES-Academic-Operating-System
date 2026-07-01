import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryDrawInterviewCardResponse } from "./types"

const query1 = gql`
  query DrawInterviewCard($courseId: ID, $flashcardDeckId: ID, $level: FlashcardLevel) {
    drawInterviewCard(courseId: $courseId, flashcardDeckId: $flashcardDeckId, level: $level) {
      success
      message
      error
      data {
        id
        deckId
        question
        level
        tags
      }
    }
  }
`

export enum QueryDrawInterviewCard {
    Query1 = "query1",
}

const queryMap: Record<QueryDrawInterviewCard, DocumentNode> = {
    [QueryDrawInterviewCard.Query1]: query1,
}

/** Request body for the draw-interview-card query. */
export interface DrawInterviewCardRequest {
    /** Course to draw a random question across all its decks (random interview mode). */
    courseId?: string | null
    /** Optional deck to restrict the draw to (legacy per-topic mode). */
    flashcardDeckId?: string | null
    /** Optional seniority level to restrict the draw to (junior/middle/senior/staff). */
    level?: string | null
}

/**
 * Draws one random gradable interview question from a deck. The model answer is
 * withheld — the candidate answers aloud, the client transcribes the speech and
 * submits the transcript to `gradeInterviewAnswer`, which reloads the answer
 * server-side. Each call is a fresh random draw (do not cache the result).
 *
 * Mirrors backend `queries/flashcard-decks/draw-interview-card`.
 */
export const queryDrawInterviewCard = async ({
    query = QueryDrawInterviewCard.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryDrawInterviewCard, DrawInterviewCardRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryDrawInterviewCardResponse>({
        query: queryMap[query],
        variables: {
            courseId: request?.courseId ?? null,
            flashcardDeckId: request?.flashcardDeckId ?? null,
            level: request?.level ?? null,
        },
    })
}
