import { createNoAuthApolloClient } from "../clients"
import { type QueryParams, type QueryVariables } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { CheckEmailExistsRequest, QueryCheckEmailExistsResponse } from "./types"

const query1 = gql`
  query CheckEmailExists($request: CheckEmailExistsRequest!) {
    checkEmailExists(request: $request) {
      success
      message
      error
      data {
        exists
        isBloomFilterReady
      }
    }
  }
`

export enum QueryCheckEmailExists {
    Query1 = "query1",
}

const queryMap: Record<QueryCheckEmailExists, DocumentNode> = {
    [QueryCheckEmailExists.Query1]: query1,
}

/**
 * Public check: does not require an access token (sign-up / sign-in forms).
 * @param params - GraphQL document key, `request.email`, and optional `debug`
 */
export const queryCheckEmailExists = async ({
    query = QueryCheckEmailExists.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryCheckEmailExists, CheckEmailExistsRequest>) => {
    if (!request) {
        throw new Error("queryCheckEmailExists requires `request`")
    }
    const apollo = createNoAuthApolloClient(
        {
            cache: false,
            debug,
            signal,
        }
    )
    return apollo.query<
        QueryCheckEmailExistsResponse,
        QueryVariables<CheckEmailExistsRequest>
    >(
        {
            query: queryMap[query],
            variables: { request },
        },
    )
}
