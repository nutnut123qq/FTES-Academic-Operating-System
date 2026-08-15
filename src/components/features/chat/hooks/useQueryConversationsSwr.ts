"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import {
    getConversations,
    getMessages,
    sendMessage,
    type ChatMessageResponse,
    type ConversationResponse,
} from "@/modules/api/rest/chat"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { useAppSelector } from "@/redux/hooks"

/** One row in the conversation list (left pane). */
export interface Conversation {
    id: string
    name: string
    lastMessage: string
    unread: number
    avatarInitials: string
}

/** One bubble in a message thread (right pane). */
export interface ChatMessage {
    id: string
    fromMe: boolean
    text: string
    time: string
}

/** Two-letter initials from a conversation title (fallback "?" when untitled). */
const toInitials = (title: string | undefined): string => {
    const words = (title ?? "").trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return "?"
    if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
    return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

/** Maps a BE conversation to the list-row shape the shell renders. */
const toConversation = (dto: ConversationResponse): Conversation => ({
    id: dto.id,
    name: dto.title?.trim() || "Cuộc trò chuyện",
    lastMessage: dto.lastMessagePreview ?? "",
    unread: dto.unreadCount ?? 0,
    avatarInitials: toInitials(dto.title),
})

/** Formats an ISO timestamp to a short HH:mm label; empty when unparseable. */
const toTimeLabel = (iso: string | undefined): string => {
    if (!iso) return ""
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

/** Maps a BE message to the bubble shape, resolving `fromMe` against the viewer. */
const toChatMessage = (dto: ChatMessageResponse, viewerId: string | null): ChatMessage => ({
    id: dto.id,
    fromMe: Boolean(viewerId) && dto.senderId === viewerId,
    text: dto.content ?? "",
    time: toTimeLabel(dto.createdAt),
})

/**
 * Loads the conversation list from the real chat REST API (BE returns [] when empty).
 *
 * The key carries the VIEWER ID ({@link useViewerScopeId}) and doubles as the fetch
 * gate. This one is not a cosmetic leak: on the bare `["GET_CHAT_CONVERSATIONS"]`
 * key, signing out of A and into B in the same tab re-keys to the SAME cache entry,
 * so B is shown A's private conversation titles, last-message previews and unread
 * counts — and inside `dedupingInterval` SWR does not even refetch to correct it.
 * A signed-out viewer keeps a null key, so the token-only endpoint is never called.
 *
 * Callers must revalidate through the returned `mutate` (send, mark-read); a
 * hand-rebuilt key array would no longer match and would silently refresh nothing.
 */
export const useQueryConversationsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId ? ["GET_CHAT_CONVERSATIONS", viewerId] : null,
        async () => {
            const page = await getConversations({ limit: 50 })
            return (page.items ?? []).map(toConversation)
        },
    )
    return { conversations: data ?? [], isLoading, error, mutate }
}

/**
 * Loads the thread for one conversation from the real chat REST API. Keyed by id
 * so it refetches on selection change; messages are sorted oldest→newest for the
 * bubble column. `fromMe` is resolved against the signed-in viewer id.
 *
 * The key already carried the viewer id, but an UNRESOLVED viewer collapsed it to
 * `undefined` — one entry shared by every not-yet-hydrated session, and a thread
 * rendered with every bubble as somebody else's. Requiring a real id (same gate as
 * the conversation list) makes both impossible.
 */
export const useQueryConversationMessagesSwr = (conversationId: string | null) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId && conversationId
            ? ["GET_CHAT_MESSAGES", conversationId, viewerId]
            : null,
        async () => {
            const page = await getMessages(conversationId as string, { limit: 50 })
            return (page.items ?? [])
                .map((message) => toChatMessage(message, viewerId))
                .sort((a, b) => a.time.localeCompare(b.time))
        },
    )
    return { messages: data ?? [], isLoading, error, mutate }
}

/**
 * Sends a message to a conversation via the real chat REST API. Generates a
 * `clientMessageId` per send (BE idempotency key) and exposes a pending flag so
 * the composer can disable while in flight.
 */
export const useSendChatMessage = (conversationId: string | null) => {
    const [isSending, setIsSending] = useState(false)

    const send = useCallback(
        async (content: string): Promise<boolean> => {
            const trimmed = content.trim()
            if (!conversationId || trimmed.length === 0) return false
            setIsSending(true)
            try {
                await sendMessage(conversationId, {
                    clientMessageId: crypto.randomUUID(),
                    content: trimmed,
                })
                return true
            } catch {
                return false
            } finally {
                setIsSending(false)
            }
        },
        [conversationId],
    )

    return { send, isSending }
}
