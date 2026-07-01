import { createAuthApolloClient } from "../clients"
import type {
    QueryParams,
    SortInput,
} from "../types"
import { SortOrder } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ContentsListRequest,
    QueryContentsResponse,
} from "./types"

/** Sort keys for `contents` list (`ContentsSortBy` on the API). */
export enum ContentsSortBy {
    Title = "title",
    SortIndex = "sortIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query Contents($request: ContentsRequest!) {
    contents(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          displayId
          challenges {
            id
          }
          description
          sortIndex
          minutesRead
          title
          body
        }
      }
    }
  }
`

export enum QueryContents {
    Query1 = "query1",
}

const queryMap: Record<QueryContents, DocumentNode> = {
    [QueryContents.Query1]: query1,
}

/** Default sort order for module contents list (`orderIndex` asc). */
export const defaultContentsListSorts: Array<SortInput<ContentsSortBy>> = [
    {
        by: ContentsSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

/** Default page size for module-scoped list queries. */
export const defaultModuleListLimit = 100

/**
 * Paginated module contents (`ref/queries/contents/contents`).
 */
export const queryContents = async ({
    query = QueryContents.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryContents, ContentsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryContentsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
