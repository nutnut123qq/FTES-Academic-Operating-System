import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyCreditUsageHistoryResponse } from "./types"

const query1 = gql`
  query MyCreditUsageHistory($limit: Int, $offset: Int) {
    myCreditUsageHistory(limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        total
        items {
          id
          mode
          recommendation
          model
          provider
          credits
          createdAt
        }
      }
    }
  }
`

export enum QueryMyCreditUsageHistory {
    Query1 = "query1",
}

const queryMap: Record<QueryMyCreditUsageHistory, DocumentNode> = {
    [QueryMyCreditUsageHistory.Query1]: query1,
}

/** Pagination params for {@link queryMyCreditUsageHistory}. */
export interface QueryMyCreditUsageHistoryRequest {
    /** Page size (defaults to backend's 50, capped at 200). */
    limit?: number
    /** Rows to skip. */
    offset?: number
}

/**
 * Fetches the current user's paginated AI credit charge history (newest first).
 *
 * Mirrors `myCreditUsageHistory`
 * (queries/ai/my-credit-usage-history/my-credit-usage-history.resolver.ts).
 */
export const queryMyCreditUsageHistory = async ({
    query = QueryMyCreditUsageHistory.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyCreditUsageHistory, QueryMyCreditUsageHistoryRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyCreditUsageHistoryResponse>({
        query: queryMap[query],
        variables: {
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
