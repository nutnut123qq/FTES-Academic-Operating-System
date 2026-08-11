"use client"

import { useMemo } from "react"
import { useQueryLeaderboardSwr } from "@/components/features/gamification/hooks/useQueryLeaderboardSwr"
import type { LeaderboardEntry } from "@/components/features/gamification/hooks/useQueryLeaderboardSwr"

/** How many leaders the dashboard card shows (the BE board itself returns up to 20). */
export const DASHBOARD_TOP_LEARNERS_LIMIT = 5

/**
 * Dashboard COMMUNITY view of the global gamification board — a pure derivation of
 * {@link useQueryLeaderboardSwr} (`leaderboard(scope: GLOBAL, limit: 20)`), so the card
 * shares that hook's SWR cache instead of issuing a second request.
 *
 * Derives only what the card renders: the top slice, and the viewer's own row when it
 * is present on the fetched board. The backend returns no "my rank" field and the board
 * is capped at 20 entries, so a viewer ranked below that cap has NO rank data — this
 * exposes `standing: null` rather than guessing a position, and the card hides its
 * standing header instead of showing a fabricated one. Per-user level is likewise absent
 * from the backend entry and is never synthesised here.
 *
 * The board is fed by a per-season Redis ZSET that stays empty until XP is awarded in a
 * running season, so `isEmpty` is a legitimate resting state, not a failure.
 */
export const useQueryDashboardCommunityBoardSwr = () => {
    const { board, myUserId, isLoading, error, mutate } = useQueryLeaderboardSwr()

    const leaders = useMemo<Array<LeaderboardEntry>>(
        () => board.slice(0, DASHBOARD_TOP_LEARNERS_LIMIT),
        [board],
    )

    // the viewer's own row, only when the fetched (capped) board actually contains it
    const standing = useMemo<LeaderboardEntry | null>(
        () => (myUserId ? board.find((entry) => entry.id === myUserId) ?? null : null),
        [board, myUserId],
    )

    return {
        leaders,
        standing,
        /** The viewer's own public id (or `null`) — drives the self-row highlight. */
        myUserId,
        /** True once loading resolves with no entries at all (unseeded season). */
        isEmpty: board.length === 0,
        isLoading,
        error,
        mutate,
    }
}
