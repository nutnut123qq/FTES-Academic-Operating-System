import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CodingProblemsRequest,
    QueryCodingProblemsResponse,
} from "./types"

const query1 = gql`
  query CodingProblems($request: CodingProblemsRequest!) {
    codingProblems(request: $request) {
      success
      message
      error
      data {
        total
        problems {
          id
          slug
          title
          difficulty
          points
          domain
          tags
          sortIndex
        }
      }
    }
  }
`

export enum QueryCodingProblems {
    Query1 = "query1",
}

const queryMap: Record<QueryCodingProblems, DocumentNode> = {
    [QueryCodingProblems.Query1]: query1,
}

/**
 * Lists coding problems with filters + the user's solved ids.
 * Mirrors backend `codingProblems` (queries/coding/coding-problems).
 */
export const queryCodingProblems = async ({
    query = QueryCodingProblems.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCodingProblems, CodingProblemsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryCodingProblemsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
