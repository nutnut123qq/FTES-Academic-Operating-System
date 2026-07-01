import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { AiActiveModel } from "@/modules/types/ai-model"

/**
 * Redux state for the AI models available to the current user.
 */
export interface AiModelsSlice {
    /** The user's current AI subscription tier (e.g. "free", "pro"). */
    tier?: string
    /** Active AI model list returned by the `aiModels` query. */
    models: Array<AiActiveModel>
}

/** Initial state for the ai-models slice. */
const initialState: AiModelsSlice = {
    models: [],
}

/**
 * Slice caching the active AI model catalog and the user's subscription tier.
 */
export const aiModelsSlice = createSlice(
    {
        name: "aiModels",
        initialState,
        reducers: {
            /** Replace the AI model list and update the tier from the latest query result. */
            setAiModels: (
                state,
                action: PayloadAction<SetAiModelsPayload>,
            ) => {
                state.tier = action.payload.tier
                state.models = action.payload.models
            },
        },
    },
)

/** Payload for the `setAiModels` action. */
export interface SetAiModelsPayload {
    /** The user's current AI subscription tier (e.g. "free", "pro"). */
    tier: string
    /** Active AI model list returned by the `aiModels` query. */
    models: Array<AiActiveModel>
}

/** Root reducer for the ai-models slice. */
export const aiModelsReducer = aiModelsSlice.reducer
/** Actions exported from the ai-models slice. */
export const { setAiModels } = aiModelsSlice.actions
