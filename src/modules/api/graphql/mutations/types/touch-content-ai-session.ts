import type { GraphQLResponse } from "../../types"

/** GraphQL `TouchContentAiSessionRequest` body. */
export interface TouchContentAiSessionRequest {
    /** Conversation (session) just opened. */
    sessionId: string
}

/** Payload inside `touchContentAiSession.data` after the standard API wrapper. */
export interface TouchContentAiSessionData {
    /** Whether the conversation's recency was bumped. */
    touched: boolean
}

/** Apollo response shape for `touchContentAiSession`. */
export interface MutateTouchContentAiSessionResponse {
    /** Top-level `touchContentAiSession` field wrapping the standard API response. */
    touchContentAiSession: GraphQLResponse<TouchContentAiSessionData>
}
