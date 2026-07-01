import type { GraphQLResponse } from "../../types"

/** Platform-wide aggregate counters for the public landing page. */
export interface PlatformStatsData {
    /** Distinct learners enrolled in at least one course. */
    totalLearners: number
    /** Total content units (lessons) across every course. */
    totalLessons: number
    /** Total courses available on the platform. */
    totalCourses: number
    /** Total badges earned by all learners. */
    totalBadgesEarned: number
}

/** Apollo response shape for the public `platformStats` query. */
export interface QueryPlatformStatsResponse {
    /** Top-level `platformStats` field wrapping the standard API response. */
    platformStats: GraphQLResponse<PlatformStatsData>
}
