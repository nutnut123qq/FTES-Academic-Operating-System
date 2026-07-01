import type { GraphQLResponse } from "../../types"

/** GraphQL `SetFollowRequest` body (idempotent follow/unfollow toggle). */
export interface SetFollowRequest {
    /** Id of the user to follow or unfollow. */
    userId: string
    /** True to follow, false to unfollow. */
    follow: boolean
}

/** Apollo response shape for `setFollow` (no data payload). */
export interface MutateSetFollowResponse {
    /** Top-level `setFollow` field wrapping the standard API response. */
    setFollow: GraphQLResponse
}
