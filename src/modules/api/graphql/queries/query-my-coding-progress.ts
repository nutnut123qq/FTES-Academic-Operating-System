import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMyCodingProgressResponse,
} from "./types"

const query1 = gql`
  query MyCodingProgress {
    myCodingProgress {
      success
      message
      error
      data {
        solvedProblemIds
        attemptedProblemIds
        revealedProblemIds
        totalPoints
      }
    }
  }
`

export enum QueryMyCodingProgress {
    Query1 = "query1",
}

const queryMap: Record<QueryMyCodingProgress, DocumentNode> = {
    [QueryMyCodingProgress.Query1]: query1,
}

/**
 * Loads the user's coding-practice status (solved/attempted/revealed ids + total
 * points). Mirrors backend `myCodingProgress` (Redis-cached, decoupled from the
 * `codingProblems` catalog).
 */
export const queryMyCodingProgress = async ({
    query = QueryMyCodingProgress.Query1,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyCodingProgress, void>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryMyCodingProgressResponse>({
        query: queryMap[query],
    })
}
