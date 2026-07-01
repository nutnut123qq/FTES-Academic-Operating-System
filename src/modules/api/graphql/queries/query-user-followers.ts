import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserFollowersResponse } from "./types"

/** Variables for the `userFollowers` query. */
export interface QueryUserFollowersRequest {
    /** Username of the profile whose followers to list. */
    username: string
    /** Max followers to return (server clamps to its own cap). */
    limit?: number
    /** Number of followers to skip (for infinite scroll). */
    offset?: number
}

const query1 = gql`
  query UserFollowers($username: String!, $limit: Int, $offset: Int) {
    userFollowers(username: $username, limit: $limit, offset: $offset) {
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

export enum QueryUserFollowers {
    Query1 = "query1",
}

const queryMap: Record<QueryUserFollowers, DocumentNode> = {
    [QueryUserFollowers.Query1]: query1,
}

/**
 * Fetches a user's followers (most recent first) by username via Apollo. Public
 * read; `data.userFollowers.data` is the visible follower slice (the total count
 * lives on `userProfile.followerCount`).
 */
export const queryUserFollowers = async ({
    query = QueryUserFollowers.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserFollowers, QueryUserFollowersRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserFollowersResponse>({
        query: queryMap[query],
        variables: {
            username: request?.username,
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
