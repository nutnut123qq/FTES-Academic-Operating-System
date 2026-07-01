import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryContentSuggestionsRequest,
    QueryContentSuggestionsResponse,
} from "./types"

const query1 = gql`
  query ContentSuggestions($request: SuggestionsRequest!) {
    contentSuggestions(request: $request) {
      success
      message
      error
      data {
        data {
          id
          label
        }
      }
    }
  }
`

export enum QueryContentSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryContentSuggestions, DocumentNode> = {
    [QueryContentSuggestions.Query1]: query1,
}

export const queryContentSuggestions = async ({
    query = QueryContentSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryContentSuggestions, QueryContentSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryContentSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
