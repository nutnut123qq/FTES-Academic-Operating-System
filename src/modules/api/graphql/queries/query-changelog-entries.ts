import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryChangelogEntriesResponse } from "./types"

const query1 = gql`
  query ChangelogEntries {
    changelogEntries(limit: 4) {
      success
      message
      error
      data {
        id
        title
        body
        category
        publishedAt
        linkUrl
      }
    }
  }
`

export enum QueryChangelogEntries {
    Query1 = "query1",
}

const queryMap: Record<QueryChangelogEntries, DocumentNode> = {
    [QueryChangelogEntries.Query1]: query1,
}

/**
 * Fetches recent published changelog entries (newest first) for the right rail.
 *
 * Mirrors `changelogEntries` (queries/dashboard/changelog-entries).
 */
export const queryChangelogEntries = async ({
    query = QueryChangelogEntries.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryChangelogEntries, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryChangelogEntriesResponse>({
        query: queryMap[query],
    })
}
