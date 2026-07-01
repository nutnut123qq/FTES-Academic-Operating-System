import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { SubmissionAttemptEntity } from "@/modules/types/entities/submission-attempt"

/** Paginated payload inside `userChallengeSubmissionAttempts.data`. */
export interface QuerySubmissionAttemptsPayload {
    /** Total number of attempt rows matching the filter. */
    count: number
    /** Array of submission attempt entity rows for the current page. */
    data: Array<SubmissionAttemptEntity>
}

/** Pagination and sort filters for the submission attempts list. */
export type SubmissionAttemptsListFilters = PaginationFilters<string>

/** Apollo variables for `userChallengeSubmissionAttempts(request: ...)`. */
export interface SubmissionAttemptsListRequest {
    /** The challenge submission id whose attempts should be listed. */
    challengeSubmissionId: string
    /** Pagination and sort filters for the attempts list. */
    filters: SubmissionAttemptsListFilters
}

/** Apollo response shape for the `userChallengeSubmissionAttempts` query. */
export interface QuerySubmissionAttemptsResponse {
    /** Top-level `userChallengeSubmissionAttempts` field wrapping the standard API response. */
    userChallengeSubmissionAttempts: GraphQLResponse<QuerySubmissionAttemptsPayload>
}

/** Default sort order type for the submission attempts list. */
export type DefaultSubmissionAttemptsListSorts = Array<SortInput<string>>
