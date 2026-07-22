"use client"

import { useEffect } from "react"
import { useSWRConfig } from "swr"
import { unstable_serialize } from "swr/infinite"
import { useAppSelector } from "@/redux/hooks"
import { openNotificationStream } from "@/modules/api/rest/notification/stream"
import type { NotificationBadge } from "@/modules/api/rest/notification/types"

/** First reconnect delay after a drop; doubles per failed attempt up to {@link MAX_BACKOFF_MS}. */
export const INITIAL_BACKOFF_MS = 1_000
/** Reconnect delay ceiling. */
export const MAX_BACKOFF_MS = 30_000

/**
 * App-wide realtime notifications over SSE (`GET /api/v1/notifications/stream` — BE
 * `SseHub` + heartbeat; STOMP was removed BE-side in commit `3ea3527`, see OpenSpec
 * `realtime-transport-decision`). Mounted once in {@link SseSideEffects}.
 *
 * - `unread` events (initial sync + after every push) patch `unreadCount` straight into the
 *   bell/badge SWR cache — no refetch round trip.
 * - `notification` events revalidate the bell page + the notification-center infinite list,
 *   so a pushed notification appears live.
 * - Reconnects forever while authenticated: instantly-ish after a clean server close (the BE
 *   emitter times out every 30 minutes by design) and with exponential backoff (1s → 30s cap)
 *   after failures; a live stream (any event received) resets the backoff. Stops on
 *   logout/unmount via `AbortController`.
 *
 * The 60s badge poll in `useQueryMyNotificationsSwr` stays as the delivery fallback — losing
 * this stream degrades freshness, never functionality.
 */
export const useNotificationSseLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { mutate } = useSWRConfig()

    useEffect(() => {
        if (!authenticated) {
            return
        }

        const controller = new AbortController()
        let stopped = false
        let backoffMs = INITIAL_BACKOFF_MS
        let retryTimer: ReturnType<typeof setTimeout> | null = null

        // Patch the pushed unread count into the badge cache (no refetch — the count IS the data).
        const applyUnreadCount = (count: number) => {
            void mutate<NotificationBadge | null>(
                ["QUERY_MY_NOTIFICATIONS_SWR"],
                (current) => (current ? { ...current, unreadCount: count } : current),
                { revalidate: false },
            )
        }

        // A pushed notification → refetch the bell page + the center infinite list.
        // The infinite list CANNOT be reached with a key-filter mutate: SWR's global
        // mutate explicitly skips `$inf$`-prefixed meta keys in its filter branch
        // (and the per-page keys it does match have no mounted revalidators), so a
        // matcher on QUERY_MY_NOTIFICATIONS_INFINITE_SWR is a silent no-op. Target
        // the serialized `$inf$` meta key directly for both unreadOnly variants of
        // useQueryMyNotificationsInfiniteSwr's getKey — mutating the meta key re-runs
        // the infinite fetcher (revalidateFirstPage refetches page 0, where a pushed
        // notification lands).
        const revalidateNotifications = () => {
            void mutate(["QUERY_MY_NOTIFICATIONS_SWR"])
            for (const unreadOnly of [false, true]) {
                void mutate(
                    unstable_serialize(
                        (index: number) =>
                            ["QUERY_MY_NOTIFICATIONS_INFINITE_SWR", unreadOnly, index] as const,
                    ),
                )
            }
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
                await openNotificationStream({
                    signal: controller.signal,
                    onUnread: (count) => {
                        // any event proves the stream is live — reset the failure backoff
                        backoffMs = INITIAL_BACKOFF_MS
                        applyUnreadCount(count)
                    },
                    onNotification: () => {
                        backoffMs = INITIAL_BACKOFF_MS
                        revalidateNotifications()
                    },
                })
                // clean server close (30-min emitter timeout) — falls through to reconnect
            } catch {
                // abort (logout/unmount) lands here too; `stopped` gates the reconnect below
            }
            scheduleReconnect()
        }

        void connect()

        return () => {
            stopped = true
            if (retryTimer) {
                clearTimeout(retryTimer)
            }
            controller.abort()
        }
    }, [authenticated, mutate])
}
