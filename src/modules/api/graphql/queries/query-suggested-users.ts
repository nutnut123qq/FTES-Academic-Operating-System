import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QuerySuggestedUsersResponse } from "./types"

const query1 = gql`
  query SuggestedUsers {
    suggestedUsers {
      success
      message
      error
      data {
        globalId
        username
        displayName
        avatar
        openToWork
      }
    }
  }
`

export enum QuerySuggestedUsers {
    Query1 = "query1",
}

const queryMap: Record<QuerySuggestedUsers, DocumentNode> = {
    [QuerySuggestedUsers.Query1]: query1,
}

/**
 * Fetches users suggested to the viewer for following ("who to follow"). Mirrors
 * `suggestedUsers` (queries/dashboard/suggested-users); the backend caps the list
 * via its `limit` default.
 */
export const querySuggestedUsers = async ({
    query = QuerySuggestedUsers.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QuerySuggestedUsers, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QuerySuggestedUsersResponse>({
        query: queryMap[query],
    })
}
