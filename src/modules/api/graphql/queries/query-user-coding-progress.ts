import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserCodingProgressRequest, QueryUserCodingProgressResponse } from "./types"

const query1 = gql`
  query UserCodingProgress($userId: ID!) {
    userCodingProgress(userId: $userId) {
      success
      message
      error
      data {
        solvedProblemIds
        attemptedProblemIds
        revealedProblemIds
        totalPoints
      }
    }
  }
`

export enum QueryUserCodingProgress {
    Query1 = "query1",
}

const queryMap: Record<QueryUserCodingProgress, DocumentNode> = {
    [QueryUserCodingProgress.Query1]: query1,
}

/**
 * Fetches a user's coding-practice status (solved/attempted/revealed ids + total
 * points) by id. Mirrors `userCodingProgress` (queries/users/user-coding-progress);
 * the status is at `data.userCodingProgress.data`.
 */
export const queryUserCodingProgress = async ({
    query = QueryUserCodingProgress.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserCodingProgress, QueryUserCodingProgressRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserCodingProgressResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
