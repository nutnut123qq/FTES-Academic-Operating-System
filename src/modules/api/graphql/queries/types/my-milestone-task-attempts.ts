import type { GraphQLResponse } from "../../types"

/** Variables for the `myMilestoneTaskAttempts(limit, offset)` query. */
export interface QueryMyMilestoneTaskAttemptsRequest {
    /** Page size (defaults to 20 server-side). */
    limit?: number
    /** Row offset for pagination (defaults to 0 server-side). */
    offset?: number
}

/** One of the viewer's milestone-task attempts. */
export interface QueryMyMilestoneTaskAttemptItemData {
    /** Attempt id. */
    id: string
    /** Milestone-task title. */
    taskTitle: string
    /** Title of the milestone the task belongs to. */
    milestoneTitle: string
    /** Title of the course the milestone belongs to. */
    courseTitle: string
    /** Opaque global id of the course — pass to resolveRoute on click. */
    courseGlobalId: string
    /** Whether the attempt passed. */
    passed: boolean
    /** Score awarded for the attempt. */
    score: number
    /** Attempted time (ISO). */
    attemptedAt: string
}

/** Inner payload: a page of milestone-task attempts plus the total count. */
export interface QueryMyMilestoneTaskAttemptsPayload {
    /** The page of attempt rows. */
    items: Array<QueryMyMilestoneTaskAttemptItemData>
    /** Total number of attempts across all pages. */
    total: number
}

/** Apollo response shape for the `myMilestoneTaskAttempts` query. */
export interface QueryMyMilestoneTaskAttemptsResponse {
    /** Top-level `myMilestoneTaskAttempts` field wrapping the standard API response. */
    myMilestoneTaskAttempts: GraphQLResponse<QueryMyMilestoneTaskAttemptsPayload>
}
