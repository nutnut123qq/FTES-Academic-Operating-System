import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { MyFeedRequest, QueryMyFeedResponse } from "./types"

const query1 = gql`
  query MyFeed($request: MyFeedRequest!) {
    myFeed(request: $request) {
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

export enum QueryMyFeed {
    Query1 = "query1",
}

const queryMap: Record<QueryMyFeed, DocumentNode> = {
    [QueryMyFeed.Query1]: query1,
}

/**
 * Cursor-paginated home feed (forYou | following). Mirrors `myFeed`
 * (queries/dashboard/my-feed). Pass `cursor` from the previous page's
 * `nextCursor` for the next page.
 */
export const queryMyFeed = async ({
    query = QueryMyFeed.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyFeed, MyFeedRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyFeedResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
