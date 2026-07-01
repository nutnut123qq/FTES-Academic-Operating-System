import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { UserFeedRequest, QueryUserFeedResponse } from "./types"

const query1 = gql`
  query UserFeed($request: UserFeedRequest!) {
    userFeed(request: $request) {
      success
      message
      error
      data {
        items {
          id
          actorGlobalId
          actorUsername
          actorAvatar
          type
          targetGlobalId
          targetLabel
          at
          reactionCount
          myReaction
          isMine
        }
        nextCursor
      }
    }
  }
`

export enum QueryUserFeed {
    Query1 = "query1",
}

const queryMap: Record<QueryUserFeed, DocumentNode> = {
    [QueryUserFeed.Query1]: query1,
}

/**
 * Fetches one cursor-paginated page of a user's activity timeline by id.
 *
 * Mirrors `userFeed` (queries/users/user-feed/user-feed.resolver.ts); the page
 * is at `data.userFeed.data` (`{ items, nextCursor }`).
 */
export const queryUserFeed = async ({
    query = QueryUserFeed.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserFeed, UserFeedRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserFeedResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
