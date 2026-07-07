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
const toChatMessage = (dto: ChatMessageResponse, viewerId: string | undefined): ChatMessage => ({
    id: dto.id,
    fromMe: Boolean(viewerId) && dto.senderId === viewerId,
    text: dto.content ?? "",
    time: toTimeLabel(dto.createdAt),
})

/** Loads the conversation list from the real chat REST API (BE returns [] when empty). */
export const useQueryConversationsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["GET_CHAT_CONVERSATIONS"], async () => {
        const page = await getConversations({ limit: 50 })
        return (page.items ?? []).map(toConversation)
    })
    return { conversations: data ?? [], isLoading, error, mutate }
}

/**
 * Loads the thread for one conversation from the real chat REST API. Keyed by id
 * so it refetches on selection change; messages are sorted oldest→newest for the
 * bubble column. `fromMe` is resolved against the signed-in viewer id.
 */
export const useQueryConversationMessagesSwr = (conversationId: string | null) => {
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { data, isLoading, error, mutate } = useSWR(
        conversationId ? ["GET_CHAT_MESSAGES", conversationId, viewerId] : null,
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
