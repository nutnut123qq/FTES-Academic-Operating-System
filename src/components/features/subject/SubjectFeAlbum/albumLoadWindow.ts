/**
 * How many album pictures are actually fetched at a time.
 *
 * An exam album holds up to 200 photos of scanned paper (a Final Exam runs 60–100+ questions) —
 * hundreds of megabytes if the page pulls them all on mount, and the viewer only ever looks at
 * one at a time. So the album keeps a sliding WINDOW of pictures it is willing to fetch: the
 * first {@link ALBUM_INITIAL_LOAD}, then another {@link ALBUM_LOAD_BATCH} whenever the reader
 * gets close to the edge of what is loaded.
 *
 * The window is a PREFIX bound and monotone, which is what keeps it honest at 200: reading
 * forward page by page never lets it run more than
 * `ALBUM_LOAD_LOOKAHEAD + ALBUM_LOAD_BATCH` (7) pictures ahead of the reader, so an album of
 * 200 still starts at 5 and grows a batch at a time regardless of the cap. A prefix cannot
 * express a hole, so it would over-fetch if the reader could LAND far down the album in one
 * move — everything before the target would be "loaded" at once. Today nothing can: the viewer
 * pages ±1 (carets, ←/→) and a new album resets to page 1, so the prefix shape costs nothing.
 * That changes the day a jump-to-page control is added, and it is the deliberate trade for
 * never re-fetching on the way back.
 *
 * Only the window bound lives here (a pure function, hence testable); the component decides what
 * to do with it. What it decides today: the page being READ always loads, and the viewer
 * prefetches the NEXT picture only while that one falls inside the bound. No other page is ever
 * handed a `src`, so at most TWO files are ever asked for — and that, not this bound, is what
 * keeps a 200-scan album off the network. The bound is a ceiling the ±1 paging never actually
 * reaches: widening at `ALBUM_LOAD_LOOKAHEAD` from the edge always runs ahead of the reader,
 * so the prefetch has never once been refused. Like the `while` below, it is here for the day
 * an index can land further away than one step.
 */

/** Pictures fetched up front. */
export const ALBUM_INITIAL_LOAD = 5

/** Pictures added each time the reader approaches the edge of the window. */
export const ALBUM_LOAD_BATCH = 5

/**
 * How close to the edge the reader must get before the next batch starts loading. `2` means the
 * 4th of the first 5 triggers it — one picture of runway, so the next file is already in flight
 * before it is on screen.
 */
export const ALBUM_LOAD_LOOKAHEAD = 2

/**
 * Widen the window if the reader has come within {@link ALBUM_LOAD_LOOKAHEAD} of its edge.
 *
 * Monotonic on purpose: paging BACK never shrinks it, because throwing away pictures the reader
 * already downloaded would make going back re-fetch them.
 *
 * @param loaded - Pictures currently allowed to load.
 * @param index - Zero-based position the reader is on.
 * @param total - Pictures in the album.
 * @returns The new bound, never past `total` and never below `loaded`.
 */
export const nextAlbumLoadCount = (loaded: number, index: number, total: number): number => {
    if (total <= 0) {
        return 0
    }
    let next = Math.max(loaded, Math.min(ALBUM_INITIAL_LOAD, total))
    // `while`, not a single step — a SAFETY NET, not a live path: the only navigation the
    // viewer offers moves ±1, so one iteration is all that ever runs. It stays a loop so that
    // an index arriving from further away (a jump-to-page control, a deep link into page 40)
    // still comes back with the target inside the window instead of one batch short of it.
    while (index >= next - ALBUM_LOAD_LOOKAHEAD && next < total) {
        next += ALBUM_LOAD_BATCH
    }
    return Math.min(next, total)
}
