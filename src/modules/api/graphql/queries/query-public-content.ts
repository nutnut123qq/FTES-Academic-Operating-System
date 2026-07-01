import { createNoAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryPublicContentResponse, PublicContentRequest } from "./types"

const query1 = gql`
  query PublicContent($request: PublicContentRequest!) {
    publicContent(request: $request) {
      success
      message
      error
      data {
        id
        displayId
        description
        sortIndex
        minutesRead
        isPremium
        title
        body
        challenges {
          id
        }
      }
    }
  }
`

export enum QueryPublicContent {
    Query1 = "query1",
}

const queryMap: Record<QueryPublicContent, DocumentNode> = {
    [QueryPublicContent.Query1]: query1,
}

/**
 * Fetch a single non-premium content row (no auth required).
 */
export const queryPublicContent = async ({
    query = QueryPublicContent.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryPublicContent, PublicContentRequest>) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryPublicContentResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
