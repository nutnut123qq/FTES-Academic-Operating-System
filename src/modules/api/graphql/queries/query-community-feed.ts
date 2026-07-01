import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { CommunityFeedRequest, QueryCommunityFeedResponse } from "./types"

const query1 = gql`
  query CommunityFeed($request: CommunityFeedRequest!) {
    communityFeed(request: $request) {
      success
      message
      error
      data {
        items {
          id
          body
          channel
          isPinned
          editedAt
          createdAt
          author {
            id
            username
            displayName
            avatar
          }
          commentCount
          reactions {
            total
            myReaction
          }
          isMine
          isFounderAuthor
        }
        nextCursor
      }
    }
  }
`

export enum QueryCommunityFeed {
    Query1 = "query1",
}

const queryMap: Record<QueryCommunityFeed, DocumentNode> = {
    [QueryCommunityFeed.Query1]: query1,
}

/**
 * Cursor-paginated community feed (optionally scoped to a channel). Mirrors
 * `communityFeed` (queries/community/community-feed). Open to everyone; the
 * viewer's own reaction + `isMine` are only populated when authenticated.
 */
export const queryCommunityFeed = async ({
    query = QueryCommunityFeed.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCommunityFeed, CommunityFeedRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryCommunityFeedResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
