import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMySessionsResponse } from "./types"

const query1 = gql`
  query MySessions {
    mySessions {
      success
      message
      error
      data {
        data {
          id
          sessionId
          deviceType
          os
          browser
          ipAddress
          location
          lastSeenAt
          createdAt
          current
        }
      }
    }
  }
`

export enum QueryMySessions {
    Query1 = "query1",
}

const queryMap: Record<QueryMySessions, DocumentNode> = {
    [QueryMySessions.Query1]: query1,
}

/**
 * Fetches the current user's active login sessions (devices) via Apollo.
 *
 * Mirrors `mySessions` (queries/sessions/my-sessions/my-sessions.resolver.ts);
 * the device list is at `data.mySessions.data.data`.
 */
export const queryMySessions = async ({
    query = QueryMySessions.Query1,
    debug,
    signal,
}: QueryParams<QueryMySessions, undefined>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryMySessionsResponse>({
        query: queryMap[query],
    })
}
