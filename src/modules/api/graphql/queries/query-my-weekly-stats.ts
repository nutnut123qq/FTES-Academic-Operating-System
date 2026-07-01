import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyWeeklyStatsResponse } from "./types"

const query1 = gql`
  query MyWeeklyStats {
    myWeeklyStats {
      success
      message
      error
      data {
        streak
        longestStreak
        xp
        lessons
        weeklyGoalLessons
        streakFreezes
        days {
          date
          active
        }
      }
    }
  }
`

export enum QueryMyWeeklyStats {
    Query1 = "query1",
}

const queryMap: Record<QueryMyWeeklyStats, DocumentNode> = {
    [QueryMyWeeklyStats.Query1]: query1,
}

/**
 * Fetches the viewer's rolling 7-day activity stats (streak / XP / lessons).
 *
 * Mirrors `myWeeklyStats` (queries/dashboard/my-weekly-stats).
 */
export const queryMyWeeklyStats = async ({
    query = QueryMyWeeklyStats.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyWeeklyStats, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyWeeklyStatsResponse>({
        query: queryMap[query],
    })
}
