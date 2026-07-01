import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserWeeklyStatsRequest, QueryUserWeeklyStatsResponse } from "./types"

const query1 = gql`
  query UserWeeklyStats($userId: ID!) {
    userWeeklyStats(userId: $userId) {
      success
      message
      error
      data {
        streak
        longestStreak
      }
    }
  }
`

export enum QueryUserWeeklyStats {
    Query1 = "query1",
}

const queryMap: Record<QueryUserWeeklyStats, DocumentNode> = {
    [QueryUserWeeklyStats.Query1]: query1,
}

/**
 * Fetches a user's streak (current + longest) by id.
 *
 * Mirrors `userWeeklyStats` (queries/users/user-weekly-stats); the stats are at
 * `data.userWeeklyStats.data`.
 */
export const queryUserWeeklyStats = async ({
    query = QueryUserWeeklyStats.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserWeeklyStats, QueryUserWeeklyStatsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserWeeklyStatsResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
