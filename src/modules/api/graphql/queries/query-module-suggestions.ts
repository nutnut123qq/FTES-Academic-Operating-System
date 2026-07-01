import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryModuleSuggestionsRequest,
    QueryModuleSuggestionsResponse,
} from "./types"

const query1 = gql`
  query ModuleSuggestions($request: SuggestionsRequest!) {
    moduleSuggestions(request: $request) {
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

export enum QueryModuleSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryModuleSuggestions, DocumentNode> = {
    [QueryModuleSuggestions.Query1]: query1,
}

export const queryModuleSuggestions = async ({
    query = QueryModuleSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryModuleSuggestions, QueryModuleSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryModuleSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
