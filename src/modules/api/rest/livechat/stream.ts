import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { createSseParser } from "@/modules/sse/parser"
import type { LiveChatMessage, LiveChatOnline } from "./types"

/** A presence delta pushed on the SSE `presence` event (join/left of one user). */
export interface LiveChatPresence {
    /** Whether the user joined or left the room. */
    type: "join" | "left"
    /** The user whose presence changed. */
    userId: string
    /** Their display name (avatar is not carried on the delta). */
    displayName: string
}

/** Callbacks for the community live-chat SSE stream of {@link openLiveChatStream}. */
export interface LiveChatStreamHandlers {
    /** Fired for each pushed message (BE event `message`). */
    onMessage?: (message: LiveChatMessage) => void
    /** Fired with the online counts (BE event `online`) — throttled ~5–10s server-side. */
    onOnline?: (online: LiveChatOnline) => void
    /** Fired on a presence join/left delta (BE event `presence`) — optional. */
    onPresence?: (presence: LiveChatPresence) => void
    /** Abort the stream (panel close / logout) — the BE emitter cleans up on disconnect. */
    signal?: AbortSignal
}

/** Non-2xx response opening the stream — carries the HTTP status for backoff decisions. */
export class LiveChatStreamHttpError extends Error {
    /** HTTP status code of the failed stream request. */
    readonly status: number

    constructor(status: number) {
        super(`Live-chat stream failed: HTTP_${status}`)
        this.name = "LiveChatStreamHttpError"
        this.status = status
    }
}

/**
 * Opens the community live-chat stream (`GET /api/v1/community/live-chat/stream`,
 * `text/event-stream` — BE `LiveChatSseHub` + comment heartbeat) and dispatches its
 * named events until the server closes the connection (emitter timeout — callers
 * reconnect) or `handlers.signal` aborts.
 *
 * Uses `fetch` + a `ReadableStream` reader, NOT `EventSource`: the BE authenticates the
 * stream through the same JWT filter chain as every REST call (`Authorization: Bearer`
 * header only, no query-param token), and `EventSource` cannot send headers. The bearer
 * token is read fresh from local storage at call time, so each reconnect picks up a
 * refreshed token. Mirrors `notification/stream.ts` (the proven SSE transport).
 *
 * @param handlers - Event callbacks + abort signal ({@link LiveChatStreamHandlers}).
 * @throws {LiveChatStreamHttpError} when the response is non-2xx (e.g. 401 expired token).
 * @throws DOMException `AbortError` when `handlers.signal` aborts, network errors from `fetch`.
 */
export const openLiveChatStream = async (
    handlers: LiveChatStreamHandlers,
): Promise<void> => {
    const token = LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken) ?? ""
    const response = await fetch(
        `${publicEnv().api.http.replace(/\/$/, "")}/community/live-chat/stream`,
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
        throw new LiveChatStreamHttpError(response.status)
    }

    const parser = createSseParser((event) => {
        // Every named event body is JSON; a malformed payload is swallowed (the REST
        // seed + the next event recover the view) so one bad frame never kills the stream.
        try {
            if (event.event === "message") {
                handlers.onMessage?.(JSON.parse(event.data) as LiveChatMessage)
                return
            }
            if (event.event === "online") {
                handlers.onOnline?.(JSON.parse(event.data) as LiveChatOnline)
                return
            }
            if (event.event === "presence") {
                handlers.onPresence?.(JSON.parse(event.data) as LiveChatPresence)
            }
        } catch {
            // malformed frame — ignore, the stream keeps flowing
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
