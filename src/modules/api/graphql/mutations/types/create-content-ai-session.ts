import type { GraphQLResponse } from "../../types"

/** GraphQL `CreateContentAiSessionRequest` body. */
export interface CreateContentAiSessionRequest {
    /** Content the conversation starts in. */
    contentId: string
}

/** Payload inside `createContentAiSession.data` after the standard API wrapper. */
export interface CreateContentAiSessionData {
    /** The new conversation id (null when no enrollment resolves). */
    id: string | null
}

/** Apollo response shape for `createContentAiSession`. */
export interface MutateCreateContentAiSessionResponse {
    /** Top-level `createContentAiSession` field wrapping the standard API response. */
    createContentAiSession: GraphQLResponse<CreateContentAiSessionData>
}
