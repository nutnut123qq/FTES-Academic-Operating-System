import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserChallengeStrengthRequest, QueryUserChallengeStrengthResponse } from "./types"

const query1 = gql`
  query UserChallengeStrength($userId: ID!) {
    userChallengeStrength(userId: $userId) {
      success
      message
      error
      data {
        percentile
        rank
        xp
      }
    }
  }
`

export enum QueryUserChallengeStrength {
    Query1 = "query1",
}

const queryMap: Record<QueryUserChallengeStrength, DocumentNode> = {
    [QueryUserChallengeStrength.Query1]: query1,
}

/**
 * Fetches a user's difficulty-weighted challenge-strength stats (global percentile
 * + rank), by id. Mirrors `userChallengeStrength`; payload at
 * `data.userChallengeStrength.data` (null when the user has no passed challenges).
 */
export const queryUserChallengeStrength = async ({
    query = QueryUserChallengeStrength.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserChallengeStrength, QueryUserChallengeStrengthRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserChallengeStrengthResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
