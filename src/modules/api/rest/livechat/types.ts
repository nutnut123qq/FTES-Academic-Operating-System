/**
 * Request/response DTOs for the community live-chat REST + SSE endpoints
 * (`/api/v1/community/live-chat`, module `livechat`).
 *
 * EPHEMERAL by design — the backend keeps everything in Redis (ring buffer +
 * presence ZSETs + pub/sub fan-out), never a database. Mirrors the cross-repo
 * contract pinned in `docs/SPEC-community-livechat-2026-08-04.md` §4.
 */

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
