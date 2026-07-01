import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    UserPersonalTaskAttemptsListRequest,
    QueryUserPersonalTaskAttemptsResponse,
} from "./types"

/** Sort keys for `userPersonalTaskAttempts` list. */
export enum UserPersonalTaskAttemptsSortBy {
    AttemptNumber = "attemptNumber",
    Score = "score",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
    ProcessedAt = "processedAt",
}

const query1 = gql`
  query UserPersonalTaskAttempts($request: UserPersonalTaskAttemptsRequest!) {
    userPersonalTaskAttempts(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          attemptNumber
          passed
          score
          shortFeedback
          processedAt
          servedModel
          servedProvider
        }
      }
    }
  }
`

export enum QueryUserPersonalTaskAttempts {
    Query1 = "query1",
}

const queryMap: Record<QueryUserPersonalTaskAttempts, DocumentNode> = {
    [QueryUserPersonalTaskAttempts.Query1]: query1,
}

export const defaultUserPersonalTaskAttemptsListSorts: Array<SortInput<UserPersonalTaskAttemptsSortBy>> = [
    {
        by: UserPersonalTaskAttemptsSortBy.AttemptNumber,
        order: SortOrder.Desc,
    },
]

/**
 * Paginated user personal task attempts.
 */
export const queryUserPersonalTaskAttempts = async ({
    query = QueryUserPersonalTaskAttempts.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryUserPersonalTaskAttempts, UserPersonalTaskAttemptsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryUserPersonalTaskAttemptsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
