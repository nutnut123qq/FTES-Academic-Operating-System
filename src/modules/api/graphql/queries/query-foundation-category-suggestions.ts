import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryFoundationCategorySuggestionsRequest,
    QueryFoundationCategorySuggestionsResponse,
} from "./types"

const query1 = gql`
  query FoundationCategorySuggestions($request: FoundationCategorySuggestionsRequest!) {
    foundationCategorySuggestions(request: $request) {
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

export enum QueryFoundationCategorySuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryFoundationCategorySuggestions, DocumentNode> = {
    [QueryFoundationCategorySuggestions.Query1]: query1,
}

export const queryFoundationCategorySuggestions = async ({
    query = QueryFoundationCategorySuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryFoundationCategorySuggestions, QueryFoundationCategorySuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryFoundationCategorySuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
