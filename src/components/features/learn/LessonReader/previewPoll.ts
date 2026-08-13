/**
 * Poll cadence for the YouTube player's preview gate.
 *
 * The IFrame API fires no `seeking` event, so a scrub past the preview limit is only
 * noticed on the next poll — and that gap is paid content playing for free. The
 * self-hosted `<video>` clamps on the native `seeking` event and leaks nothing; a poll
 * cannot match that, it can only narrow the window. While a preview limit is active we
 * tick four times a second (~250ms of exposure instead of a full second); with no limit
 * there is nothing to leak, so the cheaper one-second cadence stands and the player keeps
 * costing one `getCurrentTime()` per second on ordinary playback.
 */
export const GATED_POLL_MS = 250

/** Cadence when the whole video is unlocked — nothing to clamp, so stay cheap. */
export const FREE_POLL_MS = 1000

/**
 * Poll cadence for a player whose preview window is `previewSeconds` (0 = no limit).
 *
 * @param previewSeconds - Seconds of free preview; 0 or less means fully unlocked.
 */
export const pollIntervalMs = (previewSeconds: number): number =>
    previewSeconds > 0 ? GATED_POLL_MS : FREE_POLL_MS

/**
 * Whether playback ran past the preview window and must be pushed back.
 *
 * @param currentSeconds - Playhead position.
 * @param previewSeconds - Seconds of free preview; 0 or less means fully unlocked.
 */
export const isPastLimit = (currentSeconds: number, previewSeconds: number): boolean =>
    previewSeconds > 0 && currentSeconds > previewSeconds
