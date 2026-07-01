import { createNoAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryAiKeyHealthResponse } from "./types"

const query1 = gql`
  query AiKeyHealth {
    aiKeyHealth {
      success
      message
      error
      data {
        groups {
          provider
          models
          totalKeys
          healthyKeys
          keys {
            keyMask
            healthy
          }
        }
      }
    }
  }
`

export enum QueryAiKeyHealth {
    Query1 = "query1",
}

const queryMap: Record<QueryAiKeyHealth, DocumentNode> = {
    [QueryAiKeyHealth.Query1]: query1,
}

/**
 * Public "build in public" AI key health — masked keys (`sk-...x9f`) grouped per
 * model with a healthy flag each. No auth and no raw values: this is the data
 * behind the public `/status` page (distinct from the admin `aiBalancerHealth`).
 *
 * Mirrors `aiKeyHealth` (queries/system/ai-key-health).
 */
export const queryAiKeyHealth = async ({
    query = QueryAiKeyHealth.Query1,
    debug,
    signal,
}: Omit<QueryParams<QueryAiKeyHealth, never>, "request" | "headers"> & {
    request?: never
}) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryAiKeyHealthResponse>({
        query: queryMap[query],
    })
}
