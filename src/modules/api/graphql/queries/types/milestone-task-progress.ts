import type { GraphQLResponse } from "../../types"

/** Apollo variables for `milestoneTaskProgress(request: MilestoneTaskProgressRequest!)`. */
export interface QueryMilestoneTaskProgressRequest {
    /** The course id whose milestone task progress should be fetched. */
    courseId: string
}

/** Progress summary for a single milestone task. */
export interface MilestoneTaskProgressItem {
    /** Primary identifier of the milestone task. */
    id: string
    /** Score from the user's most recent attempt (0–maxScore). */
    lastScore: number
    /** Maximum possible score for this task. */
    maxScore: number
    /** Whether the user has passed this task. */
    completed: boolean
    /** Total number of attempts made on this task. */
    numAttempts: number
}

/** Payload inside `milestoneTaskProgress.data` after the standard API wrapper. */
export interface QueryMilestoneTaskProgressResponseData {
    /** Progress summary for each completion task in the milestone. */
    completionTasks: Array<MilestoneTaskProgressItem>
    /** Progress summary for the user's current active task; null when not started. */
    currentTask: MilestoneTaskProgressItem | null
}

/** Apollo response shape for the `milestoneTaskProgress` query. */
export interface QueryMilestoneTaskProgressResponse {
    /** Top-level `milestoneTaskProgress` field wrapping the standard API response. */
    milestoneTaskProgress: GraphQLResponse<QueryMilestoneTaskProgressResponseData>
}
