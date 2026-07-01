import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryIncompleteJobsResponse } from "./types"

const query1 = gql`
  query IncompletedJobs {
    incompletedJobs {
      success
      message
      error
      data {
        items {
          jobId
          status
        }
      }
    }
  }
`

export enum QueryIncompleteJobs {
    IncompletedJobs = "incompletedJobs",
}

const queryMap: Record<QueryIncompleteJobs, DocumentNode> = {
    [QueryIncompleteJobs.IncompletedJobs]: query1,
}

/**
 * Incomplete background jobs for the current course context (auth + `X-Course-Id`).
 * Add more `QueryIncompleteJobs` variants when the API exposes additional incomplete lists.
 */
export const queryIncompleteJobs = async ({
    query = QueryIncompleteJobs.IncompletedJobs,
    headers,
    debug,
    signal,
}: QueryParams<QueryIncompleteJobs, undefined>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryIncompleteJobsResponse>({
        query: queryMap[query],
    })
}
