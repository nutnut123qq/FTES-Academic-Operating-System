import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserAchievementsRequest, QueryUserAchievementsResponse } from "./types"

const query1 = gql`
  query UserAchievements($userId: ID!) {
    userAchievements(userId: $userId) {
      success
      message
      error
      data {
        slug
        name
        description
        iconKey
        criteriaType
        threshold
        earned
        earnedAt
        currentValue
        tierReached
        rarityPercent
      }
    }
  }
`

export enum QueryUserAchievements {
    Query1 = "query1",
}

const queryMap: Record<QueryUserAchievements, DocumentNode> = {
    [QueryUserAchievements.Query1]: query1,
}

/**
 * Fetches a user's achievements (with their earned status + progress) by id.
 *
 * Mirrors `userAchievements` (queries/users/user-achievements/user-achievements.resolver.ts);
 * the list is at `data.userAchievements.data`.
 */
export const queryUserAchievements = async ({
    query = QueryUserAchievements.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserAchievements, QueryUserAchievementsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserAchievementsResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
