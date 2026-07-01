import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `TriggerCvSubmissionRequest` body. */
export interface TriggerCvSubmissionRequest {
    /** CV submission row ID to trigger processing for. */
    cvSubmissionId: string
    /** Existing attempt ID to retrigger; omit to create a new attempt. */
    cvSubmissionAttemptId?: string
}

/** Apollo variables bag for the `triggerCvSubmission` mutation. */
export type MutateTriggerCvSubmissionVariables = QueryVariables<TriggerCvSubmissionRequest>

/** Apollo response shape for `triggerCvSubmission` (no data payload). */
export interface MutateTriggerCvSubmissionResponse {
    /** Top-level `triggerCvSubmission` field wrapping the standard API response. */
    triggerCvSubmission: GraphQLResponse
}
