import type { GraphQLResponse } from "../../types"

/** Payload inside `buyStreakFreeze.data` after the standard API wrapper. */
export interface BuyStreakFreezeData {
    /** The viewer's owned streak-freeze count after the purchase (cap 3). */
    streakFreezes: number
    /** The viewer's remaining points after deducting the cost. */
    points: number
}

/** Apollo response shape for `buyStreakFreeze` (no request body). */
export interface MutateBuyStreakFreezeResponse {
    /** Top-level `buyStreakFreeze` field wrapping the standard API response. */
    buyStreakFreeze: GraphQLResponse<BuyStreakFreezeData>
}
