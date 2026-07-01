import type { GraphQLResponse } from "../../types"
import type { AiMode, ModelProvider } from "../query-my-ai-settings"

/** Generation params persisted on an AI Lab run. */
export interface QueryAiLabRunParamsData {
    /** Sampling temperature used. */
    temperature: number | null
    /** Nucleus sampling top-p used. */
    topP: number | null
    /** Max output tokens used. */
    maxTokens: number | null
}

/** One AI Lab run row owned by the viewer. */
export interface QueryAiLabRunData {
    /** Run id. */
    id: string
    /** Owning playground id. */
    playgroundId: string
    /** System prompt submitted for this run. */
    systemPrompt: string | null
    /** User prompt submitted for this run. */
    userPrompt: string
    /** Generation params used. */
    params: QueryAiLabRunParamsData | null
    /** Concrete model that served the run. */
    model: string | null
    /** Provider that served the run. */
    provider: ModelProvider | null
    /** AI lane the run executed on. */
    mode: AiMode | null
    /** Final model output (null while streaming / on failure). */
    output: string | null
    /** Prompt token count. */
    promptTokens: number | null
    /** Completion token count. */
    completionTokens: number | null
    /** Estimated credit cost. */
    estimatedCostCredits: number | null
    /** Run status (streaming | completed | failed | cached). */
    status: string
    /** Failure reason when status is failed. */
    errorMessage: string | null
    /** Creation timestamp (ISO). */
    createdAt: string
}

/** Apollo response shape for the `myAiLabRuns` query. */
export interface QueryMyAiLabRunsResponse {
    /** Top-level `myAiLabRuns` field wrapping the standard API response. */
    myAiLabRuns: GraphQLResponse<Array<QueryAiLabRunData>>
}
