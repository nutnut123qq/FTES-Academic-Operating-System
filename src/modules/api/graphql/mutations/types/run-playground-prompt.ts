import type { AiMode, ModelProvider } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse } from "../../types"

/** Generation params for an AI Lab prompt run (`AiLabRunParamsInput`). */
export interface AiLabRunParamsInput {
    /** Sampling temperature. */
    temperature?: number
    /** Nucleus sampling top-p. */
    topP?: number
    /** Max output tokens. */
    maxTokens?: number
}

/** Input for `runPlaygroundPrompt` (`mutations/ai-lab/run-playground-prompt`). */
export interface RunPlaygroundPromptInput {
    /** Playground to run against. */
    playgroundId: string
    /** Optional system prompt override. */
    systemPrompt?: string
    /** User prompt to run. */
    userPrompt: string
    /** Optional generation params. */
    params?: AiLabRunParamsInput
    /** AI lane to run on (auto/premium/byok); validated against entitlement at run time. */
    mode?: AiMode
    /** Concrete model the user picked; null = balancer default. */
    selectedModel?: string
    /** Provider serving {@link selectedModel}. */
    selectedModelProvider?: ModelProvider
    /** One-shot BYOK key for this run only (not saved to profile). */
    byokApiKey?: string
}

/** Payload inside `runPlaygroundPrompt.data` after the standard API wrapper. */
export interface RunPlaygroundPromptData {
    /** Run id (used to subscribe to the `/ai_lab` token stream). */
    runId: string
    /** Inline output when the run was served from cache; null otherwise. */
    cachedOutput: string | null
    /** Run status (streaming | completed | failed | cached). */
    status: string
    /** Runs left in the current rate-limit window. */
    remainingRuns: number
    /** Whether the window budget is exhausted. */
    quotaExhausted: boolean
}

/** Apollo response shape for `runPlaygroundPrompt`. */
export interface MutateRunPlaygroundPromptResponse {
    /** Top-level `runPlaygroundPrompt` field wrapping the standard API response. */
    runPlaygroundPrompt: GraphQLResponse<RunPlaygroundPromptData>
}
