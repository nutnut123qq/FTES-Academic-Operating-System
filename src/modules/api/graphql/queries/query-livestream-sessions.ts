import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    LivestreamSessionsListRequest,
    QueryLivestreamSessionsResponse,
} from "./types"

/** Sort keys for `livestreamSessions` (`LivestreamSessionsSortBy`). */
export enum LivestreamSessionsSortBy {
    SortIndex = "sortIndex",
    DayOfWeek = "dayOfWeek",
    StartTime = "startTime",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query LivestreamSessions($request: LivestreamSessionsRequest!) {
    livestreamSessions(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          dayOfWeek
          startTime
          expectedEndTime
          note
          sortIndex
        }
      }
    }
  }
`

export enum QueryLivestreamSessions {
    Query1 = "query1",
}

const queryMap: Record<QueryLivestreamSessions, DocumentNode> = {
    [QueryLivestreamSessions.Query1]: query1,
}

export const defaultLivestreamSessionsListSorts: Array<SortInput<LivestreamSessionsSortBy>> = [
    {
        by: LivestreamSessionsSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

/**
 * Paginated course livestream sessions (`ref/livestream-sessions`).
 */
export const queryLivestreamSessions = async ({
    query = QueryLivestreamSessions.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryLivestreamSessions, LivestreamSessionsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryLivestreamSessionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
