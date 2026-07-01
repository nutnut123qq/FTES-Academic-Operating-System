import type { GraphQLResponse } from "../../types"
import type { QueryFollowerUser } from "./user-followers"

/** Apollo response shape for the `userFollowing` query (reuses the follower-user item). */
export interface QueryUserFollowingResponse {
    /** Top-level `userFollowing` field wrapping the standard API response. */
    userFollowing: GraphQLResponse<Array<QueryFollowerUser>>
}
