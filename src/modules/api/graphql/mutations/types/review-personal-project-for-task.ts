import type { AiMode, ModelProvider } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `ReviewPersonalProjectTaskRequest` body. */
export interface ReviewPersonalProjectTaskRequest {
    /** Course ID. */
    courseId: string
    /** Task ID to review (defaults to first task if omitted). */
    taskId?: string
    /**
     * GitHub repository URL.
     * If omitted or empty, the URL stored on the user's enrollment for this course is used.
     */
    githubUrl?: string | null
    /**
     * Branch name for review.
     * If omitted, the branch stored on enrollment is used (worker defaults to main when unset).
     */
    branch?: string | null
    /** Chosen programming language for a SCHEMA V2 task (typescript/java/csharp/go). */
    lang?: string
    /** AI lane for grading (auto / premium / byok). */
    mode?: AiMode
    /** Concrete model for premium/BYOK (required for those lanes). */
    selectedModel?: string
    /** Provider for {@link selectedModel}. */
    selectedModelProvider?: ModelProvider
    /** One-shot BYOK key when `mode` is byok and no key is on file. */
    byokApiKey?: string
}

/** Payload inside `reviewPersonalProjectTask.data` after the standard API wrapper. */
export interface ReviewPersonalProjectTaskData {
    /** Attempt row ID created for this review run. */
    attemptId: string
    /** Background job ID enqueued for the review. */
    jobId: string
}

/** Apollo variables bag for the `reviewPersonalProjectTask` mutation. */
export type MutateReviewPersonalProjectTaskVariables =
    QueryVariables<ReviewPersonalProjectTaskRequest>

/** Apollo response shape for `reviewPersonalProjectTask`. */
export interface MutateReviewPersonalProjectTaskResponse {
    /** Top-level `reviewPersonalProjectTask` field wrapping the standard API response. */
    reviewPersonalProjectTask: GraphQLResponse<ReviewPersonalProjectTaskData>
}
