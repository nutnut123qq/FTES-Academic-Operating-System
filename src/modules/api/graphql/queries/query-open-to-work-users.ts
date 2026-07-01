import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryOpenToWorkUsersRequest, QueryOpenToWorkUsersResponse } from "./types"

const query1 = gql`
  query OpenToWorkUsers($limit: Int, $offset: Int) {
    openToWorkUsers(limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        id
        username
        displayName
        bio
        avatar
        followerCount
        openToWork
      }
    }
  }
`

export enum QueryOpenToWorkUsers {
    Query1 = "query1",
}

const queryMap: Record<QueryOpenToWorkUsers, DocumentNode> = {
    [QueryOpenToWorkUsers.Query1]: query1,
}

/**
 * Fetches the talent directory — users who opted into "open to work", newest
 * first. Mirrors `openToWorkUsers` (queries/users/open-to-work-users); list at
 * `data.openToWorkUsers.data`.
 */
export const queryOpenToWorkUsers = async ({
    query = QueryOpenToWorkUsers.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryOpenToWorkUsers, QueryOpenToWorkUsersRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryOpenToWorkUsersResponse>({
        query: queryMap[query],
        variables: {
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
