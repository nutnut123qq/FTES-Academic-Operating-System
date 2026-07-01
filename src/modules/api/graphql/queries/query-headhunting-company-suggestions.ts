import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryHeadhuntingCompanySuggestionsRequest,
    QueryHeadhuntingCompanySuggestionsResponse,
} from "./types"

const query1 = gql`
  query HeadhuntingCompanySuggestions($request: SuggestionsRequest!) {
    headhuntingCompanySuggestions(request: $request) {
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

export enum QueryHeadhuntingCompanySuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryHeadhuntingCompanySuggestions, DocumentNode> = {
    [QueryHeadhuntingCompanySuggestions.Query1]: query1,
}

export const queryHeadhuntingCompanySuggestions = async ({
    query = QueryHeadhuntingCompanySuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<
    QueryHeadhuntingCompanySuggestions,
    QueryHeadhuntingCompanySuggestionsRequest
>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryHeadhuntingCompanySuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
