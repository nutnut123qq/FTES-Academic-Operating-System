import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryAiBalancerHealthResponse } from "./types"

const query1 = gql`
  query AiBalancerHealth {
    aiBalancerHealth {
      success
      message
      error
      data {
        providers {
          provider
          keysFilePath
          totalKeys
          activeKeys
          disabledKeys
          keys {
            provider
            keySuffix
            status
            failCount
            lastUsedAt
            lastHealthCheckAt
            disabledAt
          }
        }
      }
    }
  }
`

export enum QueryAiBalancerHealth {
    Query1 = "query1",
}

const queryMap: Record<QueryAiBalancerHealth, DocumentNode> = {
    [QueryAiBalancerHealth.Query1]: query1,
}

/**
 * Fetches the live AI balancer key-pool health snapshot (suffixes only, no raw keys).
 *
 * Mirrors `aiBalancerHealth` (queries/system/ai-balancer-health.resolver.ts).
 */
export const queryAiBalancerHealth = async ({
    query = QueryAiBalancerHealth.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryAiBalancerHealth, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryAiBalancerHealthResponse>({
        query: queryMap[query],
    })
}
