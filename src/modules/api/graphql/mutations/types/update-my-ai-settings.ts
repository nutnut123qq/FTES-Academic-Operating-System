import type { AiMode } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse } from "../../types"

/** GraphQL `UpdateMyAiSettingsRequest` body. */
export interface UpdateMyAiSettingsRequest {
    /** Lane to make the default; omit to leave it unchanged. */
    mode?: AiMode
}

/** Apollo response shape for `updateMyAiSettings` (no data payload). */
export interface MutateUpdateMyAiSettingsResponse {
    /** Top-level `updateMyAiSettings` field wrapping the standard API response. */
    updateMyAiSettings: GraphQLResponse
}
