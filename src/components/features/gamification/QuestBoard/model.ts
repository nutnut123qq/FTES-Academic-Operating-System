import { pathConfig } from "@/resources/path"
import type { QuestItemView } from "@/modules/api/rest/gamification"

/**
 * Known quest codes seeded by the backend change `gamification-quest-coin-engine`
 * (seed V221 — `V221__gamification_quest_seed_and_rulekey_fix.sql`). Codes NOT in
 * this union are still rendered — the client degrades
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
 * The EXP one claim of this quest pays, or `null` when there is nothing to show.
 *
 * Three input states collapse to two outputs, and the collapse is the whole point:
 *  - a number (INCLUDING `0`) → that number, rendered verbatim. `0` is a real
 *    answer — a rule may pay zero — so it is shown, not hidden.
 *  - `null` (backend says "no EXP") or MISSING (backend predates `rewardXp`) →
 *    `null`, and the caller renders NO chip.
 *
 * The distinction `null` ≠ `0` is why this is not written `quest.rewardXp ?? 0`:
 * that would print "+0 EXP/lượt" on every card served by a backend that has not
 * deployed the field yet — a precise-looking number the backend never said.
 *
 * Non-finite values (a malformed payload sending `NaN`) are treated as absent for
 * the same reason: better no chip than "+NaN EXP".
 *
 * @param quest - the raw quest row from `GET /gamification/me/quests`
 * @returns the per-claim EXP, or `null` when nothing may be rendered
 */
export const questRewardXp = (quest: QuestItemView): number | null =>
    typeof quest.rewardXp === "number" && Number.isFinite(quest.rewardXp) ? quest.rewardXp : null

/**
 * Map a quest code to the in-app surface where the user earns it.
 *
 * Returns a LOCALE-LESS href for the codes the client knows, or `null` for codes
 * with no user action (`DAILY_LOGIN` auto-completes on sign-in) and for any
 * unmapped code (admin-created quests) — the caller renders those cards without a
 * CTA rather than failing.
 *
 * The href carries NO locale prefix on purpose: the only consumer renders it
 * through the locale-aware `Link` of `@/i18n/navigation`, which prepends the
 * active locale itself. Prefixing here too produced `/vi/vi/...` (a real 404).
 * See the contract docblock in `src/i18n/navigation.ts`.
 *
 * @param code - the quest `code` from the backend
 * @returns an href string without a locale prefix, or `null` when the quest has no CTA
 */
export const questCtaHref = (code: string): string | null => {
    const path = pathConfig().locale()
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
