import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { ContentStatusRequest, QueryContentStatusResponse } from "./types"

const query1 = gql`
  query ContentStatus($request: ContentStatusRequest!) {
    contentStatus(request: $request) {
      success
      message
      error
      data {
        isRead
        isFavorite
      }
    }
  }
`

export enum QueryContentStatus {
    Query1 = "query1",
}

const queryMap: Record<QueryContentStatus, DocumentNode> = {
    [QueryContentStatus.Query1]: query1,
}

export const queryContentStatus = async ({
    query = QueryContentStatus.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryContentStatus, ContentStatusRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryContentStatusResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
