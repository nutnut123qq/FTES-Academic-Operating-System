import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserSolvedChallengesRequest, QueryUserSolvedChallengesResponse } from "./types"

const query1 = gql`
  query UserSolvedChallenges($userId: ID!) {
    userSolvedChallenges(userId: $userId) {
      success
      message
      error
      data {
        title
        submissionUrl
        submissionType
        selectedLang
        passedAt
        difficulty
        score
        courseTitle
      }
    }
  }
`

export enum QueryUserSolvedChallenges {
    Query1 = "query1",
}

const queryMap: Record<QueryUserSolvedChallenges, DocumentNode> = {
    [QueryUserSolvedChallenges.Query1]: query1,
}

/**
 * Fetches a user's passed challenge submissions + their submitted link + language,
 * by id. Mirrors `userSolvedChallenges` (queries/users/user-solved-challenges);
 * list at `data.userSolvedChallenges.data`.
 */
export const queryUserSolvedChallenges = async ({
    query = QueryUserSolvedChallenges.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserSolvedChallenges, QueryUserSolvedChallengesRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserSolvedChallengesResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
