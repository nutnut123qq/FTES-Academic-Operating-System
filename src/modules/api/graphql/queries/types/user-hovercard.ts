import type { GraphQLResponse } from "../../types"
import type { UserHovercardData } from "@/modules/types/user-hovercard"

/** Variables for the lightweight hovercard user query. */
export interface QueryUserHovercardRequest {
    /** Username of the user whose public profile to fetch (URL-facing handle). */
    username: string
}

/** Apollo response shape for the lightweight hovercard user query. */
export interface QueryUserHovercardResponse {
    /** Top-level `userProfile` resolver returning a stripped public profile. */
    userProfile: GraphQLResponse<UserHovercardData>
}
