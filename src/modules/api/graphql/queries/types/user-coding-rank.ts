import type { GraphQLResponse } from "../../types"

/** Variables for the `userCodingRank` query. */
export interface QueryUserCodingRankRequest {
    /** Id of the user whose coding standing to fetch. */
    userId: string
}

/**
 * The coding standing payload: global rank + percentile by solved count. Both null
 * when the user has no ranked activity (solvedCount = 0).
 */
export interface QueryUserCodingRankData {
    /** 1-based global rank by solved count, or null when unranked. */
    rank: number | null
    /** Percent of ranked users the viewer beats (0–100), or null when unranked. */
    percentile: number | null
}

/** Apollo response shape for the `userCodingRank` query. */
export interface QueryUserCodingRankResponse {
    /** Top-level `userCodingRank` field wrapping the standard API response. */
    userCodingRank: GraphQLResponse<QueryUserCodingRankData | null>
}
