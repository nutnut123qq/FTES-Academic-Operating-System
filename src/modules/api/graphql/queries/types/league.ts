import type { GraphQLResponse } from "../../types"

/** One ranked member of the viewer's weekly-league cohort. */
export interface QueryMyLeagueEntryData {
    /** Opaque global id of the member's user. */
    userGlobalId: string
    /** Member's display username (null when unset). */
    username: string | null
    /** Member's avatar URL (null when unset). */
    avatar: string | null
    /** Flat reward points the member earned this week. */
    weekPoints: number
    /** 1-based rank within the cohort (descending by week points). */
    rank: number
    /**
     * Rank movement vs last week (`lastWeekRank - rank`): >0 climbed N places,
     * <0 dropped, null when there is no last-week baseline.
     */
    rankDelta: number | null
}

/** The viewer's weekly-league standing (tier + cohort board). */
export interface QueryMyLeagueData {
    /** The viewer's current league tier (matches `LeagueTier`: bronze…legend). */
    tier: string
    /** Exclusive end of the current week window (ISO) — the reset deadline. */
    weekEndAt: string
    /** How many top members promote at the next reset. */
    promoteCount: number
    /** How many bottom members demote at the next reset. */
    demoteCount: number
    /** Ranked members of the viewer's cohort (best → worst). */
    entries: Array<QueryMyLeagueEntryData>
}

/** Apollo response shape for the `myLeague` query. */
export interface QueryMyLeagueResponse {
    /** Top-level `myLeague` field wrapping the standard API response. */
    myLeague: GraphQLResponse<QueryMyLeagueData>
}
