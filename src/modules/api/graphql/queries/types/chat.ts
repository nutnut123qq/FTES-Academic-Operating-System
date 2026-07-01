import type { GraphQLResponse } from "../../types"
import type { CommunityPostAuthor } from "./community-feed"

/** Kind of chat conversation (mirrors backend `ChatConversationType`). */
export enum ChatConversationType {
    /** The single global community chat room. */
    Community = "community",
    /** A private 1:1 thread between a member and the founder. */
    FounderDm = "founderDm",
}

/** A chat conversation handle (id + kind). */
export interface ChatConversation {
    /** Conversation primary id. */
    id: string
    /** Kind of conversation. */
    type: ChatConversationType
}

/** Apollo response shape for `communityChatConversation`. */
export interface QueryCommunityChatConversationResponse {
    /** Top-level field wrapping the standard API response. */
    communityChatConversation: GraphQLResponse<ChatConversation>
}

/** Apollo response shape for `myFounderConversation`. */
export interface QueryMyFounderConversationResponse {
    /** Top-level field wrapping the standard API response. */
    myFounderConversation: GraphQLResponse<ChatConversation>
}

/** A single chat message shaped for the client. */
export interface ChatMessageNode {
    /** Message primary id. */
    id: string
    /** Owning conversation id. */
    conversationId: string
    /** Message body. */
    body: string
    /** ISO timestamp the message was created. */
    createdAt: string
    /** Author of the message. */
    author: CommunityPostAuthor
    /** Whether the viewing user authored this message. */
    isMine: boolean
    /** Whether the author is the founder. */
    isFounderAuthor: boolean
}

/** Variables for the cursor-paginated `chatMessages` query. */
export interface ChatMessagesRequest {
    /** Conversation whose messages are listed. */
    conversationId: string
    /** Opaque cursor from the previous page; omit for page 1. */
    cursor?: string
    /** Max messages per page. */
    limit?: number
}

/** Payload inside `chatMessages.data`. */
export interface QueryChatMessagesData {
    /** Message nodes for this page (newest-first). */
    items: Array<ChatMessageNode>
    /** Cursor for the next (older) page; null when no more. */
    nextCursor: string | null
}

/** Apollo response shape for `chatMessages`. */
export interface QueryChatMessagesResponse {
    /** Top-level field wrapping the standard API response. */
    chatMessages: GraphQLResponse<QueryChatMessagesData>
}
