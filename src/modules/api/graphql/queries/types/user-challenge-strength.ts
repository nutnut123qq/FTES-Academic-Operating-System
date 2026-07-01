import type { GraphQLResponse } from "../../types"

/** Variables for the `userChallengeStrength` query. */
export interface QueryUserChallengeStrengthRequest {
    /** Id of the user whose challenge-strength stats to fetch. */
    userId: string
}

/**
 * The challenge-strength payload: how the user's difficulty-weighted challenge
 * score compares globally. Both fields are null when the user has passed no
 * challenges yet (unranked).
 */
export interface QueryUserChallengeStrengthData {
    /** Percent of ranked users the viewer beats (0–100), or null when unranked. */
    percentile: number | null
    /** 1-based global rank by challenge-strength score, or null when unranked. */
    rank: number | null
    /** Total XP earned from challenges (real ledger sum); 0 when none. */
    xp: number
}

/** Apollo response shape for the `userChallengeStrength` query. */
export interface QueryUserChallengeStrengthResponse {
    /** Top-level `userChallengeStrength` field wrapping the standard API response. */
    userChallengeStrength: GraphQLResponse<QueryUserChallengeStrengthData | null>
}
