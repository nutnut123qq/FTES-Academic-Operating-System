import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryFoundationCategoriesRequest,
    QueryFoundationCategoriesResponse,
} from "./types"

const query1 = gql`
  query FoundationCategories($request: FoundationCategoriesRequest) {
    foundationCategories(request: $request) {
      success
      message
      error
      data {
        totalCount
        data {
          id
          displayId
          title
          description
          slug
          thumbnailUrl
          sortIndex
        }
      }
    }
  }
`

export enum QueryFoundationCategories {
    Query1 = "query1",
}

const queryMap: Record<QueryFoundationCategories, DocumentNode> = {
    [QueryFoundationCategories.Query1]: query1,
}

export const queryFoundationCategories = async ({
    query = QueryFoundationCategories.Query1,
    request,
    debug,
    headers,
    signal,
}: QueryParams<QueryFoundationCategories, QueryFoundationCategoriesRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryFoundationCategoriesResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
