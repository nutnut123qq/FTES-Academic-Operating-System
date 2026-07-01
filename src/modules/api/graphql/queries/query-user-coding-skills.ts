import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserCodingSkillsRequest, QueryUserCodingSkillsResponse } from "./types"

const query1 = gql`
  query UserCodingSkills($userId: ID!) {
    userCodingSkills(userId: $userId) {
      success
      message
      error
      data {
        byLanguage {
          key
          solved
        }
        byDifficulty {
          key
          solved
        }
        byDomain {
          key
          solved
        }
      }
    }
  }
`

export enum QueryUserCodingSkills {
    Query1 = "query1",
}

const queryMap: Record<QueryUserCodingSkills, DocumentNode> = {
    [QueryUserCodingSkills.Query1]: query1,
}

/**
 * Fetches a user's solved-coding breakdown (by language + difficulty) by id.
 * Mirrors `userCodingSkills` (queries/users/user-coding-skills); data at
 * `data.userCodingSkills.data`.
 */
export const queryUserCodingSkills = async ({
    query = QueryUserCodingSkills.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserCodingSkills, QueryUserCodingSkillsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserCodingSkillsResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
