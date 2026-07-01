import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MutateClaimDailyQuestRewardResponse } from "./types/claim-daily-quest-reward"

const mutation1 = gql`
  mutation ClaimDailyQuestReward {
    claimDailyQuestReward {
      success
      message
      error
      data {
        balance
      }
    }
  }
`

export enum MutationClaimDailyQuestReward {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationClaimDailyQuestReward, DocumentNode> = {
    [MutationClaimDailyQuestReward.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateClaimDailyQuestReward}. */
export type MutateClaimDailyQuestRewardParams = Omit<
    MutateParams<MutationClaimDailyQuestReward, never>,
    "request"
> & { request?: never }

/**
 * Claims the completed daily-quest reward (grants points once per day).
 * Mirrors `claimDailyQuestReward` (mutations/profile/claim-daily-quest-reward).
 */
export const mutateClaimDailyQuestReward = async ({
    mutation = MutationClaimDailyQuestReward.Mutation1,
    debug,
    signal,
}: MutateClaimDailyQuestRewardParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateClaimDailyQuestRewardResponse>({
        mutation: mutationMap[mutation],
    })
}
