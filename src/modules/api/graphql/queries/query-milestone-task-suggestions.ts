import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMilestoneTaskSuggestionsRequest,
    QueryMilestoneTaskSuggestionsResponse,
} from "./types"

const query1 = gql`
  query MilestoneTaskSuggestions($request: SuggestionsRequest!) {
    milestoneTaskSuggestions(request: $request) {
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

export enum QueryMilestoneTaskSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryMilestoneTaskSuggestions, DocumentNode> = {
    [QueryMilestoneTaskSuggestions.Query1]: query1,
}

export const queryMilestoneTaskSuggestions = async ({
    query = QueryMilestoneTaskSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryMilestoneTaskSuggestions, QueryMilestoneTaskSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryMilestoneTaskSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
