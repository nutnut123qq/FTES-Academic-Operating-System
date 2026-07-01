import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserCapstoneProgressRequest, QueryUserCapstoneProgressResponse } from "./types"

const query1 = gql`
  query UserCapstoneProgress($userId: ID!) {
    userCapstoneProgress(userId: $userId) {
      success
      message
      error
      data {
        courseGlobalId
        courseTitle
        totalMilestones
        completedMilestones
        totalTasks
        completedTasks
        milestones {
          title
          position
          totalTasks
          passedTasks
          tasks {
            title
            passed
            score
            passedAt
          }
        }
      }
    }
  }
`

export enum QueryUserCapstoneProgress {
    Query1 = "query1",
}

const queryMap: Record<QueryUserCapstoneProgress, DocumentNode> = {
    [QueryUserCapstoneProgress.Query1]: query1,
}

/**
 * Fetches a user's per-course personal-project capstone progress by id. Mirrors
 * `userCapstoneProgress` (queries/users/user-capstone-progress); list at
 * `data.userCapstoneProgress.data` — one course showcase with its milestone +
 * task roll-up.
 */
export const queryUserCapstoneProgress = async ({
    query = QueryUserCapstoneProgress.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserCapstoneProgress, QueryUserCapstoneProgressRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserCapstoneProgressResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
