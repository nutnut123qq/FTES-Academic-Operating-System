import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { UserMilestoneTaskAttemptEntity } from "@/modules/types/entities/user-milestone-task"

/** Paginated payload inside `userPersonalTaskAttempts.data`. */
export interface QueryUserPersonalTaskAttemptsPayload {
    /** Total number of attempt rows matching the filter. */
    count: number
    /** Array of milestone task attempt entity rows for the current page. */
    data: Array<UserMilestoneTaskAttemptEntity>
}

/** Pagination and sort filters for the user personal task attempts list. */
export type UserPersonalTaskAttemptsListFilters = PaginationFilters<string>

/** Apollo variables for `userPersonalTaskAttempts(request: UserPersonalTaskAttemptsRequest!)`. */
export interface UserPersonalTaskAttemptsListRequest {
    /** The course id scoping the task attempts. */
    courseId: string
    /** The task id whose attempts should be listed. */
    taskId: string
    /** Pagination and sort filters for the attempts list. */
    filters: UserPersonalTaskAttemptsListFilters
}

/** Apollo response shape for the `userPersonalTaskAttempts` query. */
export interface QueryUserPersonalTaskAttemptsResponse {
    /** Top-level `userPersonalTaskAttempts` field wrapping the standard API response. */
    userPersonalTaskAttempts: GraphQLResponse<QueryUserPersonalTaskAttemptsPayload>
}

/** Default sort order type for the user personal task attempts list. */
export type DefaultUserPersonalTaskAttemptsListSorts = Array<SortInput<string>>
