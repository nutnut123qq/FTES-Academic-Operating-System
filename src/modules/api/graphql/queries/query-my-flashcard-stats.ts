import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyFlashcardStatsResponse } from "./types"

const query1 = gql`
  query MyFlashcardStats {
    myFlashcardStats {
      success
      message
      error
      data {
        currentStreak
        longestStreak
        retentionRate
        totalReviewed
        lastReviewedAt
      }
    }
  }
`

export enum QueryMyFlashcardStats {
    Query1 = "query1",
}

const queryMap: Record<QueryMyFlashcardStats, DocumentNode> = {
    [QueryMyFlashcardStats.Query1]: query1,
}

/**
 * Fetches the viewer's flashcard study stats (review streak, retention rate,
 * total reviewed). Mirrors `myFlashcardStats` (queries/flashcards/my-flashcard-stats).
 */
export const queryMyFlashcardStats = async ({
    query = QueryMyFlashcardStats.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyFlashcardStats, undefined>, "request">) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyFlashcardStatsResponse>({
        query: queryMap[query],
    })
}
