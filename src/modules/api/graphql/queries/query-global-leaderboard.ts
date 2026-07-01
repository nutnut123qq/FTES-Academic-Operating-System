import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryGlobalLeaderboardResponse } from "./types"

const query1 = gql`
  query GlobalLeaderboard {
    globalLeaderboard {
      success
      message
      error
      data {
        myRank
        myPoints
        entries {
          userGlobalId
          username
          avatar
          points
          rank
        }
      }
    }
  }
`

export enum QueryGlobalLeaderboard {
    Query1 = "query1",
}

const queryMap: Record<QueryGlobalLeaderboard, DocumentNode> = {
    [QueryGlobalLeaderboard.Query1]: query1,
}

/**
 * Fetches the global (all-users) points leaderboard — top users + the viewer's
 * own standing. Mirrors `globalLeaderboard` (queries/league/global-leaderboard).
 */
export const queryGlobalLeaderboard = async ({
    query = QueryGlobalLeaderboard.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryGlobalLeaderboard, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryGlobalLeaderboardResponse>({
        query: queryMap[query],
    })
}
