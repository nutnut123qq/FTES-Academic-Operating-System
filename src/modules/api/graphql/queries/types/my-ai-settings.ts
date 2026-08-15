import type { GraphQLResponse } from "../../types"
import type {
    AiMode,
    AiSubTier,
} from "../query-my-ai-settings"

/** Payload inside `myAiSettings.data` after the standard API wrapper. */
export interface QueryMyAiSettingsResponseData {
    /** The user's manually selected AI lane preference; null means not set. */
    preferredMode: AiMode | null
    /** The resolved AI lane that will actually be used for requests. */
    effectiveMode: AiMode
    /** Whether the user is eligible to use the Premium AI lane. */
    canPremium: boolean
    /** The user's active paid subscription tier; null when on the free tier. */
    tier: AiSubTier | null
}

/** Apollo response shape for the `myAiSettings` query. */
export interface QueryMyAiSettingsResponse {
    /** Top-level `myAiSettings` field wrapping the standard API response. */
    myAiSettings: GraphQLResponse<QueryMyAiSettingsResponseData>
}
