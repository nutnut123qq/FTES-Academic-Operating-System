/**
 * Format a like/comment count for compact display in the engagement bar.
 *
 * Counts below 1000 render verbatim; 1000 and above collapse to locale-aware
 * compact notation with at most one fraction digit. Locale data drives the
 * suffix — e.g. vi: `1234 → "1,2 N"` (rendered "1,2k"-style), en: `1234 → "1.2K"`.
 *
 * @param count - the raw count to format (non-negative integer).
 * @param locale - the active app locale ("vi" | "en" or any BCP-47 tag).
 * @returns the display string for the count.
 */
export const formatCompactCount = (count: number, locale: string): string => {
    if (count < 1000) {
        return new Intl.NumberFormat(locale).format(count)
    }

    return new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(count)
}
