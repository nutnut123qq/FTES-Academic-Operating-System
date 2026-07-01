import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `ReviewCvRequest` body. */
export interface ReviewCvRequest {
    /** CV submission row ID to review. */
    cvSubmissionId: string
    /** Existing attempt ID to re-review; omit to create a new attempt. */
    cvSubmissionAttemptId?: string
    /** Required rubric level (`template_cvs.id`). */
    templateCvId: string
}

/** Payload inside `reviewCv.data` after the standard API wrapper. */
export interface ReviewCvResponseData {
    /** `jobs.id` enqueued for CV review. */
    jobId: string
}

/** Apollo variables bag for the `reviewCv` mutation. */
export type MutateReviewCvVariables = QueryVariables<ReviewCvRequest>

/** Apollo response shape for `reviewCv`. */
export interface MutateReviewCvResponse {
    /** Top-level `reviewCv` field wrapping the standard API response. */
    reviewCv: GraphQLResponse<ReviewCvResponseData>
}
