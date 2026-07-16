import type { Locale } from "next-intl"
import { pathConfig } from "@/resources/path"
import type { QuestItemView } from "@/modules/api/rest/gamification"

/**
 * Known quest codes seeded by the backend change `gamification-quest-coin-engine`
 * (seed V213). Codes NOT in this union are still rendered — the client degrades
 * gracefully and simply shows no CTA (see {@link questCtaHref}).
 */
export type KnownQuestCode =
    | "DAILY_LOGIN"
    | "LESSON_COMPLETE"
    | "COMMUNITY_POST"
    | "COMMUNITY_COMMENT"
    | "LIKE_3_POSTS"
    | "STREAK_7_BONUS"

/**
 * Derived, presentation-ready view of a {@link QuestItemView} — the pure numbers
 * the card renders, computed once so the component body stays declarative and the
 * arithmetic (progress ceiling, done state) is unit-testable in isolation.
 */
export interface QuestProgress {
    /** Total events needed to exhaust the day: `targetCount × dailyLimit` (≥ 1). */
    total: number
    /** Events counted so far, clamped into `[0, total]`. */
    current: number
    /** `current / total` as a whole percentage in `[0, 100]`. */
    percent: number
    /** True once every claim for the day is used (`completedCount ≥ dailyLimit`). */
    isDone: boolean
}

/**
 * Compute the progress numbers for one quest card.
 *
 * The bar tracks raw events toward the day's ceiling (`targetCount × dailyLimit`),
 * clamped so an over-counted backend value never pushes the bar past 100%. A quest
 * with a non-positive target/limit (malformed / admin edit) falls back to a ceiling
 * of 1 so the meter never divides by zero.
 *
 * @param quest - the raw quest row from `GET /gamification/me/quests`
 * @returns the derived {@link QuestProgress}
 */
export const questProgress = (quest: QuestItemView): QuestProgress => {
    const rawTotal = quest.targetCount * quest.dailyLimit
    const total = rawTotal > 0 ? rawTotal : 1
    const current = Math.max(0, Math.min(quest.eventCount, total))
    const percent = Math.round((current / total) * 100)
    const isDone = quest.dailyLimit > 0 && quest.completedCount >= quest.dailyLimit
    return { total, current, percent, isDone }
}

/**
 * Map a quest code to the in-app surface where the user earns it.
 *
 * Returns a locale-prefixed href for the codes the client knows, or `null` for
 * codes with no user action (`DAILY_LOGIN` auto-completes on sign-in) and for any
 * unmapped code (admin-created quests) — the caller renders those cards without a
 * CTA rather than failing.
 *
 * @param code - the quest `code` from the backend
 * @param locale - active locale for the path prefix
 * @returns an href string, or `null` when the quest has no CTA
 */
export const questCtaHref = (code: string, locale: Locale): string | null => {
    const path = pathConfig().locale(locale)
    switch (code as KnownQuestCode) {
    case "LESSON_COMPLETE":
        return path.course().mine().build()
    case "COMMUNITY_POST":
        // The community feature owns `/community/new` as a child route; there is
        // no dedicated builder, so derive it from the feed base (same approach
        // LeaderboardShell uses for `/leaderboard/guide`).
        return `${path.community().build()}/new`
    case "COMMUNITY_COMMENT":
    case "LIKE_3_POSTS":
        return path.community().build()
    case "STREAK_7_BONUS":
        return path.profile().progress().build()
    case "DAILY_LOGIN":
        // Auto-completes from the login event alone — nowhere to send the user.
        return null
    default:
        return null
    }
}
