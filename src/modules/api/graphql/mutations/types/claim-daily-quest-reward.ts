import type { GraphQLResponse } from "../../types"

/** Payload of a successful daily-quest claim: the refreshed reward balance. */
export interface ClaimDailyQuestRewardData {
    /** The user's reward-points balance after the grant. */
    balance: number
}

/** Apollo response shape for the `claimDailyQuestReward` mutation. */
export interface MutateClaimDailyQuestRewardResponse {
    /** Top-level `claimDailyQuestReward` field wrapping the standard API response. */
    claimDailyQuestReward: GraphQLResponse<ClaimDailyQuestRewardData>
}
