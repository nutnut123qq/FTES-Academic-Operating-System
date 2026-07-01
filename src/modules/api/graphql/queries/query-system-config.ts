import { createNoAuthApolloClient } from "../clients/clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QuerySystemConfigResponse } from "./types"

const query1 = gql`
  query SystemConfig {
    systemConfig {
      success
      message
      error
      data {
        challenge {
          passThreshold
        }
        task {
          passThreshold
        }
        ai {
          auto {
            usesPer5h
            usesPerWeek
            creditsPer5h
            creditsPerWeek
            creditCost
          }
        }
      }
    }
  }
`

export enum QuerySystemConfig {
    Query1 = "query1",
}

const queryMap: Record<QuerySystemConfig, DocumentNode> = {
    [QuerySystemConfig.Query1]: query1,
}

/**
 * Fetches public system config (no auth). Resolver name remains `systemConfig`.
 */
export const querySystemConfig = async ({
    query = QuerySystemConfig.Query1,
    debug,
    signal,
}: QueryParams<QuerySystemConfig, undefined>) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QuerySystemConfigResponse>({
        query: queryMap[query],
    })
}
