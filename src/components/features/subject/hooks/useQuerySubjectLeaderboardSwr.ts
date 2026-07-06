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

/** ~700ms so the loading skeleton is observable. */
const MOCK_DELAY_MS = 700

// ponytail: mock BE — no leaderboard endpoint yet. Deterministic sample, already
// sorted by totalXp descending (the canonical rank order).
const LEADERBOARD_MOCK: ReadonlyArray<SubjectLeaderboardEntry> = [
    { id: "u1", username: "Minh Nguyễn", totalXp: 428, challengeXp: 240, readingXp: 108, milestoneXp: 80 },
    { id: "u2", username: "Lan Phạm", totalXp: 396, challengeXp: 180, readingXp: 126, milestoneXp: 90 },
    { id: "u3", username: "Huy Trần", totalXp: 351, challengeXp: 210, readingXp: 81, milestoneXp: 60, isViewer: true },
    { id: "u4", username: "Thảo Lê", totalXp: 318, challengeXp: 150, readingXp: 108, milestoneXp: 60 },
    { id: "u5", username: "Đức Vũ", totalXp: 287, challengeXp: 120, readingXp: 117, milestoneXp: 50 },
    { id: "u6", username: "Mai Hoàng", totalXp: 254, challengeXp: 110, readingXp: 94, milestoneXp: 50 },
    { id: "u7", username: "Quân Đỗ", totalXp: 219, challengeXp: 90, readingXp: 89, milestoneXp: 40 },
    { id: "u8", username: "Hà Bùi", totalXp: 186, challengeXp: 80, readingXp: 76, milestoneXp: 30 },
]

/**
 * Loads a subject's XP leaderboard. Mocked; SWR-shaped for a drop-in BE swap. BE
 * assumption (logged): a real BE returns the subject's ranked learners with their
 * per-category XP. Rows arrive pre-sorted by `totalXp` descending.
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useQuerySubjectLeaderboardSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-leaderboard", subjectId],
        async (): Promise<Array<SubjectLeaderboardEntry>> => {
            await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
            return [...LEADERBOARD_MOCK]
        },
    )
    return { entries: data ?? [], isLoading, error, mutate }
}
