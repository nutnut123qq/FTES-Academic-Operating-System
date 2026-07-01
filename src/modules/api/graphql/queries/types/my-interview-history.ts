import type { GraphQLResponse } from "../../types"

/** The viewer's aggregated mock-interview history (optionally scoped to a deck). */
export interface QueryMyInterviewHistoryData {
    /** Total graded answers in scope. */
    totalAnswered: number
    /** Mean score (0–100) across those answers, one decimal. */
    averageScore: number
    /** Best (highest) score across those answers; 0 when none. */
    bestScore: number
    /** How many answers passed. */
    passCount: number
    /** How many answers were borderline. */
    borderlineCount: number
    /** How many answers failed. */
    failCount: number
    /** Most frequent tags among answers not passed — the topics to revisit. */
    weakTags: Array<string>
    /** ISO timestamp of the most recent attempt, or null when none. */
    lastAttemptAt: string | null
}

/** Apollo response shape for the `myInterviewHistory` query. */
export interface QueryMyInterviewHistoryResponse {
    /** Top-level `myInterviewHistory` field wrapping the standard API response. */
    myInterviewHistory: GraphQLResponse<QueryMyInterviewHistoryData>
}
