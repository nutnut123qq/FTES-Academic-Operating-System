import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryModulesRequest, QueryModulesResponse } from "./types"

const query1 = gql`
  query Modules($request: ModulesRequest!) {
    modules(request: $request) {
      success
      message
      error
      data {
        data {
          id
          displayId
          title
          description
          sortIndex
          numContents
          contents {
            id
            displayId
            title
            description
            sortIndex
            minutesRead
            isPremium
            challenges {
              id
            }
          }
        }
      }
    }
  }
`

export enum QueryModules {
    Query1 = "query1",
}

const queryMap: Record<QueryModules, DocumentNode> = {
    [QueryModules.Query1]: query1,
}

export const queryModules = async ({
    query = QueryModules.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryModules, QueryModulesRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryModulesResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
