import type { AiMode, ModelProvider } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse, QueryVariables } from "../../types"

/** Request for `submitChallengeSubmission` (`challenge-submissions/submit-challenge-submission`). */
export interface SubmitChallengeSubmissionRequest {
    /** `challenge_submissions.id` to enqueue grading for. */
    challengeSubmissionId: string
    /**
     * Submission URL (GitHub / Google Docs link).
     * Send on first submit so the backend can create `user_challenge_submissions`; optional otherwise to overwrite.
     */
    githubUrl?: string
    /** AI lane to grade on (auto/premium/byok); validated against entitlement at grade time. */
    mode?: AiMode
    /** Concrete model the user picked in the grading dropdown (e.g. "gpt-4o"); null = balancer default. */
    selectedModel?: string
    /** Provider serving {@link selectedModel}. */
    selectedModelProvider?: ModelProvider
    /**
     * SCHEMA V2 only: programming language (typescript | java | csharp | go).
     * Required when submitting a verified (V2) Git challenge.
     */
    lang?: string
    /**
     * One-shot BYOK key for this run only (not saved to profile).
     * Use when `mode` is `byok` and the user has no stored key.
     */
    byokApiKey?: string
}

/** Payload inside `submitChallengeSubmission.data` after the standard API wrapper. */
export interface SubmitChallengeSubmissionData {
    /** Background job ID enqueued for grading. */
    jobId: string
}

/** Apollo variables bag for the `submitChallengeSubmission` mutation. */
export type MutateSubmitChallengeSubmissionVariables =
    QueryVariables<SubmitChallengeSubmissionRequest>

/** Apollo response shape for `submitChallengeSubmission`. */
export interface MutateSubmitChallengeSubmissionResponse {
    /** Top-level `submitChallengeSubmission` field wrapping the standard API response. */
    submitChallengeSubmission: GraphQLResponse<SubmitChallengeSubmissionData>
}
