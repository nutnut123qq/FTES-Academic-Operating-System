import { createAuthApolloClient } from "../clients"
import type {
    QueryParams,
    SortInput,
} from "../types"
import { SortOrder } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    FoundationsListRequest,
    QueryFoundationsResponse,
} from "./types"

/** Sort keys for `foundations` list (`FoundationsSortBy` on the API). */
export enum FoundationsSortBy {
    Title = "title",
    SortIndex = "sortIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query Foundations($request: FoundationsRequest!) {
    foundations(request: $request) {
      data {
        count
        data {
          id
          displayId
          title
          description
          kind
          value
          sortIndex
          isRecommended
          author
          thumbnailUrl
          categoryId
          tags {
            id
            value
            sortIndex
          }
        }
      }
    }
  }
`

export enum QueryFoundations {
    Query1 = "query1",
}

const queryMap: Record<QueryFoundations, DocumentNode> = {
    [QueryFoundations.Query1]: query1,
}

/** Default sort order for foundations list (`orderIndex` asc). */
export const defaultFoundationsListSorts: Array<SortInput<FoundationsSortBy>> = [
    {
        by: FoundationsSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

/** Default page size for foundations list. */
export const defaultFoundationsListLimit = 100

/**
 * Paginated foundations for a category (`foundations` query).
 */
export const queryFoundations = async ({
    query = QueryFoundations.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryFoundations, FoundationsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryFoundationsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
