import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyCreditUsageResponse } from "./types"

const query1 = gql`
  query MyCreditUsage {
    myCreditUsage {
      success
      message
      error
      data {
        usedCredits
        quota
        remainingCredits
        overQuota
        resetAt
        window5h {
          usedCredits
          quota
          remainingCredits
          resetAt
        }
        windowWeek {
          usedCredits
          quota
          remainingCredits
          resetAt
        }
      }
    }
  }
`

export enum QueryMyCreditUsage {
    Query1 = "query1",
}

const queryMap: Record<QueryMyCreditUsage, DocumentNode> = {
    [QueryMyCreditUsage.Query1]: query1,
}

/**
 * Fetches the current user's AI credit usage snapshot
 * (used / quota / remaining / overQuota).
 *
 * Mirrors `myCreditUsage` (queries/ai/my-credit-usage/my-credit-usage.resolver.ts).
 */
export const queryMyCreditUsage = async ({
    query = QueryMyCreditUsage.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyCreditUsage, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyCreditUsageResponse>({
        query: queryMap[query],
    })
}
