import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryTrendingContentsResponse } from "./types"

const query1 = gql`
  query TrendingContents {
    trendingContents {
      success
      message
      error
      data {
        globalId
        title
        readCount
      }
    }
  }
`

export enum QueryTrendingContents {
    Query1 = "query1",
}

const queryMap: Record<QueryTrendingContents, DocumentNode> = {
    [QueryTrendingContents.Query1]: query1,
}

/**
 * Fetches the lessons read most across the platform in the last 7 days.
 * Mirrors `trendingContents` (queries/dashboard/trending-contents).
 */
export const queryTrendingContents = async ({
    query = QueryTrendingContents.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryTrendingContents, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryTrendingContentsResponse>({
        query: queryMap[query],
    })
}
