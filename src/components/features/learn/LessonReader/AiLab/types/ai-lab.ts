import type { AiMode, ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"

/**
 * A grading/run lane + concrete model the user picked in the AI Lab.
 *
 * Mirrors the challenge panel's selection shape but lives locally so the AI Lab
 * surfaces do not import modal-internal types.
 */
export interface AiLabModelSelection {
    /** Lane the run executes on (auto = balancer default, premium = the picked model, byok = own key). */
    mode: AiMode
    /** Concrete model name; null on the Auto lane (balancer chooses). */
    model: string | null
    /** Provider serving {@link model}; null on the Auto lane. */
    provider: ModelProvider | null
}

/** Generation params edited by the param controls (kept as numbers for the inputs). */
export interface AiLabParamsForm {
    /** Sampling temperature. */
    temperature: number
    /** Nucleus sampling top-p. */
    topP: number
    /** Max output tokens. */
    maxTokens: number
}
