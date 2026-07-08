"use client"

import { useEffect } from "react"
import { Client, type IMessage } from "@stomp/stompjs"
import { useSWRConfig } from "swr"
import { useSocketConnectionStore } from "./connectionStore"
import { useAppSelector } from "@/redux/hooks"
import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Raw-WebSocket STOMP endpoint of the chat service (BE `registry.addEndpoint("/ws/chat")`). */
const wsChatUrl = (): string => `${publicEnv().api.socketIo.replace(/\/$/, "")}/ws/chat`

/** Reads the current access token (fresh on each (re)connect so a refreshed token is used). */
const currentToken = (): string =>
    LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken) ?? ""

/**
 * Realtime chat over STOMP (WS-01, chat MVP). Replaces the dead socket.io `/community_chat`
 * namespace (the BE speaks Spring STOMP at `/ws/chat`, not socket.io). Connects on auth with the
 * JWT in the CONNECT frame (verified by `ChatChannelInterceptor`), subscribes to the per-user
 * queue `/user/queue/chat` — where `ChatFanoutSubscriber` delivers EVERY chat mutation (message,
 * edited, recalled, read receipt) for conversations the viewer participates in, INCLUDING messages
 * sent over REST (both paths share `MessageService.send` → Redis fanout).
 *
 * On any event it revalidates the chat SWR caches (conversation list + the open thread), so the
 * unread badge and thread update live without a manual refetch. Send stays on REST (unchanged).
 * Mounted once in {@link SocketIoSideEffects}.
 */
export const useCommunityChatStompLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { mutate } = useSWRConfig()

    useEffect(() => {
        // Unauthenticated users have no token → nothing to connect.
        if (!authenticated || !currentToken()) return

        const client = new Client({
            brokerURL: wsChatUrl(),
            // Fresh token on every (re)connect — CONNECT auth only checks it at handshake time.
            beforeConnect: () => {
                client.connectHeaders = { Authorization: `Bearer ${currentToken()}` }
            },
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                useSocketConnectionStore.getState().setStatus("community_chat", "connected")
                client.subscribe("/user/queue/chat", (frame: IMessage) => {
                    let event: { kind?: string; conversationId?: string } = {}
                    try {
                        event = JSON.parse(frame.body) as { kind?: string; conversationId?: string }
                    } catch {
                        return
                    }
                    // Conversation list (last message + unread badge) — revalidate on any chat event.
                    void mutate(["GET_CHAT_CONVERSATIONS"])
                    // The affected thread, if it is currently cached/open.
                    if (event.conversationId) {
                        void mutate(
                            (key) =>
                                Array.isArray(key) &&
                                key[0] === "GET_CHAT_MESSAGES" &&
                                key[1] === event.conversationId,
                        )
                    }
                })
            },
            onWebSocketClose: () => {
                useSocketConnectionStore.getState().setStatus("community_chat", "disconnected")
            },
            onStompError: () => {
                useSocketConnectionStore.getState().setStatus("community_chat", "disconnected")
            },
        })

        client.activate()
        return () => {
            void client.deactivate()
        }
    }, [authenticated, mutate])
}
