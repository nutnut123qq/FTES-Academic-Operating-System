"use client"

import useSWR from "swr"

/** The XP category a learner is ranked by. */
export type LeaderboardCategory = "total" | "challenges" | "reading" | "milestones"

/** All selectable categories (left filter). */
export const LEADERBOARD_CATEGORIES: ReadonlyArray<LeaderboardCategory> = [
    "total",
    "challenges",
    "reading",
    "milestones",
]

/** One ranked learner. */
export interface LeaderboardEntry {
    /** 1-based rank within the selected category. */
    rank: number
    username: string
    displayName: string
    /** Cohort / term label, e.g. "K18 · Fall 2025". */
    cohortLabel: string
    /** XP for the selected category. */
    xp: number
}

/** Per-category ranked list. */
export interface LeaderboardData {
    /** Ranked entries (already sorted by xp desc for the active category). */
    entries: Array<LeaderboardEntry>
    /** Max XP in the list — drives the relative bar widths. */
    maxXp: number
}

const NAMES: Array<{ username: string; displayName: string; cohort: string }> = [
    { username: "minh", displayName: "Lê Minh", cohort: "K18 · Fall 2025" },
    { username: "lan", displayName: "Trần Lan", cohort: "K18 · Fall 2025" },
    { username: "quan", displayName: "Đỗ Quân", cohort: "K17 · Spring 2025" },
    { username: "hoa", displayName: "Phạm Hoa", cohort: "K18 · Fall 2025" },
    { username: "tuan", displayName: "Nguyễn Tuấn", cohort: "K17 · Spring 2025" },
    { username: "mai", displayName: "Vũ Mai", cohort: "K18 · Fall 2025" },
    { username: "khoa", displayName: "Bùi Khoa", cohort: "K16 · Fall 2024" },
    { username: "chi", displayName: "Đặng Chi", cohort: "K17 · Spring 2025" },
    { username: "phong", displayName: "Hồ Phong", cohort: "K18 · Fall 2025" },
]

/** Deterministic per-category XP so ranks shuffle by filter but stay stable. */
const xpFor = (index: number, category: LeaderboardCategory): number => {
    const base = [4200, 3980, 3610, 3200, 2870, 2540, 2110, 1780, 1420]
    const weight: Record<LeaderboardCategory, number> = {
        total: 1,
        challenges: 0.62,
        reading: 0.44,
        milestones: 0.28,
    }
    // Category-specific reshuffle so #1 isn't identical across tabs.
    const jitter = ((index * (category.length + 3)) % 5) * 60
    return Math.round(base[index] * weight[category]) + jitter
}

const fetchLeaderboardMock = async (
    _courseId: string,
    category: LeaderboardCategory,
): Promise<LeaderboardData> => {
    const entries = NAMES.map((person, index) => ({
        username: person.username,
        displayName: person.displayName,
        cohortLabel: person.cohort,
        xp: xpFor(index, category),
    }))
        .sort((a, b) => b.xp - a.xp)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
    const maxXp = entries.length > 0 ? entries[0].xp : 1
    return { entries, maxXp }
}

/** Loads the course leaderboard for one category. Mocked; SWR-shaped for a BE swap. */
export const useQueryLearnLeaderboardSwr = (courseId: string, category: LeaderboardCategory) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["learn-leaderboard", courseId, category],
        () => fetchLeaderboardMock(courseId, category),
    )
    return {
        entries: data?.entries ?? [],
        maxXp: data?.maxXp ?? 1,
        isLoading,
        error,
        mutate,
    }
}
