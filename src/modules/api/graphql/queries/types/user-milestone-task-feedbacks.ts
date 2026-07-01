import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { UserMilestoneTaskAttemptFeedbackEntity } from "@/modules/types/entities/user-milestone-task"

/** Paginated payload inside `userMilestoneTaskFeedbacks.data`. */
export interface QueryUserMilestoneTaskFeedbacksPayload {
    /** Total number of feedback rows matching the filter. */
    count: number
    /** Array of milestone task attempt feedback entity rows for the current page. */
    data: Array<UserMilestoneTaskAttemptFeedbackEntity>
}

/** Pagination and sort filters for the user milestone task feedbacks list. */
export type UserMilestoneTaskFeedbacksListFilters = PaginationFilters<string>

/** Apollo variables for `userMilestoneTaskFeedbacks(request: UserMilestoneTaskFeedbacksRequest!)`. */
export interface UserMilestoneTaskFeedbacksListRequest {
    /** The course id scoping the milestone task feedbacks. */
    courseId: string
    /** The task id whose feedbacks should be listed. */
    taskId: string
    /** Pagination and sort filters for the feedbacks list. */
    filters: UserMilestoneTaskFeedbacksListFilters
}

/** Apollo response shape for the `userMilestoneTaskFeedbacks` query. */
export interface QueryUserMilestoneTaskFeedbacksResponse {
    /** Top-level `userMilestoneTaskFeedbacks` field wrapping the standard API response. */
    userMilestoneTaskFeedbacks: GraphQLResponse<QueryUserMilestoneTaskFeedbacksPayload>
}

/** Default sort order type for the user milestone task feedbacks list. */
export type DefaultUserMilestoneTaskFeedbacksListSorts = Array<SortInput<string>>
