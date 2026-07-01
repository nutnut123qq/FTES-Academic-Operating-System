import type { GraphQLResponse } from "../../types"

/** GraphQL `ClearContentAiHistoryRequest` body. */
export interface ClearContentAiHistoryRequest {
    /** Conversation (session) to delete. */
    sessionId: string
}

/** Payload inside `deleteContentAiSession.data` after the standard API wrapper. */
export interface ClearContentAiHistoryData {
    /** Whether the conversation was deleted. */
    cleared: boolean
}

/** Apollo response shape for `deleteContentAiSession`. */
export interface MutateClearContentAiHistoryResponse {
    /** Top-level `deleteContentAiSession` field wrapping the standard API response. */
    deleteContentAiSession: GraphQLResponse<ClearContentAiHistoryData>
}
