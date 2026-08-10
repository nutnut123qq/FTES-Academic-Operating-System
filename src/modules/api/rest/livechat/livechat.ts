import { restRequest } from "@/modules/api/rest/client"
import type { LiveChatMessage, LiveChatOnline, LiveChatReplyTo } from "./types"

/** Base path for the community live-chat REST + SSE controllers. */
const BASE = "/community/live-chat"

/** Default number of ring-buffer messages the panel seeds with on open. */
export const LIVE_CHAT_RECENT_LIMIT = 30

/** Max length of a reply-quote snippet (matches the BE defensive cap). */
export const LIVE_CHAT_REPLY_SNIPPET_MAX = 200

/** Trims + caps a reply snippet so the ephemeral quote stays small on the wire. */
export const capReplySnippet = (text: string): string => {
    const trimmed = text.trim()
    return trimmed.length > LIVE_CHAT_REPLY_SNIPPET_MAX
        ? trimmed.slice(0, LIVE_CHAT_REPLY_SNIPPET_MAX)
        : trimmed
}

/**
 * Normalizes a raw `replyTo` quote (from the send echo / recent seed) — or returns
 * `null` when the message is not a reply / the payload is malformed. Defensive: the
 * quote is FE-provided + never DB-backed, so a partial shape must never render.
 */
const toReplyTo = (raw: LiveChatReplyTo | null | undefined): LiveChatReplyTo | null => {
    if (!raw || !raw.messageId) {
        return null
    }
    return {
        messageId: raw.messageId,
        displayName: raw.displayName ?? "",
        snippet: capReplySnippet(raw.snippet ?? ""),
    }
}

/**
 * Normalizes a raw backend message onto {@link LiveChatMessage}, defaulting the
 * optional author fields so the UI never renders `undefined`. Kept private — the
 * REST surface only ever hands back normalized rows.
 */
const toLiveChatMessage = (raw: LiveChatMessage): LiveChatMessage => ({
    id: raw.id,
    userId: raw.userId,
    displayName: raw.displayName,
    avatar: raw.avatar ?? null,
    text: raw.text,
    ts: raw.ts,
    replyTo: toReplyTo(raw.replyTo),
})

/**
 * Posts a message to the community room (`community-global`). The backend trims +
 * length-caps + rate-limits, builds the {@link LiveChatMessage} (UUIDv7 id, author
 * snapshot, `ts`), LPUSHes it onto the Redis ring buffer and publishes it on the
 * pub/sub fan-out — the sender's own SSE will echo the same id (deduped client-side).
 * NEVER persisted to a database.
 *
 * An optional `replyTo` quote is passed through verbatim (ephemeral — the BE echoes
 * it back on the fan-out, it is never looked up or persisted).
 *
 * `POST /api/v1/community/live-chat/messages`
 */
export const sendLiveChatMessage = async (input: {
    text: string
    replyTo?: LiveChatReplyTo | null
}): Promise<LiveChatMessage> => {
    const replyTo = toReplyTo(input.replyTo)
    const message = await restRequest<LiveChatMessage>({
        method: "POST",
        url: `${BASE}/messages`,
        data: replyTo ? { text: input.text, replyTo } : { text: input.text },
        authenticated: true,
    })
    return toLiveChatMessage(message)
}

/**
 * Reads the most recent messages from the Redis ring buffer, oldest-first (so the
 * chat thread reads top→bottom like every other message list). Used to SEED the
 * panel on open; the SSE stream delivers everything after.
 *
 * `GET /api/v1/community/live-chat/recent?limit=30`
 */
export const getLiveChatRecent = async (
    limit: number = LIVE_CHAT_RECENT_LIMIT,
): Promise<Array<LiveChatMessage>> => {
    const rows = await restRequest<Array<LiveChatMessage>>({
        method: "GET",
        url: `${BASE}/recent?limit=${encodeURIComponent(String(limit))}`,
        authenticated: true,
    })
    // Consistent ascending order regardless of ring-buffer read direction.
    return (rows ?? [])
        .map(toLiveChatMessage)
        .sort((a, b) => a.ts - b.ts)
}

/**
 * Returns the current online-presence counts (fallback for when the SSE `online`
 * event has not arrived yet, e.g. the very first paint).
 *
 * `GET /api/v1/community/live-chat/online`
 */
export const getLiveChatOnline = async (): Promise<LiveChatOnline> => {
    const online = await restRequest<LiveChatOnline>({
        method: "GET",
        url: `${BASE}/online`,
        authenticated: true,
    })
    return {
        roomOnline: online?.roomOnline ?? 0,
        globalOnline: online?.globalOnline ?? 0,
    }
}

/**
 * Refreshes the viewer's presence (ZADD room + global, score = now). The client
 * pings this every 25–30s while the chat panel is open; the backend prunes anyone
 * whose last heartbeat is older than ~90s.
 *
 * `POST /api/v1/community/live-chat/heartbeat`
 */
export const sendLiveChatHeartbeat = async (): Promise<void> => {
    await restRequest<void>({
        method: "POST",
        url: `${BASE}/heartbeat`,
        authenticated: true,
    })
}
