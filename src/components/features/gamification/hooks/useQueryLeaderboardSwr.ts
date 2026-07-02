"use client"

import useSWR from "swr"

/** The current user's progression snapshot shown in the stat cards. */
export interface LeaderboardMe {
    /** Total experience points. */
    xp: number
    /** Current level. */
    level: number
    /** Consecutive-day streak. */
    streak: number
    /** Rank on the board (1-based). */
    rank: number
}

/** A single ranked competitor row on the leaderboard. */
export interface LeaderboardEntry {
    id: string
    name: string
    xp: number
    level: number
    /** Uppercase initials used for the avatar tile. */
    avatarInitials: string
}

/** A badge in the achievements row (earned vs locked). */
export interface LeaderboardBadge {
    id: string
    name: string
    earned: boolean
}

interface LeaderboardData {
    me: LeaderboardMe
    board: Array<LeaderboardEntry>
    badges: Array<LeaderboardBadge>
}

// ponytail: mock BE — no gamification endpoint yet. Deterministic snapshot so the
// leaderboard shell renders. `me.id` matches a `board` row so the shell can
// highlight the current user. Wire a real GraphQL query (leaderboard()) when the
// contract lands; the hook API stays.
const fetchLeaderboardMock = async (): Promise<LeaderboardData> => ({
    me: { xp: 4820, level: 12, streak: 7, rank: 3 },
    board: [
        { id: "u1", name: "Trần Thu Hà", xp: 6210, level: 15, avatarInitials: "TH" },
        { id: "u2", name: "Phạm Gia Bảo", xp: 5480, level: 13, avatarInitials: "PB" },
        { id: "me", name: "Bạn", xp: 4820, level: 12, avatarInitials: "BN" },
        { id: "u4", name: "Vũ Ngọc Ánh", xp: 4310, level: 11, avatarInitials: "VA" },
        { id: "u5", name: "Đỗ Văn E", xp: 3990, level: 11, avatarInitials: "DE" },
        { id: "u6", name: "Vũ Thị F", xp: 3540, level: 10, avatarInitials: "VF" },
        { id: "u7", name: "Lê Minh Quân", xp: 3120, level: 9, avatarInitials: "LQ" },
        { id: "u8", name: "Hoàng Thị G", xp: 2760, level: 8, avatarInitials: "HG" },
    ],
    badges: [
        { id: "b1", name: "First Steps", earned: true },
        { id: "b2", name: "Week Streak", earned: true },
        { id: "b3", name: "Quiz Master", earned: true },
        { id: "b4", name: "Top 3", earned: false },
        { id: "b5", name: "Century Club", earned: false },
    ],
})

/** ID of the current user's row in `board` (mirrors `me`). */
export const CURRENT_USER_ID = "me"

/** Loads the leaderboard + progression snapshot. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryLeaderboardSwr = () => {
    const { data, isLoading, error } = useSWR(["leaderboard"], () => fetchLeaderboardMock())
    return {
        me: data?.me,
        board: data?.board ?? [],
        badges: data?.badges ?? [],
        isLoading,
        error,
    }
}
