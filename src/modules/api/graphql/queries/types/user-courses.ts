import type { GraphQLResponse } from "../../types"
import type { QueryMyDashboardMilestoneProgressItemData } from "./my-dashboard"

/** Variables for the `userCourses` query. */
export interface QueryUserCoursesRequest {
    /** Id of the user whose joined courses to fetch. */
    userId: string
}

/**
 * Apollo response shape for the `userCourses` query. Reuses
 * {@link QueryMyDashboardMilestoneProgressItemData} — same per-course progress
 * shape as `myCourses`; only the subject differs (the profile owner).
 */
export interface QueryUserCoursesResponse {
    /** Top-level `userCourses` field wrapping the standard API response. */
    userCourses: GraphQLResponse<Array<QueryMyDashboardMilestoneProgressItemData>>
}
