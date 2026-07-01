import type { GraphQLResponse } from "../../types"
import type { AiMode, ModelProvider } from "../query-my-ai-settings"

/** Generation params persisted on an eval run submission. */
export interface QueryAiLabEvalRunParamsData {
    /** Sampling temperature used. */
    temperature: number | null
    /** Nucleus sampling top-p used. */
    topP: number | null
    /** Max output tokens used. */
    maxTokens: number | null
}

/** Per-eval-case grading result row. */
export interface QueryAiLabEvalCaseResultData {
    /** Case result id. */
    id: string
    /** Owning eval case id. */
    evalCaseId: string
    /** Order within the eval set. */
    orderIndex: number
    /** Model output produced for this case. */
    actualOutput: string | null
    /** Metric (non-judge) score. */
    metricScore: number | null
    /** LLM-judge score (judge metric only). */
    judgeScore: number | null
    /** Whether this case passed. */
    passed: boolean
    /** Whether a required citation was present (RAG cases). */
    citationPresent: boolean | null
    /** Grader feedback for this case. */
    feedback: string | null
}

/** Payload inside `aiLabEvalResult.data` after the standard API wrapper. */
export interface AiLabEvalResultData {
    /** Eval run id. */
    id: string
    /** Eval set this run graded against. */
    evalSetId: string
    /** Enrollment that owns this submission. */
    enrollmentId: string
    /** Background grading job id. */
    jobId: string | null
    /** System prompt the user submitted. */
    submittedSystemPrompt: string | null
    /** User template the user submitted (with `{{input}}` placeholders). */
    submittedUserTemplate: string
    /** Generation params submitted. */
    submittedParams: QueryAiLabEvalRunParamsData | null
    /** Concrete model that served grading. */
    model: string | null
    /** Provider that served grading. */
    provider: ModelProvider | null
    /** AI lane grading executed on. */
    mode: AiMode | null
    /** Aggregate score earned. */
    totalScore: number | null
    /** Maximum achievable score. */
    maxScore: number | null
    /** Whether the run passed overall. */
    passed: boolean | null
    /** Eval run status (pending | grading | completed | failed). */
    status: string
    /** Per-case results. */
    caseResults: Array<QueryAiLabEvalCaseResultData>
}

/** Apollo response shape for the `aiLabEvalResult` query. */
export interface QueryAiLabEvalResultResponse {
    /** Top-level `aiLabEvalResult` field wrapping the standard API response. */
    aiLabEvalResult: GraphQLResponse<AiLabEvalResultData>
}
