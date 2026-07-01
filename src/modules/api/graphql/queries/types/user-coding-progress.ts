import type { GraphQLResponse } from "../../types"
import type { MyCodingProgress } from "./coding"

/** Variables for the `userCodingProgress` query. */
export interface QueryUserCodingProgressRequest {
    /** Id of the user whose coding progress to fetch. */
    userId: string
}

/**
 * Apollo response shape for `userCodingProgress`. Reuses {@link MyCodingProgress}
 * (same shape) — solved / attempted / revealed problem ids + total coding points.
 */
export interface QueryUserCodingProgressResponse {
    /** Top-level `userCodingProgress` field wrapping the standard API response. */
    userCodingProgress: GraphQLResponse<MyCodingProgress>
}
