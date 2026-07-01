import type { GraphQLResponse } from "../../types"

/** GraphQL `RedeemRewardRequest` body. */
export interface RedeemRewardRequest {
    /** Key of the reward to redeem (e.g. `streakFreeze`). */
    rewardKey: string
    /** Recipient name — physical rewards only (shipping). */
    recipientName?: string
    /** Contact phone — physical rewards only (shipping). */
    phone?: string
    /** Shipping address — physical rewards only. */
    address?: string
}

/** Payload inside `redeemReward.data` after the standard API wrapper. */
export interface RedeemRewardData {
    /** The viewer's remaining điểm quà balance after the redemption. */
    balance: number
    /** The viewer's owned streak-freeze count after the redemption. */
    streakFreezes: number
}

/** Apollo response shape for `redeemReward`. */
export interface MutateRedeemRewardResponse {
    /** Top-level `redeemReward` field wrapping the standard API response. */
    redeemReward: GraphQLResponse<RedeemRewardData>
}
