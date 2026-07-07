"use client"

import useSWR from "swr"

/**
 * One learner's ranked standing in a subject — a compact port of StarCI's
 * `CourseLeaderboardEntry`. `totalXp` is the canonical rank value; the three
 * sub-scores (challenge · reading · milestone) drive the stacked XP-composition
 * bar, exactly as StarCI's `LeaderboardTable` does.
 */
export interface SubjectLeaderboardEntry {
    id: string
    username: string
    /** Optional uploaded avatar; falls back to a generated face via `UserAvatar`. */
    avatar?: string | null
    /** Canonical rank value (challenge + reading + milestone). */
    totalXp: number
    /** XP from coding challenges. */
    challengeXp: number
    /** XP from reading lessons. */
    readingXp: number
    /** XP from milestones/tasks. */
    milestoneXp: number
    /** Marks the viewer's own row (accent + "Bạn" chip). */
    isViewer?: boolean
}

/** Per-category accent colours for the XP-composition bar (mirrors StarCI). */
export const LEADERBOARD_CATEGORY_COLOR = {
    challenge: "#D85A30",
    reading: "#378ADD",
    milestone: "#1D9E75",
} as const

/**
 * Loads a subject's XP leaderboard.
 *
 * The BE subject statistics endpoint exposes a `leaderboard` array of
 * `{userId, score, rank}` only — it carries neither a display name nor the
 * per-category XP breakdown (challenge/reading/milestone) this stacked-bar UI
 * needs, and it is empty for the seeded subjects. Rather than fabricate ranked
 * learners, the hook returns empty and the leaderboard renders its empty state.
 * The shape is unchanged so a richer BE leaderboard is a drop-in later.
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useQuerySubjectLeaderboardSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-leaderboard", subjectId],
        async (): Promise<Array<SubjectLeaderboardEntry>> => [],
    )
    return { entries: data ?? [], isLoading, error, mutate }
}
