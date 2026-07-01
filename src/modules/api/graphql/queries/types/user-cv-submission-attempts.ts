import type { GraphQLResponse, SortInput } from "../../types"

/** One CV submission attempt row returned in the paginated list. */
export interface UserCvSubmissionAttemptItemPayload {
    /** Primary identifier for this attempt row. */
    attemptId: string
    /** Sequential attempt number for this submission (1-based). */
    attemptNumber: number
    /** S3 object key for the uploaded CV PDF. */
    fileKey: string
    /** Presigned or absolute URL to download/view the CV PDF. */
    fileUrl: string
    /** ISO 8601 timestamp when the attempt was submitted. */
    submittedAt: string
    /** Current processing status of this attempt. */
    status: string
    /** Full AI review markdown; null until the review job completes. */
    detailFeedback: string | null
    /** Holistic score 0–100; null until scored. */
    score?: number | null
}

/** Paginated payload inside `userCvSubmissionAttempts.data`. */
export interface UserCvSubmissionAttemptsDataPayload {
    /** The parent CV submission id for all listed attempts. */
    cvSubmissionId: string
    /** Total number of attempts for this submission. */
    totalCount: number
    /** Array of attempt rows for the current page. */
    data: Array<UserCvSubmissionAttemptItemPayload>
}

/** Apollo response shape for the `userCvSubmissionAttempts` query. */
export interface QueryUserCvSubmissionAttemptsResponse {
    /** Top-level `userCvSubmissionAttempts` field wrapping the standard API response. */
    userCvSubmissionAttempts: GraphQLResponse<UserCvSubmissionAttemptsDataPayload>
}

/** Pagination and sort filters for the user CV submission attempts list. */
export interface UserCvSubmissionAttemptsListFilters {
    /** 0-based page index (matches API). */
    pageNumber?: number
    /** Maximum number of rows to return per page. */
    limit?: number
    /** Sort clauses to apply to the attempts list. */
    sorts?: Array<SortInput<string>>
}

/** Apollo variables for `userCvSubmissionAttempts(request: UserCvSubmissionAttemptsRequest)`. */
export interface UserCvSubmissionAttemptsListRequest {
    /** Optional filters for the attempts list; defaults to server defaults when omitted. */
    filters?: UserCvSubmissionAttemptsListFilters
}
