import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { UserMilestoneTaskAttemptFeedbackEntity } from "@/modules/types/entities/user-milestone-task"

/** Paginated payload inside `userPersonalTaskAttemptFeedbacks.data`. */
export interface QueryUserPersonalTaskAttemptFeedbacksPayload {
    /** Total number of feedback rows matching the filter. */
    count: number
    /** Array of milestone task attempt feedback entity rows for the current page. */
    data: Array<UserMilestoneTaskAttemptFeedbackEntity>
}

/** Pagination and sort filters for the user personal task attempt feedbacks list. */
export type UserPersonalTaskAttemptFeedbacksListFilters = PaginationFilters<string>

/** Apollo variables for `userPersonalTaskAttemptFeedbacks(request: ...)`. */
export interface UserPersonalTaskAttemptFeedbacksListRequest {
    /** The attempt id whose feedbacks should be listed. */
    attemptId: string
    /** Pagination and sort filters for the feedbacks list. */
    filters: UserPersonalTaskAttemptFeedbacksListFilters
}

/** Apollo response shape for the `userPersonalTaskAttemptFeedbacks` query. */
export interface QueryUserPersonalTaskAttemptFeedbacksResponse {
    /** Top-level `userPersonalTaskAttemptFeedbacks` field wrapping the standard API response. */
    userPersonalTaskAttemptFeedbacks: GraphQLResponse<QueryUserPersonalTaskAttemptFeedbacksPayload>
}

/** Default sort order type for the user personal task attempt feedbacks list. */
export type DefaultUserPersonalTaskAttemptFeedbacksListSorts = Array<SortInput<string>>
