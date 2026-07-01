import type { GraphQLResponse } from "../../types"

/** One follower in the profile avatar group. */
export interface QueryFollowerUser {
    /** Opaque global id (resolve to the profile route on click). */
    globalId: string
    /** Username (@handle + route segment). */
    username: string
    /** Display name; null when unset. */
    displayName: string | null
    /** Avatar URL; null → seeded fallback. */
    avatar: string | null
}

/** Apollo response shape for the `userFollowers` query. */
export interface QueryUserFollowersResponse {
    /** Top-level `userFollowers` field wrapping the standard API response. */
    userFollowers: GraphQLResponse<Array<QueryFollowerUser>>
}
