import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ChallengeSubmissionsListRequest,
    QueryChallengeSubmissionsResponse,
} from "./types"

/** Sort keys for `challengeSubmissions` (`ChallengeSubmissionsSortBy`). */
export enum ChallengeSubmissionsSortBy {
    Name = "name",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query ChallengeSubmissions($request: ChallengeSubmissionsRequest!) {
    challengeSubmissions(request: $request) {
      success
      message
      error
      data {
        data {
          id
          type
          title
          score
          sortIndex
          description
          userSubmission {
            submissionUrl
            selectedMode
            selectedModel
            selectedModelProvider
            selectedLang
            lastAttempt {
                score
            }
          }
        }
      }
    }
  }
`

export enum QueryChallengeSubmissions {
    Query1 = "query1",
}

const queryMap: Record<QueryChallengeSubmissions, DocumentNode> = {
    [QueryChallengeSubmissions.Query1]: query1,
}

export const defaultChallengeSubmissionsSorts: Array<
    SortInput<ChallengeSubmissionsSortBy>
> = [
    {
        by: ChallengeSubmissionsSortBy.CreatedAt,
        order: SortOrder.Asc,
    },
]

/**
 * All submission requirements for one challenge (`ref/challenge-submissions`).
 */
export const queryChallengeSubmissions = async ({
    query = QueryChallengeSubmissions.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryChallengeSubmissions, ChallengeSubmissionsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryChallengeSubmissionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
