import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { createSseParser } from "@/modules/sse/parser"
import type { NotificationView } from "./types"

/** Callbacks for the realtime notification SSE stream of {@link openNotificationStream}. */
export interface NotificationStreamHandlers {
    /** Fired when a new in-app notification is pushed (BE event `notification`). */
    onNotification?: (view: NotificationView) => void
    /**
     * Fired with the viewer's unread count (BE event `unread`) — once right after connecting
     * (initial sync) and again after every pushed notification.
     */
    onUnread?: (count: number) => void
    /** Abort the stream (logout / unmount) — the BE emitter cleans up on disconnect. */
    signal?: AbortSignal
}

/** Non-2xx response opening the stream — carries the HTTP status for backoff decisions. */
export class NotificationStreamHttpError extends Error {
    /** HTTP status code of the failed stream request. */
    readonly status: number

    constructor(status: number) {
        super(`Notification stream failed: HTTP_${status}`)
        this.name = "NotificationStreamHttpError"
        this.status = status
    }
}

/**
 * Opens the realtime notification stream (`GET /api/v1/notifications/stream`,
 * `text/event-stream` — BE `SseHub` + 25s comment heartbeat) and dispatches its events until
 * the server closes the connection (30-minute emitter timeout — callers reconnect) or
 * `handlers.signal` aborts.
 *
 * Uses `fetch` + a `ReadableStream` reader, NOT `EventSource`: the BE authenticates the stream
 * through the same JWT filter chain as every REST call (`Authorization: Bearer` header only, no
 * query-param token), and `EventSource` cannot send headers. The bearer token is read fresh from
 * local storage at call time, so each reconnect picks up a refreshed token.
 *
 * @param handlers - Event callbacks + abort signal ({@link NotificationStreamHandlers}).
 * @throws {NotificationStreamHttpError} when the response is non-2xx (e.g. 401 expired token).
 * @throws DOMException `AbortError` when `handlers.signal` aborts, network errors from `fetch`.
 */
export const openNotificationStream = async (
    handlers: NotificationStreamHandlers,
): Promise<void> => {
    const token = LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken) ?? ""
    const response = await fetch(
        `${publicEnv().api.http.replace(/\/$/, "")}/notifications/stream`,
        {
            method: "GET",
            headers: {
                Accept: "text/event-stream",
                Authorization: `Bearer ${token}`,
            },
            signal: handlers.signal,
        },
    )
    if (!response.ok || !response.body) {
        throw new NotificationStreamHttpError(response.status)
    }

    const parser = createSseParser((event) => {
        if (event.event === "unread") {
            const count = Number(event.data)
            if (Number.isFinite(count)) {
                handlers.onUnread?.(count)
            }
            return
        }
        if (event.event === "notification") {
            try {
                handlers.onNotification?.(JSON.parse(event.data) as NotificationView)
            } catch {
                // malformed payload — callers revalidate over REST anyway, never crash the stream
            }
        }
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    for (;;) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }
        parser.push(decoder.decode(value, { stream: true }))
    }
    parser.flush()
}
