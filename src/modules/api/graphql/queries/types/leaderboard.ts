/**
 * Apollo response shapes for the real BE `leaderboard` query.
 *
 * Mirrors the backend GraphQL schema (schema.graphqls):
 *   leaderboard(scope: LeaderboardScope!, subjectId: ID, limit: Int = 20): [LeaderboardEntry!]!
 *   type LeaderboardEntry { rank: Int!, user: PublicUser!, score: Int! }
 *   type PublicUser { id: ID!, username: String, displayName: String, avatarUrl: String }
 *
 * The resolver returns the ranked list DIRECTLY — there is NO
 * `{ success, message, error, data }` envelope on this query. The board is fed by a
 * per-season Redis ZSET (`ftes:gamification:leaderboard:{scope}:{season}`) that is
 * ZINCRBY-ed as users earn XP, so it is EMPTY until a season is running with awarded XP.
 */

/** Scope of the leaderboard (GraphQL `LeaderboardScope`). GLOBAL/WEEKLY read the season-global board. */
export enum LeaderboardScope {
    Global = "GLOBAL",
    Subject = "SUBJECT",
    Weekly = "WEEKLY",
}

/** Public, non-PII identity of a ranked user (GraphQL `PublicUser`; all but `id` nullable). */
export interface LeaderboardEntryUser {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
}

/** One ranked entry on the board (GraphQL `LeaderboardEntry`). `score` is the user's season XP. */
export interface LeaderboardEntryData {
    rank: number
    score: number
    user: LeaderboardEntryUser
}

/** Apollo response shape for the `leaderboard` query. */
export interface QueryLeaderboardResponse {
    /** Top-level `leaderboard` field — the entry list, returned directly (no envelope). */
    leaderboard: Array<LeaderboardEntryData>
}
