import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryRewardsResponse } from "./types"

const query1 = gql`
  query Rewards {
    rewards {
      success
      message
      error
      data {
        key
        title
        description
        cost
        kind
      }
    }
  }
`

export enum QueryRewards {
    Query1 = "query1",
}

const queryMap: Record<QueryRewards, DocumentNode> = {
    [QueryRewards.Query1]: query1,
}

/**
 * Fetches the catalog of redeemable rewards (gifts store).
 *
 * Mirrors `rewards` (queries/rewards/rewards).
 */
export const queryRewards = async ({
    query = QueryRewards.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryRewards, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryRewardsResponse>({
        query: queryMap[query],
    })
}
