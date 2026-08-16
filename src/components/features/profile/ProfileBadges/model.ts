/**
 * Pure helpers shared by every achievement/badge surface on the profile (own
 * profile + public profile). No React, no i18n — so they can be unit-tested
 * directly and reused from both the portfolio card and the catalog dialog.
 */

/**
 * `source` the backend stamps on the achievement rows it writes when a
 * gamification badge is awarded (`ProfileEventConsumer` → `recordSystem`).
 */
export const BADGE_ACHIEVEMENT_SOURCE = "gamification.badge"

/**
 * `"Badge FIRST_LESSON"` — the backend's fallback title when the award event
 * carried no `badgeName`. Rows written before that event gained the field keep
 * this shape forever, so the code has to be recovered on the read path.
 */
const PREFIXED_BADGE_TITLE = /^badge[\s_-]+([a-z0-9]+(?:_[a-z0-9]+)*)$/i

/** A bare backend code used as a title, e.g. `"FIRST_LESSON"` / `"CHALLENGER"`. */
const BARE_BADGE_CODE = /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/

/**
 * Extracts the raw badge code out of a machine-shaped achievement title.
 *
 * @param title - the title exactly as the backend stored it.
 * @returns The code (`"FIRST_LESSON"`), or `null` when the title is already a
 *   human sentence and must be shown verbatim.
 */
export const badgeCodeFromTitle = (title: string | null | undefined): string | null => {
    const trimmed = (title ?? "").trim()
    if (!trimmed) {
        return null
    }
    const prefixed = PREFIXED_BADGE_TITLE.exec(trimmed)
    if (prefixed) {
        return prefixed[1].toUpperCase()
    }
    // A bare code only counts when it actually looks like one: SCREAMING_SNAKE.
    // A one-word human title ("Champion") stays human — requiring either an
    // underscore or a digit keeps it out of this branch.
    if (BARE_BADGE_CODE.test(trimmed) && /[_0-9]/.test(trimmed)) {
        return trimmed
    }
    return null
}

/**
 * Last-resort readable label for a badge code the app has no name for —
 * `"FIRST_LESSON"` → `"First Lesson"`. Never returns the raw code.
 */
export const humanizeBadgeCode = (code: string): string =>
    code
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")

/**
 * Formats an award timestamp for display.
 *
 * The backend sends either a full ISO-8601 instant (`awardedAt`) or a plain
 * `yyyy-mm-dd` (`achievedAt`), and quite often `null` — a missing date must read
 * as "no date", never as the string `"Invalid Date"` that `Date#toLocaleDateString`
 * happily prints. Anything unparseable degrades the same way.
 *
 * @param value - the backend timestamp, possibly absent or malformed.
 * @param locale - active locale for the date format.
 * @returns The localized date, or `null` when there is no usable date.
 */
export const toEarnedDateLabel = (
    value: string | null | undefined,
    locale: string,
): string | null => {
    const trimmed = (value ?? "").trim()
    if (!trimmed) {
        return null
    }
    // A date-only string is parsed as UTC midnight by `new Date`, which renders as
    // the PREVIOUS day west of Greenwich. Pinning it to local midnight keeps the
    // label on the day the backend meant.
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00` : trimmed
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) {
        return null
    }
    return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
}
