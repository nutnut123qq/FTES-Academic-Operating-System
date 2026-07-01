import type { GraphQLResponse } from "../../types"

/** Variables for the `userXp` query. */
export interface QueryUserXpRequest {
    /** Id of the user whose XP breakdown to fetch. */
    userId: string
}

/**
 * The per-source XP breakdown for a user, derived from the `xp_histories`
 * ledger (grouped by source) plus the two materialized balance columns. Every
 * XP field is a non-negative integer (0 when the user has earned none from that
 * source). One source of truth for every "score" number on the profile.
 */
export interface QueryUserXpData {
    /** XP earned from challenge passes (ledger SUM, source = challenge). */
    challengeXp: number
    /** XP earned from passing milestone tasks (ledger SUM, source = milestone). */
    milestoneXp: number
    /** XP earned from solving coding-practice problems (ledger SUM, source = coding). */
    codingXp: number
    /** XP earned from reading lessons (ledger SUM, source = lessonRead). */
    lessonXp: number
    /** Total XP across all sources (= `users.total_points`); the global progress number. */
    totalPoints: number
    /** Spendable flat reward Points balance (= `users.reward_points`); the reward currency. */
    rewardPoints: number
}

/** Apollo response shape for the `userXp` query. */
export interface QueryUserXpResponse {
    /** Top-level `userXp` field wrapping the standard API response. */
    userXp: GraphQLResponse<QueryUserXpData | null>
}
