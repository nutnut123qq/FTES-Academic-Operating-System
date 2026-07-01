import type { CourseLeaderboardEntry, CourseLeaderboardMyRank } from "@/modules/api/graphql/queries/types/course-leaderboard"

/** XP awarded per lesson read (mirrors backend leaderboard scoring). */
export const READING_XP = 3
/** XP awarded per passed milestone task (mirrors backend leaderboard scoring). */
export const MILESTONE_XP = 10

/** The XP categories the leaderboard can rank/sort by. `total` is the canonical rank. */
export type LeaderboardCategoryKey = "total" | "challenge" | "reading" | "milestone"

/** Categories the learner can select. */
const SELECTABLE_CATEGORIES = new Set<LeaderboardCategoryKey>([
    "total",
    "challenge",
    "reading",
    "milestone",
])

/** Read the selected category from a URL param, falling back to `total`. */
export const parseCategoryParam = (param: string | null | undefined): LeaderboardCategoryKey =>
    param && SELECTABLE_CATEGORIES.has(param as LeaderboardCategoryKey)
        ? (param as LeaderboardCategoryKey)
        : "total"

/**
 * Per-category accent colour (data-driven, no semantic token) — shared by the rail
 * icon and the row segment bar so a category reads the same colour everywhere.
 */
export const CATEGORY_COLOR: Record<"challenge" | "reading" | "milestone", string> = {
    challenge: "#D85A30",
    reading: "#378ADD",
    milestone: "#1D9E75",
}

/** XP an entry contributes in a given category (the value we rank/sort by). */
export const categoryEntryXp = (entry: CourseLeaderboardEntry, key: LeaderboardCategoryKey): number => {
    switch (key) {
    case "challenge":
        return entry.totalScore
    case "reading":
        return entry.lessonsRead * READING_XP
    case "milestone":
        return entry.milestoneProgress * MILESTONE_XP
    case "total":
    default:
        return entry.totalXp
    }
}

/** The viewer's XP in a category, from their `myRank` snapshot (0 when no activity). */
export const categoryMyXp = (myRank: CourseLeaderboardMyRank | null, key: LeaderboardCategoryKey): number => {
    if (!myRank) {
        return 0
    }
    switch (key) {
    case "challenge":
        return myRank.totalScore
    case "reading":
        return myRank.lessonsRead * READING_XP
    case "milestone":
        return myRank.milestoneProgress * MILESTONE_XP
    case "total":
    default:
        return myRank.totalXp
    }
}

/** An entry paired with its 1-based rank under the currently-selected category. */
export interface RankedLeaderboardEntry {
    /** The underlying leaderboard row. */
    entry: CourseLeaderboardEntry
    /** 1-based position after sorting by the selected category. */
    displayRank: number
}

/**
 * Sort entries by a category's XP (descending) and reassign 1-based ranks. JS sort
 * is stable, so ties keep the server order (which, for `total`, is the canonical
 * `totalXp DESC, earliest-enrollment` order). Client-side — no extra fetch.
 */
export const rankEntriesByCategory = (
    entries: Array<CourseLeaderboardEntry>,
    key: LeaderboardCategoryKey,
): Array<RankedLeaderboardEntry> =>
    [...entries]
        .sort((a, b) => categoryEntryXp(b, key) - categoryEntryXp(a, key))
        .map((entry, index) => ({ entry, displayRank: index + 1 }))
