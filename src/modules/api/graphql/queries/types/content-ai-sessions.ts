import type { GraphQLResponse } from "../../types"

/** GraphQL `ContentAiSessionsRequest` body. */
export interface ContentAiSessionsRequest {
    /** Current content (anchors the list / scopes search to its course). */
    contentId: string
    /** When set, search ALL conversations in the course by title + message text. */
    search?: string
    /** Page size (recency-first). Defaults to 20. */
    limit?: number
    /** Rows to skip for pagination. Defaults to 0. */
    offset?: number
}

/** One content-AI conversation in the list / search results. */
export interface ContentAiSessionSummary {
    /** Conversation (session) id. */
    id: string
    /** Conversation title (null until the first question titles it). */
    title: string | null
    /** Last-activity timestamp (ISO string). */
    updatedAt: string
    /** Number of turns in the conversation. */
    messageCount: number
    /** Content the conversation is anchored to. */
    originContentId: string
    /** Title of the anchoring content (search results only). */
    originContentTitle: string | null
    /** First matching message (search results only). */
    snippet: string | null
}

/** Payload inside `contentAiSessions.data` after the standard API wrapper. */
export interface ContentAiSessionsData {
    /** The conversations, recency-first. */
    sessions: Array<ContentAiSessionSummary>
}

/** Apollo response shape for the `contentAiSessions` query. */
export interface QueryContentAiSessionsResponse {
    /** Top-level `contentAiSessions` field wrapping the standard API response. */
    contentAiSessions: GraphQLResponse<ContentAiSessionsData>
}
