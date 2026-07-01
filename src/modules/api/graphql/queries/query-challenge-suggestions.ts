import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryChallengeSuggestionsRequest,
    QueryChallengeSuggestionsResponse,
} from "./types"

const query1 = gql`
  query ChallengeSuggestions($request: SuggestionsRequest!) {
    challengeSuggestions(request: $request) {
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

export enum QueryChallengeSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryChallengeSuggestions, DocumentNode> = {
    [QueryChallengeSuggestions.Query1]: query1,
}

export const queryChallengeSuggestions = async ({
    query = QueryChallengeSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryChallengeSuggestions, QueryChallengeSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryChallengeSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
