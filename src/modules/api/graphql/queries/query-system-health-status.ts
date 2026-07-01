import { createNoAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QuerySystemHealthStatusResponse } from "./types"

const query1 = gql`
  query SystemHealthStatus {
    systemHealthStatus {
      success
      message
      error
      data {
        components {
          name
          status
          latencyMs
          message
          checkedAt
        }
      }
    }
  }
`

export enum QuerySystemHealthStatus {
    Query1 = "query1",
}

const queryMap: Record<QuerySystemHealthStatus, DocumentNode> = {
    [QuerySystemHealthStatus.Query1]: query1,
}

/**
 * Public "build in public" infrastructure health snapshot — one traffic-light
 * status per probed component (Postgres, Redis, Kafka, …). No auth: this is the
 * data behind the public `/status` page.
 *
 * Mirrors `systemHealthStatus` (queries/system/system-health-status).
 */
export const querySystemHealthStatus = async ({
    query = QuerySystemHealthStatus.Query1,
    debug,
    signal,
}: Omit<QueryParams<QuerySystemHealthStatus, never>, "request" | "headers"> & {
    request?: never
}) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QuerySystemHealthStatusResponse>({
        query: queryMap[query],
    })
}
