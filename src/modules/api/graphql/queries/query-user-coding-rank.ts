import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserCodingRankRequest, QueryUserCodingRankResponse } from "./types"

const query1 = gql`
  query UserCodingRank($userId: ID!) {
    userCodingRank(userId: $userId) {
      success
      message
      error
      data {
        rank
        percentile
      }
    }
  }
`

export enum QueryUserCodingRank {
    Query1 = "query1",
}

const queryMap: Record<QueryUserCodingRank, DocumentNode> = {
    [QueryUserCodingRank.Query1]: query1,
}

/**
 * Fetches a user's 1-based global coding-practice rank (by solved count), by id.
 * Mirrors `userCodingRank` (queries/users/user-coding-rank); rank at
 * `data.userCodingRank.data` (null when the user has no ranked activity).
 */
export const queryUserCodingRank = async ({
    query = QueryUserCodingRank.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserCodingRank, QueryUserCodingRankRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserCodingRankResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
