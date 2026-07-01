import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserFollowingResponse } from "./types"

/** Variables for the `userFollowing` query. */
export interface QueryUserFollowingRequest {
    /** Username of the profile whose following to list. */
    username: string
    /** Max rows to return (server clamps to its own cap). */
    limit?: number
    /** Number of rows to skip (for infinite scroll). */
    offset?: number
}

const query1 = gql`
  query UserFollowing($username: String!, $limit: Int, $offset: Int) {
    userFollowing(username: $username, limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        globalId
        username
        displayName
        avatar
      }
    }
  }
`

export enum QueryUserFollowing {
    Query1 = "query1",
}

const queryMap: Record<QueryUserFollowing, DocumentNode> = {
    [QueryUserFollowing.Query1]: query1,
}

/**
 * Fetches the users a profile follows (most recent first) by username via Apollo.
 * Public read; `data.userFollowing.data` is one page (the total count lives on
 * `userProfile.followingCount`). Mirrors {@link queryUserFollowers}.
 */
export const queryUserFollowing = async ({
    query = QueryUserFollowing.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserFollowing, QueryUserFollowingRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserFollowingResponse>({
        query: queryMap[query],
        variables: {
            username: request?.username,
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
