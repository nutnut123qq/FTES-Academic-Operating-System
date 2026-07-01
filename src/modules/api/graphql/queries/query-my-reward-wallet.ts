import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyRewardWalletResponse } from "./types"

const query1 = gql`
  query MyRewardWallet {
    myRewardWallet {
      success
      message
      error
      data {
        balance
        spent
        redemptions {
          rewardKey
          title
          cost
          status
          createdAt
        }
      }
    }
  }
`

export enum QueryMyRewardWallet {
    Query1 = "query1",
}

const queryMap: Record<QueryMyRewardWallet, DocumentNode> = {
    [QueryMyRewardWallet.Query1]: query1,
}

/**
 * Fetches the viewer's reward wallet (điểm quà balance + redemption history).
 *
 * Mirrors `myRewardWallet` (queries/rewards/my-reward-wallet).
 */
export const queryMyRewardWallet = async ({
    query = QueryMyRewardWallet.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyRewardWallet, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyRewardWalletResponse>({
        query: queryMap[query],
    })
}
