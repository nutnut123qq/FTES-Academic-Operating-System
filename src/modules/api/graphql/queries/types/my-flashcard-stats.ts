import type { GraphQLResponse } from "../../types"

/** The viewer's flashcard study stats (streak / retention / totals). */
export interface QueryMyFlashcardStatsData {
    /** Consecutive review days (VN) up to today/yesterday; 0 if the run lapsed. */
    currentStreak: number
    /** Longest-ever run of consecutive review days (VN). */
    longestStreak: number
    /** Percent of reviews recalled (grade ≥ 2), 0–100. */
    retentionRate: number
    /** Total reviews ever graded. */
    totalReviewed: number
    /** ISO timestamp of the most recent review, or null when never reviewed. */
    lastReviewedAt: string | null
}

/** Apollo response shape for the `myFlashcardStats` query. */
export interface QueryMyFlashcardStatsResponse {
    /** Top-level `myFlashcardStats` field wrapping the standard API response. */
    myFlashcardStats: GraphQLResponse<QueryMyFlashcardStatsData>
}
