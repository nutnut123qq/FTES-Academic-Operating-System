import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryTasksRequest, QueryTasksResponse } from "./types"

const query1 = gql`
  query Tasks($request: TasksRequest!) {
    tasks(request: $request) {
      success
      message
      error
      data {
        data {
          id
          title
          description
          type
          state
          weight
          sortIndex
          maxScore
          passScore
          enrollmentId
          criteria {
            id
            text
            sortIndex
            score
          }
        }
        cursor
      }
    }
  }
`

export enum QueryTasks {
    Query1 = "query1",
}

const queryMap: Record<QueryTasks, DocumentNode> = {
    [QueryTasks.Query1]: query1,
}

/**
 * Fetches personal project tasks for a course via Apollo.
 *
 * @param params - Document key, GraphQL variables
 * @returns Apollo query result; tasks at `data.tasks.data`
 */
export const queryTasks = async ({
    query = QueryTasks.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryTasks, QueryTasksRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryTasksResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
