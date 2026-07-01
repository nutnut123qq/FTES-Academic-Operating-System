import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { ContentReactionsRequest, QueryContentReactionsResponse } from "./types"

const query1 = gql`
  query ContentReactions($request: ContentReactionsRequest!) {
    contentReactions(request: $request) {
      success
      message
      error
      data {
        total
        myReaction
        viewCount
        counts {
          type
          count
        }
      }
    }
  }
`

/** Variant selector for {@link queryContentReactions}. */
export enum QueryContentReactions {
    Query1 = "query1",
}

const queryMap: Record<QueryContentReactions, DocumentNode> = {
    [QueryContentReactions.Query1]: query1,
}

/** Apollo params for {@link queryContentReactions}. */
export type QueryContentReactionsParams = QueryParams<QueryContentReactions, ContentReactionsRequest>

/** Returns the aggregate reaction summary for a content. */
export const queryContentReactions = async ({
    query = QueryContentReactions.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryContentReactionsParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryContentReactionsResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
