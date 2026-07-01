import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    SubmissionAttemptsListRequest,
    QuerySubmissionAttemptsResponse,
} from "./types"

/** Sort keys for `userChallengeSubmissionAttempts` list (`UserChallengeSubmissionAttemptsSortBy`). */
export enum SubmissionAttemptsSortBy {
    // The attempt number.
    AttemptNumber = "attemptNumber",
    // The date and time the attempt was processed.
    ProccesedAt = "proccesedAt",
    // The score of the attempt.
    Score = "score",
    // The date and time the attempt was created.
    CreatedAt = "createdAt",
    // The date and time the attempt was updated.
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query UserChallengeSubmissionAttempts($request: UserChallengeSubmissionAttemptsRequest!) {
    userChallengeSubmissionAttempts(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          attemptNumber
          score
          shortFeedback
          processedAt
          submissionUrl
          servedModel
          servedProvider
        }
      }
    }
  }
`

export enum QuerySubmissionAttempts {
    Query1 = "query1",
}

const queryMap: Record<QuerySubmissionAttempts, DocumentNode> = {
    [QuerySubmissionAttempts.Query1]: query1,
}

export const defaultSubmissionAttemptsListSorts: Array<SortInput<SubmissionAttemptsSortBy>> = [
    {
        by: SubmissionAttemptsSortBy.AttemptNumber,
        order: SortOrder.Desc,
    },
]

/**
 * Paginated submission attempts (`ref/queries/user-challenge-submission-attempts`).
 */
export const querySubmissionAttempts = async ({
    query = QuerySubmissionAttempts.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QuerySubmissionAttempts, SubmissionAttemptsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QuerySubmissionAttemptsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
