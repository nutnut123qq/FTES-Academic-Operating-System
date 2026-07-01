import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CodingLeaderboardRequest,
    QueryCodingLeaderboardResponse,
} from "./types"

const query1 = gql`
  query CodingLeaderboard($request: CodingLeaderboardRequest!) {
    codingLeaderboard(request: $request) {
      success
      message
      error
      data {
        userId
        username
        solvedCount
      }
    }
  }
`

export enum QueryCodingLeaderboard {
    Query1 = "query1",
}

const queryMap: Record<QueryCodingLeaderboard, DocumentNode> = {
    [QueryCodingLeaderboard.Query1]: query1,
}

/**
 * Ranks users by distinct solved problems.
 * Mirrors backend `codingLeaderboard` (queries/coding/coding-leaderboard).
 */
export const queryCodingLeaderboard = async ({
    query = QueryCodingLeaderboard.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCodingLeaderboard, CodingLeaderboardRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryCodingLeaderboardResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
