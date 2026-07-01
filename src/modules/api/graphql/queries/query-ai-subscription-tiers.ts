import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryAiSubscriptionTiersResponse } from "./types"

const query1 = gql`
  query AiSubscriptionTiers {
    aiSubscriptionTiers {
      success
      message
      error
      data {
        tiers {
          tier
          displayName
          priceVnd
          priceUsd
          description
          creditsPer5h
          creditsPerWeek
          popular
        }
      }
    }
  }
`

export enum QueryAiSubscriptionTiers {
    Query1 = "query1",
}

const queryMap: Record<QueryAiSubscriptionTiers, DocumentNode> = {
    [QueryAiSubscriptionTiers.Query1]: query1,
}

/**
 * Fetches the purchasable AI subscription tiers (price + additive credits).
 *
 * Mirrors `aiSubscriptionTiers` (queries/ai/ai-subscription-tiers.resolver.ts).
 */
export const queryAiSubscriptionTiers = async ({
    query = QueryAiSubscriptionTiers.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryAiSubscriptionTiers, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryAiSubscriptionTiersResponse>({
        query: queryMap[query],
    })
}
