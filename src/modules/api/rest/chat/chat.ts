import { restRequest } from "@/modules/api/rest/client"
import type {
    AddParticipantRequest,
    ChatSendMessageRequest,
    ConversationResponse,
    CreateConversationRequest,
    EditMessageRequest,
    ChatMessageResponse,
    Page,
    PresenceResponse,
    ReadRequest,
} from "./types"

// ---------------- Conversation endpoints ----------------

export const createConversation = async (
    request: CreateConversationRequest,
): Promise<ConversationResponse> =>
    restRequest<ConversationResponse>({
        method: "POST",
        url: "/chat/conversations",
        data: request,
    })

export const getConversations = async (params?: {
    cursor?: string
    limit?: number
}): Promise<Page<ConversationResponse>> =>
    restRequest<Page<ConversationResponse>>({
        method: "GET",
        url: "/chat/conversations",
        params: { ...params },
        authenticated: true,
    })

export const getConversation = async (id: string): Promise<ConversationResponse> =>
    restRequest<ConversationResponse>({
        method: "GET",
        url: `/chat/conversations/${id}`,
        authenticated: true,
    })

export const addParticipant = async (
    conversationId: string,
    request: AddParticipantRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/chat/conversations/${conversationId}/participants`,
        data: request,
    })

export const removeParticipant = async (
    conversationId: string,
    userId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/chat/conversations/${conversationId}/participants/${userId}`,
    })

// ---------------- Message endpoints ----------------

export const getMessages = async (
    conversationId: string,
    params?: { cursor?: string; limit?: number },
): Promise<Page<ChatMessageResponse>> =>
    restRequest<Page<ChatMessageResponse>>({
        method: "GET",
        url: `/chat/conversations/${conversationId}/messages`,
        params: { ...params },
        authenticated: true,
    })

export const sendMessage = async (
    conversationId: string,
    request: ChatSendMessageRequest,
): Promise<ChatMessageResponse> =>
    restRequest<ChatMessageResponse>({
        method: "POST",
        url: `/chat/conversations/${conversationId}/messages`,
        data: request,
    })

export const markConversationRead = async (
    conversationId: string,
    request: ReadRequest,
): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/chat/conversations/${conversationId}/read`,
        data: request,
    })

export const editMessage = async (
    messageId: string,
    request: EditMessageRequest,
): Promise<ChatMessageResponse> =>
    restRequest<ChatMessageResponse>({
        method: "PATCH",
        url: `/chat/messages/${messageId}`,
        data: request,
    })

export const recallMessage = async (messageId: string): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/chat/messages/${messageId}/recall`,
    })

export const reactToMessage = async (
    messageId: string,
    emoji: string,
): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    })

export const unreactToMessage = async (
    messageId: string,
    emoji: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    })

// ---------------- Pin endpoints ----------------

export const pinMessage = async (
    conversationId: string,
    messageId: string,
): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/chat/conversations/${conversationId}/pins/${messageId}`,
    })

export const unpinMessage = async (
    conversationId: string,
    messageId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/chat/conversations/${conversationId}/pins/${messageId}`,
    })

export const getPinnedMessages = async (conversationId: string): Promise<string[]> =>
    restRequest<string[]>({
        method: "GET",
        url: `/chat/conversations/${conversationId}/pins`,
        authenticated: true,
    })

// ---------------- Search / presence ----------------

export const searchMessages = async (params: {
    q: string
    limit?: number
}): Promise<ChatMessageResponse[]> =>
    restRequest<ChatMessageResponse[]>({
        method: "GET",
        url: "/chat/messages/search",
        params: { ...params },
        authenticated: true,
    })

export const getPresence = async (userIds: string[]): Promise<PresenceResponse> =>
    restRequest<PresenceResponse>({
        method: "GET",
        url: "/chat/presence",
        params: { userIds: userIds.join(",") },
        authenticated: true,
    })
