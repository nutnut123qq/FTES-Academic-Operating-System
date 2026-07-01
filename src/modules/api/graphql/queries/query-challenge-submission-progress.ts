import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ChallengeSubmissionProgressRequest,
    QueryChallengeSubmissionProgressResponse,
} from "./types"

const query1 = gql`
  query ChallengeSubmissionProgress($request: ChallengeSubmissionProgressRequest!) {
    challengeSubmissionProgress(request: $request) {
      success
      message
      error
      data {
        completionTasks {
          id
          lastScore
          maxScore
          completed
          status
          numAttempts
        }
      }
    }
  }
`

export enum QueryChallengeSubmissionProgress {
    Query1 = "query1",
}

const queryMap: Record<QueryChallengeSubmissionProgress, DocumentNode> = {
    [QueryChallengeSubmissionProgress.Query1]: query1,
}

/**
 * Per-user challenge submission progress for a course (`challengeSubmissionProgress`).
 * Returns one row per attempted challenge with the summed best score and completion flag.
 */
export const queryChallengeSubmissionProgress = async ({
    query = QueryChallengeSubmissionProgress.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryChallengeSubmissionProgress, ChallengeSubmissionProgressRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryChallengeSubmissionProgressResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
