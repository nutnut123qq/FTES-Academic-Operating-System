import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserCodingHistoryRequest, QueryUserCodingHistoryResponse } from "./types"

const query1 = gql`
  query UserCodingHistory($userId: ID!) {
    userCodingHistory(userId: $userId) {
      success
      message
      error
      data {
        problemTitle
        difficulty
        domain
        languages
        firstSolvedAt
      }
    }
  }
`

export enum QueryUserCodingHistory {
    Query1 = "query1",
}

const queryMap: Record<QueryUserCodingHistory, DocumentNode> = {
    [QueryUserCodingHistory.Query1]: query1,
}

/**
 * Fetches a user's solved coding problems + the language(s) used, by id. Mirrors
 * `userCodingHistory` (queries/users/user-coding-history); list at
 * `data.userCodingHistory.data`.
 */
export const queryUserCodingHistory = async ({
    query = QueryUserCodingHistory.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserCodingHistory, QueryUserCodingHistoryRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserCodingHistoryResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
