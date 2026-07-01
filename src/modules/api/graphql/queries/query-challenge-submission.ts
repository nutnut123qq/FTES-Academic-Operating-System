import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import { createAuthApolloClient } from "../clients"
import type { QueryChallengeSubmissionResponse, ChallengeSubmissionRequest } from "./types"

const query1 = gql`
  query ChallengeSubmission($request: ChallengeSubmissionRequest!) {
    challengeSubmission(request: $request) {
      success
      message
      error
      data {
        id
        type
        title
        description
        userSubmission {
          submissionUrl
          score
        }
      }
    }
  }
`

export enum QueryChallengeSubmission {
    Query1 = "query1",
}

const queryMap: Record<QueryChallengeSubmission, DocumentNode> = {
    [QueryChallengeSubmission.Query1]: query1,
}

/**
 * One challenge submission by id, including optional `userSubmission` for the current user
 * (`ref/challenge-submissions/challenge-submission`).
 */
export const queryChallengeSubmission = async ({
    query = QueryChallengeSubmission.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryChallengeSubmission, ChallengeSubmissionRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryChallengeSubmissionResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
