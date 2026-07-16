"use client"

import useSWR from "swr"
import { getLeaderboard } from "@/modules/api/rest/community"
import type { LeaderboardEntryResponse } from "@/modules/api/rest/community"

/** A contributor's reputation summary (mapped from the BE leaderboard row). */
export interface Contributor {
    /** The user's id (the BE leaderboard is non-PII: id + public tallies only). */
    id: string
    /**
     * Display name, or null when unresolved. The BE deliberately returns no PII and
     * exposes no profile-by-userId lookup (profiles key on username), so the name
     * stays null and the row hides its name line — same policy as the trending list,
     * which omits the author rather than surfacing a raw UUID.
     */
    name: string | null
    /** Upvotes received (BE `upvotesReceived`). */
    upvotes: number
    /** Downvotes — the BE tracks no downvote tally, fixed 0. */
    downvotes: number
    /** Accepted answers (BE `acceptedAnswers`). */
    accepted: number
    /** Contributor score computed by the BE (floored at 0 server-side). */
    score: number
    /** Absolute rank across pages (BE `rank`). */
    rank: number
}

/** How many leaderboard rows to load (BE `leaderboard?size=`). */
const LEADERBOARD_SIZE = 20

/** Map a BE leaderboard row to the board's row contract. */
const toContributor = (entry: LeaderboardEntryResponse): Contributor => ({
    id: entry.userId,
    name: null,
    upvotes: entry.upvotesReceived,
    downvotes: 0,
    accepted: entry.acceptedAnswers,
    score: entry.score,
    rank: entry.rank,
})

/**
 * Loads top contributors from the real BE `GET /api/v1/community/leaderboard`
 * (first page, sorted score desc — requires `community.leaderboard.read`, granted
 * to STUDENT and up).
 */
export const useQueryContributorsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["contributors"], async () => {
        const page = await getLeaderboard({ page: 0, size: LEADERBOARD_SIZE })
        return page.items.map(toContributor)
    })
    return { contributors: data ?? [], isLoading, error, mutate }
}
