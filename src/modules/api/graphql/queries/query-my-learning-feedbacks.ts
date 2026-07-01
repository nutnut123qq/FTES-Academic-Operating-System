import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMyLearningFeedbacksRequest,
    QueryMyLearningFeedbacksResponse,
} from "./types"

const query1 = gql`
  query MyLearningFeedbacks($limit: Int, $offset: Int) {
    myLearningFeedbacks(limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        items {
          id
          source
          title
          courseTitle
          summary
          createdAt
        }
        total
      }
    }
  }
`

export enum QueryMyLearningFeedbacks {
    Query1 = "query1",
}

const queryMap: Record<QueryMyLearningFeedbacks, DocumentNode> = {
    [QueryMyLearningFeedbacks.Query1]: query1,
}

/**
 * Fetches a page of the viewer's learning feedbacks (newest first).
 *
 * Mirrors `myLearningFeedbacks` — plain paginated list, returns
 * `data.myLearningFeedbacks.data` = `{ items, total }`.
 */
export const queryMyLearningFeedbacks = async ({
    query = QueryMyLearningFeedbacks.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryMyLearningFeedbacks, QueryMyLearningFeedbacksRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryMyLearningFeedbacksResponse>({
        query: queryMap[query],
        variables: {
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
