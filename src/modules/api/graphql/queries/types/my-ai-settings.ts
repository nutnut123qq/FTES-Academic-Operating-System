import type { GraphQLResponse } from "../../types"
import type {
    AiMode,
    ModelProvider,
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
    /** Whether the user is eligible to use the BYOK (bring-your-own-key) AI lane. */
    canByok: boolean
    /** The BYOK provider the user has configured; null when none is set. */
    byokProvider: ModelProvider | null
    /** True when the user has stored an encrypted BYOK API key server-side. */
    hasByokKey: boolean
    /** Last 4 chars of the stored BYOK key (masked hint); null when none. */
    byokKeyLast4?: string | null
    /** The user's active paid subscription tier; null when on the free tier. */
    tier: AiSubTier | null
}

/** Apollo response shape for the `myAiSettings` query. */
export interface QueryMyAiSettingsResponse {
    /** Top-level `myAiSettings` field wrapping the standard API response. */
    myAiSettings: GraphQLResponse<QueryMyAiSettingsResponseData>
}
