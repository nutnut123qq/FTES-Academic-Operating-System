import type { GraphQLResponse } from "../../types"

/** One ranked row on the course leaderboard (mirrors backend `LeaderboardEntryData`). */
export interface CourseLeaderboardEntry {
    /** 1-based rank within the returned window. */
    rank: number
    /** Enrollment id this row belongs to. */
    enrollmentId: string
    /** User id (used to highlight the viewer's own row). */
    userId: string
    /** Username snapshot for display (nullable). */
    username: string | null
    /** Avatar URL snapshot (nullable). */
    avatar: string | null
    /** Total challenge score across the course. */
    totalScore: number
    /** Number of fully-completed challenges. */
    completedChallenges: number
    /** Number of lessons the user marked read in the course. */
    lessonsRead: number
    /** Number of milestone tasks passed in the course. */
    milestoneProgress: number
    /** Total XP (challenge + reads×3 + milestone×10) — the rank metric. */
    totalXp: number
}

/** The viewer's own standing, even when outside the top window (mirrors `LeaderboardMyRankData`). */
export interface CourseLeaderboardMyRank {
    /** 1-based rank of the viewer across the whole course. */
    rank: number
    /** Viewer's total challenge score. */
    totalScore: number
    /** Viewer's fully-completed challenge count. */
    completedChallenges: number
    /** Viewer's lessons-read count in the course. */
    lessonsRead: number
    /** Viewer's passed milestone-task count in the course. */
    milestoneProgress: number
    /** Viewer's total XP. */
    totalXp: number
}

/** Variables for `courseLeaderboard(request)`. */
export interface CourseLeaderboardRequest {
    /** Course whose leaderboard to fetch. */
    courseId: string
    /** Max ranked rows to return (server caps the window). */
    limit?: number
}

/** Payload inside `courseLeaderboard.data`. */
export interface QueryCourseLeaderboardPayload {
    /** Course this leaderboard belongs to. */
    courseId: string
    /** Total challenges in the course. */
    totalChallenges: number
    /** Maximum possible total challenge score for the course. */
    maxPossibleScore: number
    /** Top rows sorted by totalXp DESC, then earliest enrollment. */
    entries: Array<CourseLeaderboardEntry>
    /** The viewer's rank — null when the viewer has no activity on this course. */
    myRank: CourseLeaderboardMyRank | null
    /** When this snapshot was computed (ISO string). */
    computedAt: string
}

/** Response for the `courseLeaderboard` query. */
export interface QueryCourseLeaderboardResponse {
    /** Top-level `courseLeaderboard` field. */
    courseLeaderboard: GraphQLResponse<QueryCourseLeaderboardPayload>
}
