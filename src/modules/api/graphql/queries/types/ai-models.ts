import type { GraphQLResponse } from "../../types"
import type { ModelProvider } from "../query-my-ai-settings"
import type { AiModelCategory } from "../query-ai-models"
import type { AiActiveModel } from "@/modules/types/ai-model"

/** One selectable model for the grading picker (mirrors backend `AiGradableModelData`). */
export interface AiGradableModel {
    /** Concrete model name (e.g. "gpt-4o"). */
    model: string
    /** Provider serving this model. */
    provider: ModelProvider
    /** Cost/quality category — economy / balanced / premium. */
    category: AiModelCategory
    /** Whether the model is usable on the free Auto lane. */
    complimentary: boolean
    /** Whether the model's provider has a working key right now; false → locked (no key). */
    available: boolean
}

/** Payload inside `aiModels.data` after the standard API wrapper. */
export interface QueryAiModelsResponseData {
    /** The subscription tier slug this model config is for. */
    tier: string
    /** Array of per-task-kind model configurations. */
    models: Array<AiActiveModel>
    /** Enabled models the user can pick from in the grading dropdown. */
    gradableModels: Array<AiGradableModel>
}

/** Apollo response shape for the `aiModels` query. */
export interface QueryAiModelsResponse {
    /** Top-level `aiModels` field wrapping the standard API response. */
    aiModels: GraphQLResponse<QueryAiModelsResponseData>
}
