import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CourseLearningHistoryRequest,
    QueryCourseLearningHistoryResponse,
} from "./types"

const query1 = gql`
  query CourseLearningHistory($request: CourseLearningHistoryRequest!) {
    courseLearningHistory(request: $request) {
      success
      message
      error
      data {
        items {
          id
          type
          label
          at
          moduleTitle
          difficulty
        }
        nextCursor
      }
    }
  }
`

export enum QueryCourseLearningHistory {
    Query1 = "query1",
}

const queryMap: Record<QueryCourseLearningHistory, DocumentNode> = {
    [QueryCourseLearningHistory.Query1]: query1,
}

/**
 * Fetches one cursor-paginated page of the signed-in viewer's learning history for
 * ONE course (`courseLearningHistory`): the `lessonRead` / `challengePassed` /
 * `milestonePassed` events that belong to the course, newest first, each with the
 * real activity timestamp. `request.courseId` is the course RELAY GLOBAL ID
 * (decoded server-side). Auth required. The page is at
 * `data.courseLearningHistory.data` (`{ items, nextCursor }`).
 */
export const queryCourseLearningHistory = async ({
    query = QueryCourseLearningHistory.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCourseLearningHistory, CourseLearningHistoryRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryCourseLearningHistoryResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
