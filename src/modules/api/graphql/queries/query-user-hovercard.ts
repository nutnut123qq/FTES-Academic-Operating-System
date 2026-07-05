import { gql } from "@apollo/client"
import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import type { QueryUserHovercardRequest, QueryUserHovercardResponse } from "./types"

const query = gql`
  query UserHovercard($username: String!) {
    userProfile(username: $username) {
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
        followingCount
        isFollowedByMe
      }
    }
  }
`

// ponytail: mock BE — swap fetcher về queryUserHovercard khi BE có userProfile.

/**
 * Fetches a minimal public user profile for the hovercard card.
 * Reuses the same `userProfile` resolver as {@link queryUserProfile} but asks
 * only for the fields the card needs, keeping the response payload small.
 *
 * @param params - GraphQL variables, headers, debug flag, abort signal
 * @returns Apollo query result; entity at `data.userProfile.data`
 */
export const queryUserHovercard = async ({
    request,
    debug,
    signal,
}: QueryParams<never, QueryUserHovercardRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserHovercardResponse>({
        query,
        variables: {
            username: request?.username,
        },
    })
}
