"use client"

import { useEffect } from "react"
import { useSWRConfig } from "swr"
import { useAppSelector } from "@/redux/hooks"
import { openLiveChatStream } from "@/modules/api/rest/livechat/stream"
import { sendLiveChatHeartbeat } from "@/modules/api/rest/livechat"
import type { LiveChatOnline } from "@/modules/api/rest/livechat"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"
import { LIVE_CHAT_ONLINE_SWR_KEY } from "@/components/features/community/hooks/useQueryLiveChatOnlineSwr"

/** First reconnect delay after a drop; doubles per failed attempt up to {@link MAX_BACKOFF_MS}. */
export const INITIAL_BACKOFF_MS = 1_000
/** Reconnect delay ceiling. */
export const MAX_BACKOFF_MS = 30_000
/** Presence heartbeat cadence while the panel is open (BE prunes at ~90s). */
export const HEARTBEAT_MS = 25_000

/**
 * Community live-chat realtime over SSE (`GET /api/v1/community/live-chat/stream` —
 * BE `LiveChatSseHub` + Redis pub/sub fan-out; mirrors the proven notification SSE
 * lifecycle). Mounted ONLY while the chat surface is active (`enabled`) — never
 * app-wide — so no SSE is held when nobody is viewing.
 *
 * While `enabled` and the viewer is authenticated:
 * - `message` events push into the {@link useLiveChatStore} live thread (deduped by id).
 * - `online` events patch the online-count SWR cache in place (the count IS the data —
 *   no refetch), so every consumer re-renders live.
 * - `presence` join/left deltas are received (any event proves the stream is live and
 *   resets the reconnect backoff).
 * - a heartbeat `POST /heartbeat` fires every {@link HEARTBEAT_MS} to keep the viewer
 *   in the presence ZSET.
 * - reconnects with exponential backoff (1s → 30s cap) after a drop / clean server
 *   close; a live event resets the backoff. Tears down on close/logout/unmount via
 *   `AbortController` + `clearInterval`.
 *
 * Losing the stream degrades freshness (the `GET /recent` seed + `GET /online` poll
 * still render), never functionality.
 *
 * @param enabled - Whether the chat surface is open (panel visible / popover open).
 */
export const useCommunityLiveChatSse = (enabled: boolean): void => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { mutate } = useSWRConfig()
    const appendMessage = useLiveChatStore((state) => state.appendMessage)

    useEffect(() => {
        if (!enabled || !authenticated) {
            return
        }

        const controller = new AbortController()
        let stopped = false
        let backoffMs = INITIAL_BACKOFF_MS
        let retryTimer: ReturnType<typeof setTimeout> | null = null

        // Patch the pushed counts straight into the online SWR cache (no refetch).
        const applyOnline = (online: LiveChatOnline) => {
            void mutate<LiveChatOnline>(LIVE_CHAT_ONLINE_SWR_KEY, online, { revalidate: false })
        }

        const scheduleReconnect = () => {
            if (stopped) {
                return
            }
            retryTimer = setTimeout(() => {
                retryTimer = null
                void connect()
            }, backoffMs)
            backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
        }

        const connect = async () => {
            try {
                await openLiveChatStream({
                    signal: controller.signal,
                    onMessage: (message) => {
                        backoffMs = INITIAL_BACKOFF_MS
                        appendMessage(message)
                    },
                    onOnline: (online) => {
                        backoffMs = INITIAL_BACKOFF_MS
                        applyOnline(online)
                    },
                    onPresence: () => {
                        // any event proves the stream is live — reset the failure backoff
                        backoffMs = INITIAL_BACKOFF_MS
                    },
                })
                // clean server close (emitter timeout) — falls through to reconnect
            } catch {
                // abort (close/logout/unmount) lands here too; `stopped` gates the reconnect
            }
            scheduleReconnect()
        }

        void connect()

        // Presence heartbeat while open (fire-and-forget; failures are best-effort).
        const heartbeatTimer = setInterval(() => {
            void sendLiveChatHeartbeat().catch(() => {
                // presence is best-effort — a missed heartbeat just drops us from the ZSET
            })
        }, HEARTBEAT_MS)

        return () => {
            stopped = true
            if (retryTimer) {
                clearTimeout(retryTimer)
            }
            clearInterval(heartbeatTimer)
            controller.abort()
        }
    }, [enabled, authenticated, mutate, appendMessage])
}
