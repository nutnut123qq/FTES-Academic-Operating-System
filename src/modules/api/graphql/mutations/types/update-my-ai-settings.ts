import type { AiMode, ModelProvider } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse } from "../../types"

/** GraphQL `UpdateMyAiSettingsRequest` body. */
export interface UpdateMyAiSettingsRequest {
    /** Lane to make the default; omit to leave it unchanged. */
    mode?: AiMode
    /** BYOK provider to store (required with byokApiKey). */
    byokProvider?: ModelProvider
    /** Plaintext BYOK API key to encrypt + store server-side. */
    byokApiKey?: string
    /** When `true`, wipe any stored BYOK key + provider. */
    clearByok?: boolean
}

/** Apollo response shape for `updateMyAiSettings` (no data payload). */
export interface MutateUpdateMyAiSettingsResponse {
    /** Top-level `updateMyAiSettings` field wrapping the standard API response. */
    updateMyAiSettings: GraphQLResponse
}
