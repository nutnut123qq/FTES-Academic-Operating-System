import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryWeeklyChallengeResponse } from "./types"

const query1 = gql`
  query WeeklyChallenge {
    weeklyChallenge {
      success
      message
      error
      data {
        challengeGlobalId
        title
        weekEndAt
        viewerPassed
        passedCount
        leaderboard {
          username
          avatar
          passedAt
        }
      }
    }
  }
`

export enum QueryWeeklyChallenge {
    Query1 = "query1",
}

const queryMap: Record<QueryWeeklyChallenge, DocumentNode> = {
    [QueryWeeklyChallenge.Query1]: query1,
}

/**
 * Fetches the currently featured weekly challenge event (or null). Mirrors
 * `weeklyChallenge` (queries/dashboard/weekly-challenge).
 */
export const queryWeeklyChallenge = async ({
    query = QueryWeeklyChallenge.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryWeeklyChallenge, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryWeeklyChallengeResponse>({
        query: queryMap[query],
    })
}
