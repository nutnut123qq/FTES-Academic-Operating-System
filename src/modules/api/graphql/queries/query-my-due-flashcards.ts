import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyDueFlashcardsResponse } from "./types"

const query1 = gql`
  query MyDueFlashcards($courseId: String, $limit: Int) {
    myDueFlashcards(courseId: $courseId, limit: $limit) {
      success
      message
      error
      data {
        dueCount
        dueReviewCount
        newCount
        newTotalCount
        cards {
          cardId
          deckTitle
          front
          back
          nextIntervals {
            again
            hard
            good
            easy
          }
        }
      }
    }
  }
`

export enum QueryMyDueFlashcards {
    Query1 = "query1",
}

const queryMap: Record<QueryMyDueFlashcards, DocumentNode> = {
    [QueryMyDueFlashcards.Query1]: query1,
}

/** Variables for {@link queryMyDueFlashcards}. */
export interface QueryMyDueFlashcardsRequest {
    /** Scope the due queue to one course's decks; omit for a global (cross-course) queue. */
    courseId?: string
    /** Maximum number of cards to fetch (backend default 20). */
    limit?: number
}

/**
 * Fetches the flashcards due for review today (SM-2 scheduler) plus the total
 * due count. Mirrors `myDueFlashcards` (queries/flashcards/my-due-flashcards).
 */
export const queryMyDueFlashcards = async ({
    query = QueryMyDueFlashcards.Query1,
    request,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyDueFlashcards, QueryMyDueFlashcardsRequest>, "request"> & {
    request?: QueryMyDueFlashcardsRequest
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyDueFlashcardsResponse>({
        query: queryMap[query],
        variables: {
            courseId: request?.courseId,
            limit: request?.limit,
        },
    })
}
