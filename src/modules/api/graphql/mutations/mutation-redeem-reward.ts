import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { RedeemRewardRequest, MutateRedeemRewardResponse } from "./types/redeem-reward"

const mutation1 = gql`
  mutation RedeemReward($request: RedeemRewardRequest!) {
    redeemReward(request: $request) {
      success
      message
      error
      data {
        balance
        streakFreezes
      }
    }
  }
`

export enum MutationRedeemReward {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationRedeemReward, DocumentNode> = {
    [MutationRedeemReward.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateRedeemReward}. */
export type MutateRedeemRewardParams = MutateParams<
    MutationRedeemReward,
    RedeemRewardRequest
>

/**
 * Redeems a reward by key, spending điểm quà. Mirrors `redeemReward`
 * (mutations/rewards/redeem-reward).
 */
export const mutateRedeemReward = async ({
    mutation = MutationRedeemReward.Mutation1,
    request,
    debug,
    signal,
}: MutateRedeemRewardParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateRedeemRewardResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
