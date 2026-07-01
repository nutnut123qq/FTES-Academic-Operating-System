import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `StartTrialRequest` body — start a trial (preview) enrollment. */
export interface StartTrialRequest {
    /** Course id to start a trial for. */
    courseId: string
}

/** Payload inside `startTrial.data` after the standard API wrapper. */
export interface StartTrialData {
    /** True when the user is already a real (paid) enrollee; false for a fresh trial placeholder. */
    isEnrolled: boolean
}

/** Apollo variables bag for the `startTrial` mutation. */
export type MutateStartTrialVariables = QueryVariables<StartTrialRequest>

/** Apollo response shape for `startTrial`. */
export interface MutateStartTrialResponse {
    /** Top-level `startTrial` field wrapping the standard API response. */
    startTrial: GraphQLResponse<StartTrialData>
}
