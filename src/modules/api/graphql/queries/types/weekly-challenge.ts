import type { GraphQLResponse } from "../../types"

/** One entry in the weekly-challenge leaderboard (a user who passed). */
export interface QueryWeeklyChallengeLeaderboardEntryData {
    /** Handle of the user who passed (profile route + @mention). */
    username: string
    /** Uploaded avatar URL, or null (a generated default is shown instead). */
    avatar: string | null
    /** ISO timestamp the user first passed the challenge. */
    passedAt: string
}

/** The currently featured weekly challenge event, or null when none is active. */
export interface QueryWeeklyChallengeData {
    /** Opaque global id of the featured challenge (passed to the route resolver). */
    challengeGlobalId: string
    /** Title of the featured challenge. */
    title: string
    /** ISO timestamp the event window closes (drives the countdown). */
    weekEndAt: string
    /** Whether the viewer has already passed the challenge this week. */
    viewerPassed: boolean
    /** Total number of users who have passed so far. */
    passedCount: number
    /** Top finishers (already capped server-side), newest passers ordered first. */
    leaderboard: Array<QueryWeeklyChallengeLeaderboardEntryData>
}

/** Apollo response shape for the `weeklyChallenge` query. */
export interface QueryWeeklyChallengeResponse {
    /** Top-level `weeklyChallenge` field wrapping the standard API response. */
    weeklyChallenge: GraphQLResponse<QueryWeeklyChallengeData | null>
}
