/** A single model reference (model ID + provider) used within a task's active model or fallback chain. */
export interface AiModelChoice {
    /** Model identifier string (e.g. "gemini-2.0-flash"). */
    model: string
    /** Provider string matching backend `ModelProvider` values. */
    provider: string
}

/** One task-kind's active model configuration including fallback chain. */
export interface AiActiveModel {
    /** The task kind this model configuration applies to (e.g. "code-review"). */
    taskKind: string
    /** Human-readable label for this model configuration. */
    label: string
    /** Description of what this model is used for. */
    description: string
    /** The primary model that will be used for this task kind. */
    activeModel: AiModelChoice
    /** Ordered list of fallback models to try if the active model fails. */
    fallbackChain: Array<AiModelChoice>
}
