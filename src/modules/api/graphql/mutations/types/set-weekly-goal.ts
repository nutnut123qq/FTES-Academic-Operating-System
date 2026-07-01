import type { GraphQLResponse } from "../../types"

/** GraphQL `SetWeeklyGoalRequest` body. */
export interface SetWeeklyGoalRequest {
    /** Target number of lessons to read this week. */
    lessons: number
}

/** Apollo response shape for `setWeeklyGoal` (no data payload). */
export interface MutateSetWeeklyGoalResponse {
    /** Top-level `setWeeklyGoal` field wrapping the standard API response. */
    setWeeklyGoal: GraphQLResponse
}
