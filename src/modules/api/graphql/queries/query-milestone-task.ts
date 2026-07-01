import { createAuthApolloClient } from "../clients"
import {
    type QueryParams,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    MilestoneTaskQueryRequest,
    QueryMilestoneTaskResponse,
} from "./types"

const query1 = gql`
  query MilestoneTask($request: TaskRequest!) {
    task(request: $request) {
      success
      message
      error
      data {
        id
        title
        description
        hint
        sortIndex
        briefs {
          id
          lang
          body
          sortIndex
        }
        criterias {
          id
          text
          hint
          score
          sortIndex
        }
        codeImplementations {
          id
          lang
          guide
          example
          sortIndex
        }
      }
    }
  }
`

export enum QueryMilestoneTask {
    Query1 = "query1",
}

const queryMap: Record<QueryMilestoneTask, DocumentNode> = {
    [QueryMilestoneTask.Query1]: query1,
}

export type QueryMilestoneTaskParams = QueryParams<
    QueryMilestoneTask,
    MilestoneTaskQueryRequest
>

/**
 * Fetches a single milestone task (criteria included) by id.
 * Mirrors backend `task` query.
 */
export const queryMilestoneTask = async ({
    query = QueryMilestoneTask.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryMilestoneTaskParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryMilestoneTaskResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
