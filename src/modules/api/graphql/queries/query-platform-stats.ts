import { createNoAuthApolloClient } from "../clients/clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryPlatformStatsResponse } from "./types"

const query1 = gql`
  query PlatformStats {
    platformStats {
      success
      message
      error
      data {
        totalLearners
        totalLessons
        totalCourses
        totalBadgesEarned
      }
    }
  }
`

export enum QueryPlatformStats {
    Query1 = "query1",
}

const queryMap: Record<QueryPlatformStats, DocumentNode> = {
    [QueryPlatformStats.Query1]: query1,
}

/**
 * Fetches public platform-wide counters (no auth) for the landing page.
 */
export const queryPlatformStats = async ({
    query = QueryPlatformStats.Query1,
    debug,
    signal,
}: QueryParams<QueryPlatformStats, undefined>) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryPlatformStatsResponse>({
        query: queryMap[query],
    })
}
