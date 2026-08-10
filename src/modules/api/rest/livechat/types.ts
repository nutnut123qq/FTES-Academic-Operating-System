/**
 * Request/response DTOs for the community live-chat REST + SSE endpoints
 * (`/api/v1/community/live-chat`, module `livechat`).
 *
 * EPHEMERAL by design — the backend keeps everything in Redis (ring buffer +
 * presence ZSETs + pub/sub fan-out), never a database. Mirrors the cross-repo
 * contract pinned in `docs/SPEC-community-livechat-2026-08-04.md` §4.
 */

/**
 * A lightweight quote of the message a new message is replying to. EPHEMERAL and
 * FE-provided — the backend never looks it up, it just echoes the snapshot the sender
 * sends (so it survives the SSE fan-out to every viewer). The `snippet` is trimmed +
 * capped (~200 chars) client-side; the BE re-caps defensively.
 */
export interface LiveChatReplyTo {
    /** Id of the message being replied to (matches a {@link LiveChatMessage.id}). */
    messageId: string
    /** Replied-to author's display name at reply time (snapshot). */
    displayName: string
    /** Short plain-text excerpt of the replied-to message body (trimmed, ~200 chars). */
    snippet: string
}

/**
 * One live-chat message (SSE `message` event + the `POST /messages` / `GET /recent`
 * payloads). `displayName`/`avatar` are snapshotted onto the message so the UI never
 * has to JOIN a profile to render an author.
 */
export interface LiveChatMessage {
    /** Server message id (UUIDv7 — monotonic, so it also sorts by creation). */
    id: string
    /** Author's user id — drives `fromMe` (vs `state.user.user?.id`) + presence dedupe. */
    userId: string
    /** Author's display name at send time; falls back to a generic label when absent. */
    displayName: string
    /** Author's avatar URL at send time; `null` → the seeded fallback avatar. */
    avatar: string | null
    /** Message body (plain text; rendered through MarkdownContent, capped BE-side ~2KB). */
    text: string
    /** Creation timestamp in epoch milliseconds (matches the presence ZSET `lastSeenEpochMs`). */
    ts: number
    /** Optional quote of the message this one replies to (ephemeral, echoed as-sent). */
    replyTo?: LiveChatReplyTo | null
}

/**
 * Online-presence counts (SSE `online` event + `GET /online` fallback). Counted by
 * distinct `userId` — one user with many tabs counts once. For roomId v1 =
 * `community-global` the room IS the whole site, so the two counts coincide; both are
 * kept so a future multi-room split needs no contract change.
 */
export interface LiveChatOnline {
    /** Distinct users online in the current room (`community-global`). */
    roomOnline: number
    /** Distinct users online across the whole site. */
    globalOnline: number
}
