import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryConsultantSuggestionsRequest,
    QueryConsultantSuggestionsResponse,
} from "./types"

const query1 = gql`
  query ConsultantSuggestions($request: SuggestionsRequest!) {
    consultantSuggestions(request: $request) {
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

export enum QueryConsultantSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryConsultantSuggestions, DocumentNode> = {
    [QueryConsultantSuggestions.Query1]: query1,
}

export const queryConsultantSuggestions = async ({
    query = QueryConsultantSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryConsultantSuggestions, QueryConsultantSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryConsultantSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
