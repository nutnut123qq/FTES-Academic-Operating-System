import type { GraphQLResponse } from "../../types"

/** A single redeemable reward in the gifts store. */
export interface QueryRewardData {
    /** Stable reward key (e.g. `streakFreeze`), used as the redeem identifier. */
    key: string
    /** Display title. */
    title: string
    /** Short description of what the reward gives. */
    description: string
    /** Cost in điểm quà (reward points). */
    cost: number
    /** Reward kind — `digital` or `physical`. */
    kind: string
}

/** Apollo response shape for the `rewards` query. */
export interface QueryRewardsResponse {
    /** Top-level `rewards` field wrapping the standard API response. */
    rewards: GraphQLResponse<QueryRewardData[]>
}
