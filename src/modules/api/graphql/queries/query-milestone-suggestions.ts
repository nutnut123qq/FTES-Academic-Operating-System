import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMilestoneSuggestionsRequest,
    QueryMilestoneSuggestionsResponse,
} from "./types"

const query1 = gql`
  query MilestoneSuggestions($request: SuggestionsRequest!) {
    milestoneSuggestions(request: $request) {
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

export enum QueryMilestoneSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryMilestoneSuggestions, DocumentNode> = {
    [QueryMilestoneSuggestions.Query1]: query1,
}

export const queryMilestoneSuggestions = async ({
    query = QueryMilestoneSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryMilestoneSuggestions, QueryMilestoneSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryMilestoneSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
