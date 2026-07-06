## Purpose

Provide a typed REST client and SWR hooks for the chat REST controller endpoints that are not already covered by GraphQL or WebSocket.

## API Surface

### `src/modules/api/rest/chat/types.ts`

```ts
export type ChatConversationType = "direct" | "group" | "community" | "founderDm"

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

export interface ChatSendMessageRequest {
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
```

### `src/modules/api/rest/chat/chat.ts`

Implemented REST functions:

```ts
export const createConversation = (request: CreateConversationRequest): Promise<ConversationResponse>
export const getConversations = (params?: { cursor?: string; limit?: number }): Promise<Page<ConversationResponse>>
export const getConversation = (id: string): Promise<ConversationResponse>
export const addParticipant = (conversationId: string, request: AddParticipantRequest): Promise<void>
export const removeParticipant = (conversationId: string, userId: string): Promise<void>
export const editMessage = (messageId: string, request: EditMessageRequest): Promise<ChatMessageResponse>
export const recallMessage = (messageId: string): Promise<void>
export const reactToMessage = (messageId: string, emoji: string): Promise<void>
export const unreactToMessage = (messageId: string, emoji: string): Promise<void>
export const pinMessage = (conversationId: string, messageId: string): Promise<void>
export const unpinMessage = (conversationId: string, messageId: string): Promise<void>
export const getPinnedMessages = (conversationId: string): Promise<string[]>
export const searchMessages = (params: { q: string; limit?: number }): Promise<ChatMessageResponse[]>
export const getPresence = (userIds: string[]): Promise<PresenceResponse>
```

Skipped functions (already covered):

- `GET /conversations/{id}/messages` — use GraphQL `queryChatMessages`.
- `POST /conversations/{id}/messages` — use GraphQL `mutateSendChatMessage`.
- `PUT /conversations/{id}/read` — use STOMP `/app/chat.read`.

### SWR Hooks

| Hook | File | Type | Key |
|------|------|------|-----|
| `useGetConversationsSwr` | `src/hooks/swr/api/rest/queries/useGetConversationsSwr.ts` | query | `["GET_CONVERSATIONS_SWR", params]` |
| `useGetConversationSwr` | `src/hooks/swr/api/rest/queries/useGetConversationSwr.ts` | query | `["GET_CONVERSATION_SWR", id]` |
| `useGetPinnedMessagesSwr` | `src/hooks/swr/api/rest/queries/useGetPinnedMessagesSwr.ts` | query | `["GET_PINNED_MESSAGES_SWR", conversationId]` |
| `useSearchMessagesSwr` | `src/hooks/swr/api/rest/queries/useSearchMessagesSwr.ts` | query | `["SEARCH_MESSAGES_SWR", params]` |
| `useGetPresenceSwr` | `src/hooks/swr/api/rest/queries/useGetPresenceSwr.ts` | query | `["GET_PRESENCE_SWR", userIds]` |
| `usePostCreateConversationSwr` | `src/hooks/swr/api/rest/mutations/usePostCreateConversationSwr.ts` | mutation | `"POST_CREATE_CONVERSATION_SWR"` |
| `usePostAddParticipantSwr` | `src/hooks/swr/api/rest/mutations/usePostAddParticipantSwr.ts` | mutation | `"POST_ADD_PARTICIPANT_SWR"` |
| `usePostRemoveParticipantSwr` | `src/hooks/swr/api/rest/mutations/usePostRemoveParticipantSwr.ts` | mutation | `"POST_REMOVE_PARTICIPANT_SWR"` |
| `usePostEditMessageSwr` | `src/hooks/swr/api/rest/mutations/usePostEditMessageSwr.ts` | mutation | `"POST_EDIT_MESSAGE_SWR"` |
| `usePostRecallMessageSwr` | `src/hooks/swr/api/rest/mutations/usePostRecallMessageSwr.ts` | mutation | `"POST_RECALL_MESSAGE_SWR"` |
| `usePostReactToMessageSwr` | `src/hooks/swr/api/rest/mutations/usePostReactToMessageSwr.ts` | mutation | `"POST_REACT_TO_MESSAGE_SWR"` |
| `usePostUnreactToMessageSwr` | `src/hooks/swr/api/rest/mutations/usePostUnreactToMessageSwr.ts` | mutation | `"POST_UNREACT_TO_MESSAGE_SWR"` |
| `usePostPinMessageSwr` | `src/hooks/swr/api/rest/mutations/usePostPinMessageSwr.ts` | mutation | `"POST_PIN_MESSAGE_SWR"` |
| `usePostUnpinMessageSwr` | `src/hooks/swr/api/rest/mutations/usePostUnpinMessageSwr.ts` | mutation | `"POST_UNPIN_MESSAGE_SWR"` |

## Acceptance Criteria

1. `src/modules/api/rest/chat/chat.ts` exports typed functions for all non-overlapping `ChatController` endpoints.
2. `src/modules/api/rest/chat/types.ts` mirrors the backend DTO shapes.
3. `src/modules/api/rest/index.ts` re-exports `./chat`.
4. Query and mutation SWR hooks exist and correctly call the clients.
5. `npx tsc --noEmit` exits cleanly.
6. `npm run build -- --webpack` exits cleanly.

## Out of Scope

- UI components/pages using chat.
- Replacing GraphQL `queryChatMessages`, `queryMyFounderConversation`, `queryCommunityChatConversation`, or `mutation-send-chat-message`.
- Replacing Socket.IO/STOMP real-time send/typing/read.
- Backend controller changes.
- New npm dependencies.
