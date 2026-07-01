import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    SubmissionFeedbacksListRequest,
    QuerySubmissionFeedbacksResponse,
} from "./types"

/** Sort keys for `userChallengeSubmissionFeedbacks` list (`UserChallengeSubmissionFeedbacksSortBy`). */
export enum SubmissionFeedbacksSortBy {
    // The date and time the submission feedback was created.
    CreatedAt = "createdAt",
    // The date and time the submission feedback was updated.
    UpdatedAt = "updatedAt",
    // The severity of the submission feedback.
    Severity = "severity",
    // The order index of the submission feedback.
    SortIndex = "sortIndex",
}

const query1 = gql`
  query UserChallengeSubmissionFeedbacks($request: UserChallengeSubmissionFeedbacksRequest!) {
    userChallengeSubmissionFeedbacks(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          message
          detail
          severity
          location
          suggestion
          sortIndex
        }
      }
    }
  }
`

export enum QuerySubmissionFeedbacks {
    Query1 = "query1",
}

const queryMap: Record<QuerySubmissionFeedbacks, DocumentNode> = {
    [QuerySubmissionFeedbacks.Query1]: query1,
}

export const defaultSubmissionFeedbacksListSorts: Array<SortInput<SubmissionFeedbacksSortBy>> = [
    {
        by: SubmissionFeedbacksSortBy.CreatedAt,
        order: SortOrder.Asc,
    },
]

/**
 * Paginated submission feedbacks (`ref/queries/user-challenge-submission-feedbacks`).
 */
export const querySubmissionFeedbacks = async ({
    query = QuerySubmissionFeedbacks.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QuerySubmissionFeedbacks, SubmissionFeedbacksListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QuerySubmissionFeedbacksResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
