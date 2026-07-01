import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryCourseSuggestionsRequest,
    QueryCourseSuggestionsResponse,
} from "./types"

const query1 = gql`
  query CourseSuggestions($request: SuggestionsRequest!) {
    courseSuggestions(request: $request) {
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

export enum QueryCourseSuggestions {
    Query1 = "query1",
}

const queryMap: Record<QueryCourseSuggestions, DocumentNode> = {
    [QueryCourseSuggestions.Query1]: query1,
}

export const queryCourseSuggestions = async ({
    query = QueryCourseSuggestions.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryCourseSuggestions, QueryCourseSuggestionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryCourseSuggestionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
