import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    UserPersonalTaskAttemptFeedbacksListRequest,
    QueryUserPersonalTaskAttemptFeedbacksResponse,
} from "./types"

/** Sort keys for `userPersonalTaskAttemptFeedbacks` list. */
export enum UserPersonalTaskAttemptFeedbacksSortBy {
    SortIndex = "sortIndex",
    Severity = "severity",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query UserPersonalTaskAttemptFeedbacks($request: UserPersonalTaskAttemptFeedbacksRequest!) {
    userPersonalTaskAttemptFeedbacks(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          message
          severity
          sortIndex
          location
          suggestion
        }
      }
    }
  }
`

export enum QueryUserPersonalTaskAttemptFeedbacks {
    Query1 = "query1",
}

const queryMap: Record<QueryUserPersonalTaskAttemptFeedbacks, DocumentNode> = {
    [QueryUserPersonalTaskAttemptFeedbacks.Query1]: query1,
}

export const defaultUserPersonalTaskAttemptFeedbacksListSorts: Array<SortInput<UserPersonalTaskAttemptFeedbacksSortBy>> = [
    {
        by: UserPersonalTaskAttemptFeedbacksSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

/**
 * Paginated user personal task attempt feedbacks.
 */
export const queryUserPersonalTaskAttemptFeedbacks = async ({
    query = QueryUserPersonalTaskAttemptFeedbacks.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryUserPersonalTaskAttemptFeedbacks, UserPersonalTaskAttemptFeedbacksListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryUserPersonalTaskAttemptFeedbacksResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
