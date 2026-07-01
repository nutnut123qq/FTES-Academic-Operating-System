import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMyMilestoneTaskAttemptsRequest,
    QueryMyMilestoneTaskAttemptsResponse,
} from "./types"

const query1 = gql`
  query MyMilestoneTaskAttempts($limit: Int, $offset: Int) {
    myMilestoneTaskAttempts(limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        items {
          id
          taskTitle
          milestoneTitle
          courseTitle
          courseGlobalId
          passed
          score
          attemptedAt
        }
        total
      }
    }
  }
`

export enum QueryMyMilestoneTaskAttempts {
    Query1 = "query1",
}

const queryMap: Record<QueryMyMilestoneTaskAttempts, DocumentNode> = {
    [QueryMyMilestoneTaskAttempts.Query1]: query1,
}

/**
 * Fetches a page of the viewer's milestone-task attempts (newest first).
 *
 * Mirrors `myMilestoneTaskAttempts` — plain paginated list, returns
 * `data.myMilestoneTaskAttempts.data` = `{ items, total }`.
 */
export const queryMyMilestoneTaskAttempts = async ({
    query = QueryMyMilestoneTaskAttempts.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryMyMilestoneTaskAttempts, QueryMyMilestoneTaskAttemptsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryMyMilestoneTaskAttemptsResponse>({
        query: queryMap[query],
        variables: {
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
