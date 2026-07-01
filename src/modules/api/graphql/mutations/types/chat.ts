import type { GraphQLResponse } from "../../types"
import type { ChatMessageNode } from "../../queries/types/chat"

/** GraphQL `SendChatMessageRequest` body. */
export interface SendChatMessageRequest {
    /** Conversation the message is sent to. */
    conversationId: string
    /** Raw message body authored by the user. */
    body: string
}

/** Apollo response shape for `sendChatMessage` (the newly sent message node). */
export interface MutateSendChatMessageResponse {
    /** Top-level `sendChatMessage` field wrapping the standard API response. */
    sendChatMessage: GraphQLResponse<ChatMessageNode>
}
