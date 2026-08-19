"use client"

import { useEffect } from "react"
import { useSWRConfig } from "swr"
import { unstable_serialize } from "swr/infinite"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { buildMyNotificationsBadgeKey } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { buildMyNotificationsInfiniteKey } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsInfiniteSwr"
import { openNotificationStream, NotificationStreamHttpError } from "@/modules/api/rest/notification/stream"
import { refreshAccessToken, shouldRefreshAccessToken } from "@/modules/api/rest/client/refresh"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
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
    const viewerId = useViewerScopeId()
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
            if (!viewerId) {
                return
            }
            void mutate<NotificationBadge | null>(
                buildMyNotificationsBadgeKey(viewerId),
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
        //
        // The page key comes from the hook's own exported `buildMyNotificationsInfiniteKey`
        // and is NEVER re-typed here: it is viewer-scoped, and a mutate whose key no longer
        // matches the hook's key fails SILENTLY — pushed notifications would just stop
        // appearing until a reload, with nothing in the console to see. While no viewer id
        // has resolved yet (`me` still in flight) the list's own key is null too, so there
        // is nothing to revalidate.
        const revalidateNotifications = () => {
            if (!viewerId) {
                return
            }
            void mutate(buildMyNotificationsBadgeKey(viewerId))
            for (const unreadOnly of [false, true]) {
                void mutate(
                    unstable_serialize(buildMyNotificationsInfiniteKey(unreadOnly, viewerId)),
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
                // ★ LÀM MỚI TOKEN TRƯỚC KHI NỐI. Stream đọc token từ localStorage tại thời điểm
                // gọi, nên nó chỉ "tươi" khi có thứ KHÁC vừa làm mới hộ — thường là một lời gọi
                // REST. Người dùng để yên tab thì chẳng có lời gọi nào: access token sống 15 phút,
                // hết hạn, và mọi lần nối lại đều mang đúng cái token chết đó ⇒ 401 lặp vô tận
                // theo nhịp backoff. Đã đo trên production: token hết hạn TRƯỚC lời gọi 13,4 phút.
                if (shouldRefreshAccessToken(
                    LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken) ?? undefined,
                )) {
                    await refreshAccessToken()
                }
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
            } catch (error) {
                // 401 = token chết giữa chừng (phiên dài hơn 15 phút, hoặc máy vừa ngủ dậy). Nối
                // lại NGAY bằng token cũ chỉ nhận đúng 401 đó lần nữa, nên phải làm mới trước.
                // Bọc try riêng: refresh hỏng (refresh token cũng hết hạn) KHÔNG được ném ra
                // ngoài — vòng lặp còn phải chạy tiếp để `stopped`/backoff làm việc của nó.
                if (error instanceof NotificationStreamHttpError && error.status === 401) {
                    try {
                        await refreshAccessToken()
                    } catch {
                        // hết đường làm mới ⇒ để backoff giãn dần, người dùng sẽ phải đăng nhập lại
                    }
                }
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
        // `viewerId` is a dep because the revalidation targets are keyed on it: when the
        // viewer resolves (or changes, on an in-tab account switch) the stream is reopened
        // with a closure that mutates the RIGHT viewer's list keys.
    }, [authenticated, viewerId, mutate])
}
