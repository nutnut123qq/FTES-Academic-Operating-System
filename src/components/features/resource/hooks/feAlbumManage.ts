/**
 * Pure helpers behind FE-album management (`/resources/{id}/images*`).
 *
 * Two contracts of that endpoint family are easy to get wrong and are pinned here so
 * they can be unit-tested away from React:
 *
 * 1. **`PUT /images/order` wants a COMPLETE permutation.** A partial list is a `400`,
 *    so a "move one picture" gesture must still ship every id of the album.
 * 2. **The upload endpoint is rate limited** (10/min, 60/hour per viewer). A bulk add of
 *    up to 200 pictures therefore has to pace itself instead of firing everything at
 *    once and collecting `RESOURCE_RATE_LIMITED` 429s.
 */

/** Server-side rate limit on `POST /api/v1/resources/{id}/images`, per viewer. */
export const FE_IMAGE_UPLOAD_RATE = {
    /** Requests allowed inside any rolling 60 s window. */
    perMinute: 10,
    /** Requests allowed inside any rolling 60 min window. */
    perHour: 60,
} as const

/** Rolling windows the limit is measured over, in ms. */
const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/**
 * Slack added to a computed wait so a slightly-fast client clock cannot land the
 * request on the very edge of the server's window and still get a 429.
 */
const WINDOW_MARGIN_MS = 750

/**
 * Backoff schedule applied when the server rate-limits anyway (`429` /
 * `RESOURCE_RATE_LIMITED`). One entry per retry of the SAME picture; once it is
 * exhausted the run stops rather than hammering on.
 */
export const FE_IMAGE_RATE_LIMIT_BACKOFF_MS: ReadonlyArray<number> = [
    15_000, 30_000, 60_000,
]

/**
 * How long to wait before starting the NEXT upload, given when the previous ones
 * started.
 *
 * Both windows are checked; the stricter one wins. Small adds (≤ 10 pictures) come back
 * `0` and run at full speed — only a bulk add ever waits.
 *
 * @param startedAt - epoch ms of every upload already started this run, ascending.
 * @param now - current epoch ms.
 * @returns ms to sleep (`0` when a slot is free right now).
 */
export const nextFeImageUploadDelayMs = (
    startedAt: ReadonlyArray<number>,
    now: number,
): number => {
    const waitFor = (windowMs: number, limit: number): number => {
        const inWindow = startedAt.filter((at) => at > now - windowMs)
        if (inWindow.length < limit) {
            return 0
        }
        // The oldest request that still occupies a slot; a slot frees when it ages out.
        const oldest = inWindow[inWindow.length - limit]
        return Math.max(0, oldest + windowMs + WINDOW_MARGIN_MS - now)
    }
    return Math.max(
        waitFor(MINUTE_MS, FE_IMAGE_UPLOAD_RATE.perMinute),
        waitFor(HOUR_MS, FE_IMAGE_UPLOAD_RATE.perHour),
    )
}

/**
 * Moves one image inside the album order and returns the COMPLETE new id list.
 *
 * Out-of-range indices are a no-op (the caller's up/down buttons are disabled at the
 * ends, this is the belt-and-braces half).
 *
 * @param imageIds - the album's ids in their current order.
 * @param from - index of the picture being moved.
 * @param to - index it should end up at.
 * @returns a full permutation of `imageIds`, ready for `PUT /images/order`.
 */
export const moveFeAlbumImage = (
    imageIds: ReadonlyArray<string>,
    from: number,
    to: number,
): Array<string> => {
    if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= imageIds.length ||
        to >= imageIds.length
    ) {
        return [...imageIds]
    }
    const next = [...imageIds]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
}

/**
 * Guard for contract (1): `candidate` must contain exactly the ids of `current`, once
 * each. Used as an assertion right before the write so a UI bug surfaces as a blocked
 * request instead of a `400` the user has to decode.
 *
 * @param candidate - the order about to be sent.
 * @param current - the album's ids as the server last reported them.
 */
export const isFeAlbumPermutation = (
    candidate: ReadonlyArray<string>,
    current: ReadonlyArray<string>,
): boolean => {
    if (candidate.length !== current.length) {
        return false
    }
    const seen = new Set(candidate)
    return seen.size === candidate.length && current.every((id) => seen.has(id))
}
