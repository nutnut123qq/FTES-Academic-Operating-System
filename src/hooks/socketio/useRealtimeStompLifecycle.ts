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
 * App-wide realtime over STOMP (WS-01). One connection to `/ws/chat` (JWT in the CONNECT frame,
 * verified by `ChatChannelInterceptor`) carries multiple per-user queues:
 *
 * - `/user/queue/chat` — every chat mutation (message/edit/recall/receipt) for the viewer's
 *   conversations, delivered by `ChatFanoutSubscriber` (includes REST-sent messages). Revalidates
 *   the chat SWR caches.
 * - `/user/queue/notifications` — new in-app notifications, delivered by `NotificationFanoutSubscriber`
 *   from the Redis `ftes:notification:realtime:{userId}` channel. Revalidates the bell/center caches
 *   so the badge updates live (previously the bell only polled).
 *
 * Sends stay on REST; this hook only pushes SWR revalidations. Mounted once in
 * {@link SocketIoSideEffects}.
 */
export const useRealtimeStompLifecycle = () => {
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

                // Chat: revalidate the conversation list (last message + unread) on any chat event,
                // plus the affected thread if it is currently cached/open.
                client.subscribe("/user/queue/chat", (frame: IMessage) => {
                    let event: { conversationId?: string } = {}
                    try {
                        event = JSON.parse(frame.body) as { conversationId?: string }
                    } catch {
                        return
                    }
                    void mutate(["GET_CHAT_CONVERSATIONS"])
                    if (event.conversationId) {
                        void mutate(
                            (key) =>
                                Array.isArray(key) &&
                                key[0] === "GET_CHAT_MESSAGES" &&
                                key[1] === event.conversationId,
                        )
                    }
                })

                // Notifications: revalidate the bell/badge + the notification center list live.
                client.subscribe("/user/queue/notifications", () => {
                    void mutate(["QUERY_MY_NOTIFICATIONS_SWR"])
                    void mutate(
                        (key) => Array.isArray(key) && key[0] === "QUERY_MY_NOTIFICATIONS_INFINITE_SWR",
                    )
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
