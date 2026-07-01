import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CodingProblemRequest,
    QueryCodingProblemResponse,
} from "./types"

const query1 = gql`
  query CodingProblem($request: CodingProblemRequest!) {
    codingProblem(request: $request) {
      success
      message
      error
      data {
        id
        slug
        title
        statement
        difficulty
        points
        tags
        timeLimitMs
        memoryLimitKb
        sortIndex
        testcases {
          id
          input
          expectedOutput
          isSample
          sortIndex
        }
        starterCodes {
          id
          language
          code
        }
      }
    }
  }
`

export enum QueryCodingProblem {
    Query1 = "query1",
}

const queryMap: Record<QueryCodingProblem, DocumentNode> = {
    [QueryCodingProblem.Query1]: query1,
}

/**
 * Loads one coding problem by slug (statement, starter code, sample testcases).
 * Mirrors backend `codingProblem` (queries/coding/coding-problem).
 */
export const queryCodingProblem = async ({
    query = QueryCodingProblem.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCodingProblem, CodingProblemRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryCodingProblemResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
