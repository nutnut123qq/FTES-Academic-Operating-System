import type { GraphQLResponse } from "../../types"
import type { ReactionType, ReactionSummary } from "../../queries/types/discussion"

/** GraphQL `ReactToActivityRequest` body (set/change/remove a reaction on a feed activity). */
export interface ReactActivityRequest {
    /** Activity being reacted to. */
    activityId: string
    /** New emotion, or null to remove the existing reaction. */
    type?: ReactionType | null
}

/** Apollo response shape for `reactToActivity` (the activity's refreshed reaction summary). */
export interface MutateReactActivityResponse {
    /** Top-level `reactToActivity` field wrapping the standard API response. */
    reactToActivity: GraphQLResponse<ReactionSummary>
}
