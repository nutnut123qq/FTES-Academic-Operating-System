import type { GraphQLResponse } from "../../types"

/** Variables for the `userWeeklyStats` query. */
export interface QueryUserWeeklyStatsRequest {
    /** Id of the user whose weekly stats to fetch. */
    userId: string
}

/** The slice of a user's weekly stats surfaced on the profile (streak). */
export interface QueryUserWeeklyStatsData {
    /** Consecutive days (up to today) with at least one XP event. */
    streak: number
    /** Longest-ever consecutive-day streak. */
    longestStreak: number
}

/** Apollo response shape for the `userWeeklyStats` query. */
export interface QueryUserWeeklyStatsResponse {
    /** Top-level `userWeeklyStats` field wrapping the standard API response. */
    userWeeklyStats: GraphQLResponse<QueryUserWeeklyStatsData>
}
