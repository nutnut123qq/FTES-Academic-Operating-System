import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { SubmissionFeedbackEntity } from "@/modules/types/entities/submission-feedback"

/** Paginated payload inside `userChallengeSubmissionFeedbacks.data`. */
export interface QuerySubmissionFeedbacksPayload {
    /** Total number of feedback rows matching the filter. */
    count: number
    /** Array of submission feedback entity rows for the current page. */
    data: Array<SubmissionFeedbackEntity>
}

/** Pagination and sort filters for the submission feedbacks list. */
export type SubmissionFeedbacksListFilters = PaginationFilters<string>

/** Apollo variables for `userChallengeSubmissionFeedbacks(request: ...)`. */
export interface SubmissionFeedbacksListRequest {
    /** The submission attempt id whose feedbacks should be listed. */
    submissionAttemptId: string
    /** Pagination and sort filters for the feedbacks list. */
    filters: SubmissionFeedbacksListFilters
}

/** Apollo response shape for the `userChallengeSubmissionFeedbacks` query. */
export interface QuerySubmissionFeedbacksResponse {
    /** Top-level `userChallengeSubmissionFeedbacks` field wrapping the standard API response. */
    userChallengeSubmissionFeedbacks: GraphQLResponse<QuerySubmissionFeedbacksPayload>
}

/** Default sort order type for the submission feedbacks list. */
export type DefaultSubmissionFeedbacksListSorts = Array<SortInput<string>>
