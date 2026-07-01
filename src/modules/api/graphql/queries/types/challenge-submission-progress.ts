import type { GraphQLResponse } from "../../types"

/** Lifecycle state of a challenge for the current user. */
export type ChallengeProgressStatus = "notStarted" | "inProgress" | "failed" | "completed"

/** One challenge row in the submission-progress list. */
export interface ChallengeSubmissionProgressItem {
    /** Challenge id (matches `ChallengeEntity.id`). */
    id: string
    /** Sum of each submission's latest-attempt score (each capped at the submission score). */
    lastScore: number
    /** Maximum achievable score for this challenge. */
    maxScore: number
    /** Whether the challenge is completed (every submission submitted and passed). */
    completed: boolean
    /** Lifecycle state: notStarted | inProgress | failed | completed. */
    status: ChallengeProgressStatus
    /** Total number of attempts across all submissions. */
    numAttempts: number
}

/** Payload inside `challengeSubmissionProgress.data`. */
export interface ChallengeSubmissionProgressPayload {
    /** Progress rows for every attempted challenge in the course. */
    completionTasks: Array<ChallengeSubmissionProgressItem>
}

/** Apollo variables for `challengeSubmissionProgress(request: ChallengeSubmissionProgressRequest!)`. */
export interface ChallengeSubmissionProgressRequest {
    /** Scopes progress to the signed-in user's enrollment in this course. */
    courseId: string
}

/** Apollo response shape for the `challengeSubmissionProgress` query. */
export interface QueryChallengeSubmissionProgressResponse {
    /** Top-level `challengeSubmissionProgress` field wrapping the standard API response. */
    challengeSubmissionProgress: GraphQLResponse<ChallengeSubmissionProgressPayload>
}
