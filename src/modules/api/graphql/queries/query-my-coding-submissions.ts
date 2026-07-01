import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    MyCodingSubmissionsRequest,
    QueryMyCodingSubmissionsResponse,
} from "./types"

const query1 = gql`
  query MyCodingSubmissions($request: MyCodingSubmissionsRequest!) {
    myCodingSubmissions(request: $request) {
      success
      message
      error
      data {
        total
        submissions {
          id
          language
          sourceCode
          verdict
          passedCount
          totalCount
          runtimeMs
          memoryKb
          compileOutput
          perCaseResults
          createdAt
        }
      }
    }
  }
`

export enum QueryMyCodingSubmissions {
    Query1 = "query1",
}

const queryMap: Record<QueryMyCodingSubmissions, DocumentNode> = {
    [QueryMyCodingSubmissions.Query1]: query1,
}

/**
 * The authenticated user's submissions for a problem (newest first).
 * Mirrors backend `myCodingSubmissions` (queries/coding/my-coding-submissions).
 */
export const queryMyCodingSubmissions = async ({
    query = QueryMyCodingSubmissions.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyCodingSubmissions, MyCodingSubmissionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryMyCodingSubmissionsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
