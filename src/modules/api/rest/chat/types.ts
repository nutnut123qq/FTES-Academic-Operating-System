/**
 * Request/response DTOs for the chat REST controller.
 *
 * Mirrors the backend records in `vn.ftes.aos.chat.web.dto.ChatDtos`.
 */

export type ChatConversationType = string

export interface CreateConversationRequest {
    type: ChatConversationType
    participantIds: string[]
    title?: string
}

export interface ConversationResponse {
    id: string
    type: ChatConversationType
    title?: string
    groupId?: string
    createdBy: string
    lastMessageAt?: string
    lastMessagePreview?: string
    unreadCount: number
    participantIds: string[]
}

export interface Page<T> {
    items: T[]
    nextCursor?: string
}

export interface AttachmentInput {
    kind: string
    storageKey: string
    fileName?: string
    mimeType?: string
    sizeBytes: number
    durationSeconds?: number
}

export interface SendMessageRequest {
    clientMessageId: string
    type?: string
    content?: string
    attachments?: AttachmentInput[]
    replyToId?: string
    mentions?: string[]
}

export interface EditMessageRequest {
    content: string
}

export interface ChatMessageResponse {
    id: string
    conversationId: string
    senderId: string
    clientMessageId?: string
    messageType?: string
    content?: string
    replyToId?: string
    status: string
    createdAt: string
    editedAt?: string
}

export interface ReadRequest {
    lastReadMessageId: string
}

export interface AddParticipantRequest {
    userId: string
}

export interface PresenceResponse {
    online: Record<string, boolean>
}
