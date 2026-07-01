import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserXpRequest, QueryUserXpResponse } from "./types"

const query1 = gql`
  query UserXp($userId: ID!) {
    userXp(userId: $userId) {
      success
      message
      error
      data {
        challengeXp
        milestoneXp
        codingXp
        lessonXp
        totalPoints
        rewardPoints
      }
    }
  }
`

export enum QueryUserXp {
    Query1 = "query1",
}

const queryMap: Record<QueryUserXp, DocumentNode> = {
    [QueryUserXp.Query1]: query1,
}

/**
 * Fetches a user's per-source XP breakdown (challenge / milestone / coding /
 * lesson) plus the total and reward-points balances, by id. Mirrors `userXp`;
 * payload at `data.userXp.data` (null when the user has earned nothing yet).
 */
export const queryUserXp = async ({
    query = QueryUserXp.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserXp, QueryUserXpRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserXpResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
