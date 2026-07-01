import type { AiMode, ModelProvider } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse } from "../../types"
import type { AiLabRunParamsInput } from "./run-playground-prompt"

/** Input for `submitEvalChallenge` (`mutations/ai-lab/submit-eval-challenge`). */
export interface SubmitEvalChallengeInput {
    /** Eval set to grade against. */
    evalSetId: string
    /** Enrollment that owns the submission (MustEnrolled guard). */
    enrollmentId: string
    /** Optional system prompt override. */
    systemPrompt?: string
    /** User template with `{{input}}` placeholders, run per eval case. */
    userTemplate: string
    /** Optional generation params. */
    params?: AiLabRunParamsInput
    /** AI lane to grade on (auto/premium/byok). */
    mode?: AiMode
    /** Concrete model the user picked; null = balancer default. */
    selectedModel?: string
    /** Provider serving the selected model. */
    selectedModelProvider?: ModelProvider
    /** One-shot BYOK key for this run only (not saved to profile). */
    byokApiKey?: string
}

/** Payload inside `submitEvalChallenge.data` after the standard API wrapper. */
export interface SubmitEvalChallengeData {
    /** Eval run id (refetch `aiLabEvalResult` with this once grading completes). */
    evalRunId: string
    /** Background grading job id (track via the `/job_notifications` socket). */
    jobId: string
}

/** Apollo response shape for `submitEvalChallenge`. */
export interface MutateSubmitEvalChallengeResponse {
    /** Top-level `submitEvalChallenge` field wrapping the standard API response. */
    submitEvalChallenge: GraphQLResponse<SubmitEvalChallengeData>
}
