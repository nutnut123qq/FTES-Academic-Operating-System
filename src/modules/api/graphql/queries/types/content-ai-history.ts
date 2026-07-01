import type { GraphQLResponse } from "../../types"

/** GraphQL `ContentAiHistoryRequest` body. */
export interface ContentAiHistoryRequest {
    /** Conversation (session) whose turns to load. */
    sessionId: string
}

/** One saved turn in a content-AI conversation. */
export interface ContentAiHistoryTurn {
    /** Who sent it: `"user"` or `"assistant"`. */
    role: string
    /** The message text (assistant content may be markdown). */
    content: string
}

/** Payload inside `contentAiHistory.data` after the standard API wrapper. */
export interface ContentAiHistoryData {
    /** The saved turns, oldest first. */
    messages: Array<ContentAiHistoryTurn>
}

/** Apollo response shape for the `contentAiSessionMessages` query. */
export interface QueryContentAiHistoryResponse {
    /** Top-level `contentAiSessionMessages` field wrapping the standard API response. */
    contentAiSessionMessages: GraphQLResponse<ContentAiHistoryData>
}
