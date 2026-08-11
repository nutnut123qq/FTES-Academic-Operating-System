/**
 * Formats a lesson's video length for the compact meta slots (content-map row, course
 * outline row, section summary).
 *
 * The BE only knows a duration for videos whose length was actually measured — a large
 * share of lessons carry none — so an unknown/zero value returns `""` and every caller
 * renders NOTHING rather than a misleading "0 phút". Under a minute rounds UP to 1 so a
 * real 40-second clip never reads as zero.
 *
 * @param seconds - `LessonView.durationSeconds`; null/undefined/≤0 all mean "unknown".
 * @param t - the `next-intl` translator scoped so `key` resolves (see {@link DURATION_KEY}).
 */
export const formatLessonDuration = (
    seconds: number | null | undefined,
    t: (key: string, values: Record<string, number>) => string,
): string => {
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
        return ""
    }
    const minutes = Math.max(1, Math.round(seconds / 60))
    return t(DURATION_KEY, { count: minutes })
}

/** i18n key {@link formatLessonDuration} resolves — `{count} min` / `{count} phút`. */
export const DURATION_KEY = "courseSystem.browse.minutes"

/**
 * Sums the known durations of a section's lessons. Lessons with an unknown duration are
 * simply skipped, so a partially-measured section still shows the time it can account for
 * (0 → the caller hides the label). Never reconstruct the COURSE total this way: the BE's
 * `totalDurationSeconds` applies its own coverage gate and is the only authority for it.
 */
export const sumLessonDurations = (
    lessons: Array<{ durationSeconds?: number | null }>,
): number =>
    lessons.reduce(
        (total, lesson) =>
            typeof lesson.durationSeconds === "number" && lesson.durationSeconds > 0
                ? total + lesson.durationSeconds
                : total,
        0,
    )
