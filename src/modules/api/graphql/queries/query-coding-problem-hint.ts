import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CodingProblemHintRequest,
    QueryCodingProblemHintResponse,
} from "./types"

const query1 = gql`
  query CodingProblemHint($request: CodingProblemHintRequest!) {
    codingProblemHint(request: $request) {
      success
      message
      error
      data {
        slug
        hint
      }
    }
  }
`

export enum QueryCodingProblemHint {
    Query1 = "query1",
}

const queryMap: Record<QueryCodingProblemHint, DocumentNode> = {
    [QueryCodingProblemHint.Query1]: query1,
}

/**
 * Loads a coding problem's approach-hint markdown (sourced from Elasticsearch).
 * Mirrors backend `codingProblemHint` (queries/coding/coding-problem-hint).
 */
export const queryCodingProblemHint = async ({
    query = QueryCodingProblemHint.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCodingProblemHint, CodingProblemHintRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryCodingProblemHintResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
