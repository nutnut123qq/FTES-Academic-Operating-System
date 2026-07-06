"use client"

import useSWR from "swr"

/** The XP category a learner is ranked by (mirrors StarCI's course leaderboard). */
export type LeaderboardCategory = "total" | "challenges" | "reading" | "milestones"

/** All selectable categories (left rail order). */
export const LEADERBOARD_CATEGORIES: ReadonlyArray<LeaderboardCategory> = [
    "total",
    "challenges",
    "reading",
    "milestones",
]

/** XP weighting per read lesson / milestone (mirrors StarCI READING_XP / MILESTONE_XP). */
export const READING_XP = 3
export const MILESTONE_XP = 10

/** Segment colours for the XP-composition bar (challenge / reading / milestone). */
export const CATEGORY_COLOR: Record<"challenges" | "reading" | "milestones", string> = {
    challenges: "#D85A30",
    reading: "#378ADD",
    milestones: "#1D9E75",
}

/** One ranked learner (server shape — client re-ranks per category). */
export interface LeaderboardEntry {
    /** Stable row key (enrollment). */
    enrollmentId: string
    /** User id — matches the viewer to highlight their row. */
    userId: string
    username: string
    displayName: string
    /** Avatar URL or null (UserAvatar falls back to a generated one). */
    avatar: string | null
    /** Cohort / term label, e.g. "K18 · Fall 2025". */
    cohortLabel: string
    /** Canonical total XP (the "total" category metric). */
    totalXp: number
    /** Challenge XP (1:1 with grader score). */
    totalScore: number
    /** Lessons read (× READING_XP for the reading category). */
    lessonsRead: number
    /** Milestones completed (× MILESTONE_XP for the milestones category). */
    milestoneProgress: number
}

/** The viewer's own snapshot (drives the per-category XP shown in the rail). */
export interface LeaderboardMyRank {
    totalXp: number
    totalScore: number
    lessonsRead: number
    milestoneProgress: number
}

/** The full leaderboard payload (§4, mock until BE lands). */
export interface LeaderboardData {
    entries: Array<LeaderboardEntry>
    myRank: LeaderboardMyRank | null
    /** ISO timestamp the board was computed (shown as "updated at"). */
    computedAt: string
}

/** XP a learner scores in a given category (sort + display metric). */
export const categoryEntryXp = (entry: LeaderboardEntry, key: LeaderboardCategory): number => {
    switch (key) {
    case "challenges":
        return entry.totalScore
    case "reading":
        return entry.lessonsRead * READING_XP
    case "milestones":
        return entry.milestoneProgress * MILESTONE_XP
    case "total":
    default:
        return entry.totalXp
    }
}

/** The viewer's XP in a given category (from myRank snapshot). */
export const categoryMyXp = (myRank: LeaderboardMyRank | null, key: LeaderboardCategory): number => {
    if (!myRank) {
        return 0
    }
    switch (key) {
    case "challenges":
        return myRank.totalScore
    case "reading":
        return myRank.lessonsRead * READING_XP
    case "milestones":
        return myRank.milestoneProgress * MILESTONE_XP
    case "total":
    default:
        return myRank.totalXp
    }
}

/** One ranked row (entry + 1-based display rank for the active category). */
export interface RankedLeaderboardEntry {
    entry: LeaderboardEntry
    displayRank: number
}

/** Client-side re-rank by the active category (stable, descending). */
export const rankEntriesByCategory = (
    entries: Array<LeaderboardEntry>,
    key: LeaderboardCategory,
): Array<RankedLeaderboardEntry> =>
    [...entries]
        .sort((a, b) => categoryEntryXp(b, key) - categoryEntryXp(a, key))
        .map((entry, index) => ({ entry, displayRank: index + 1 }))

const NAMES: Array<{ username: string; displayName: string; cohort: string; avatar: string | null }> = [
    { username: "minh", displayName: "Lê Minh", cohort: "K18 · Fall 2025", avatar: null },
    { username: "lan", displayName: "Trần Lan", cohort: "K18 · Fall 2025", avatar: null },
    { username: "quan", displayName: "Đỗ Quân", cohort: "K17 · Spring 2025", avatar: null },
    { username: "hoa", displayName: "Phạm Hoa", cohort: "K18 · Fall 2025", avatar: null },
    { username: "tuan", displayName: "Nguyễn Tuấn", cohort: "K17 · Spring 2025", avatar: null },
    { username: "mai", displayName: "Vũ Mai", cohort: "K18 · Fall 2025", avatar: null },
    { username: "khoa", displayName: "Bùi Khoa", cohort: "K16 · Fall 2024", avatar: null },
    { username: "chi", displayName: "Đặng Chi", cohort: "K17 · Spring 2025", avatar: null },
    { username: "phong", displayName: "Hồ Phong", cohort: "K18 · Fall 2025", avatar: null },
]

/** Deterministic multi-metric XP so categories reshuffle but stay stable. */
const buildEntry = (index: number): LeaderboardEntry => {
    const totalScore = 1400 - index * 120 + ((index * 7) % 5) * 30
    const lessonsRead = 84 - index * 7 + ((index * 3) % 4) * 5
    const milestoneProgress = 18 - index * 2 + (index % 3)
    const person = NAMES[index]
    return {
        enrollmentId: `enr-${person.username}`,
        userId: `user-${person.username}`,
        username: person.username,
        displayName: person.displayName,
        avatar: person.avatar,
        cohortLabel: person.cohort,
        totalScore,
        lessonsRead,
        milestoneProgress,
        totalXp: totalScore + lessonsRead * READING_XP + milestoneProgress * MILESTONE_XP,
    }
}

const fetchLeaderboardMock = async (_courseId: string): Promise<LeaderboardData> => {
    const entries = NAMES.map((_, index) => buildEntry(index))
    // The signed-in viewer is seeded as the 4th learner so "You" highlights render.
    const me = entries[3]
    return {
        entries,
        myRank: {
            totalXp: me.totalXp,
            totalScore: me.totalScore,
            lessonsRead: me.lessonsRead,
            milestoneProgress: me.milestoneProgress,
        },
        computedAt: new Date().toISOString(),
    }
}

/**
 * Loads the course leaderboard (one payload; the board re-ranks per category
 * client-side, mirroring StarCI). Mocked; SWR-shaped for a BE swap.
 *
 * The mock viewer id is `user-hoa` (the 4th learner) so the "You" ring / chip
 * render in the podium + table.
 */
export const VIEWER_USER_ID = "user-hoa"

export const useQueryLearnLeaderboardSwr = (courseId: string) => {
    const { data, isLoading, isValidating, error, mutate } = useSWR(
        ["learn-leaderboard", courseId],
        () => fetchLeaderboardMock(courseId),
    )
    return {
        data,
        entries: data?.entries ?? [],
        myRank: data?.myRank ?? null,
        computedAt: data?.computedAt,
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
