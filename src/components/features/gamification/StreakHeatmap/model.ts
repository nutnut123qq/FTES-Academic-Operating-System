/**
 * Pure heatmap model for the streak activity calendar.
 *
 * The backend (`GET /gamification/me/activity-days`) returns a SPARSE list of
 * `{ date, xp }` rows keyed by the Vietnam calendar day. The heatmap must render
 * a dense `weeks × 7` grid ending on today's Vietnam day, shading each cell by an
 * XP intensity tier. These helpers own the window fill + tier arithmetic so they
 * can be unit-tested without rendering.
 */

/** One heatmap cell: a Vietnam-day ISO date and the XP earned that day. */
export interface HeatmapCell {
    /** ISO date, `yyyy-mm-dd` (Vietnam day). */
    date: string
    /** XP earned that day (0 for days with no activity). */
    xp: number
}

/** How many weeks of activity the streak heatmap shows by default. */
export const HEATMAP_WEEKS = 12

/**
 * Cell fill per XP intensity tier (index = {@link xpLevel}). Theme-aware
 * brand-pink ramp via the `--heat-*` tokens (globals.css): tier 0 = empty track,
 * 1→3 = rising XP. Mirrors the `ContributionCalendarView` heat scale.
 */
export const XP_LEVEL_CLASS = [
    "bg-[var(--heat-0)]",
    "bg-[var(--heat-2)]",
    "bg-[var(--heat-3)]",
    "bg-[var(--heat-4)]",
]

/**
 * Maps a day's XP to an intensity tier (0–3) for the cell colour. Fixed buckets
 * (not relative to a per-user max) keep the scale stable across viewers:
 * `0` none · `1` 1–19 · `2` 20–49 · `3` 50+.
 *
 * @param xp - XP earned that day.
 * @returns The intensity bucket index (0–3).
 */
export const xpLevel = (xp: number): number => {
    if (xp <= 0) return 0
    if (xp < 20) return 1
    if (xp < 50) return 2
    return 3
}

/**
 * Today's ISO date (`yyyy-mm-dd`) in the Vietnam day (UTC+7), matching how the
 * backend keys activity days. Using the wall-clock Vietnam date (not the local
 * browser date) keeps the "today" cell aligned with the server rows regardless
 * of the viewer's own timezone.
 */
export const vnTodayIso = (): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())

/**
 * ISO date `offset` days from `iso`, computed on a fixed UTC-noon anchor so it
 * never drifts across a day boundary (Vietnam observes no DST).
 *
 * @param iso - Base ISO date, `yyyy-mm-dd`.
 * @param offset - Day delta (negative = earlier).
 * @returns The shifted ISO date, `yyyy-mm-dd`.
 */
export const shiftIso = (iso: string, offset: number): string => {
    const [y, m, d] = iso.split("-").map(Number)
    const anchor = new Date(Date.UTC(y, m - 1, d, 12))
    anchor.setUTCDate(anchor.getUTCDate() + offset)
    return anchor.toISOString().slice(0, 10)
}

/**
 * Build the dense, ordered (oldest → newest) heatmap cells for the visible
 * window. The sparse `days` list is indexed by date; every date in the
 * `weeks × 7` window ending on today's Vietnam day gets a cell, defaulting to
 * `xp: 0` when the backend returned no row for it.
 *
 * @param days - Sparse activity rows from the backend (any order).
 * @param weeks - Window size in weeks (default {@link HEATMAP_WEEKS}).
 * @returns `weeks × 7` cells, oldest first.
 */
export const buildHeatmapCells = (
    days: ReadonlyArray<HeatmapCell>,
    weeks = HEATMAP_WEEKS,
): Array<HeatmapCell> => {
    const xpByDate = new Map(days.map((day) => [day.date, day.xp]))
    const total = weeks * 7
    const today = vnTodayIso()
    const cells: Array<HeatmapCell> = []
    for (let i = total - 1; i >= 0; i -= 1) {
        const date = shiftIso(today, -i)
        cells.push({ date, xp: xpByDate.get(date) ?? 0 })
    }
    return cells
}
