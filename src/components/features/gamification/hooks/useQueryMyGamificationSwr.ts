"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/redux/hooks"
import { useGetMyProgressionSwr } from "@/hooks/swr/api/rest/queries/useGetMyProgressionSwr"
import { useGetMyStreakSwr } from "@/hooks/swr/api/rest/queries/useGetMyStreakSwr"
import { useGetMyActivityDaysSwr } from "@/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr"
import { useGetMyBadgesSwr } from "@/hooks/swr/api/rest/queries/useGetMyBadgesSwr"
import { tierFromXp } from "../leaderboardTiers"
import { useQueryLeaderboardSwr } from "./useQueryLeaderboardSwr"

/** One earned badge in the viewer's gamification snapshot. */
export interface MyGamificationBadge {
    id: string
    /** Backend badge `code` — also the i18n key under `gamification.milestones.<badgeKey>.name`. */
    badgeKey: string
    /** ISO date (yyyy-mm-dd) the badge was earned, from the BE `awardedAt` timestamp. */
    earnedDate: string
}

/** The viewer's full gamification snapshot — the single source for every surface. */
export interface MyGamification {
    xp: number
    level: number
    /**
     * XP progress toward the next level. `current` is the viewer's TOTAL XP and
     * `nextThreshold` is the total XP the next level requires (`nextLevelXp`), so
     * `nextThreshold - current` is the XP still needed to level up. The backend
     * exposes only the next-level threshold (not the current level's floor), so
     * the bar is drawn against total XP rather than reset per level — no level
     * curve is fabricated on the client.
     */
    levelProgress: { current: number; nextThreshold: number }
    /** Current streak plus the active ISO dates (days with XP) for the heatmap. */
    streak: { current: number; days: Array<string> }
    /** Leaderboard position + league (rank-tier key, `gamification.tiers.<league>`). */
    rank: { position: number; league: string }
    badges: Array<MyGamificationBadge>
}

/**
 * Shared hook for the CURRENT USER's gamification snapshot (XP, level, level
 * progress, streak + heatmap days, rank/league, badges). The account dropdown,
 * the profile identity card and the profile Progress tab all consume THIS hook
 * so their numbers never disagree.
 *
 * Composes the live REST gamification hooks (change `quest-board-streak-live`):
 * `useGetMyProgressionSwr` (xp / level / next-level threshold), `useGetMyStreakSwr`
 * (current streak), `useGetMyActivityDaysSwr` (active-day list for the heatmap),
 * `useGetMyBadgesSwr` (awarded badges) and the real leaderboard board (rank
 * position). Progression is the primary source — the snapshot resolves once it
 * loads; the streak / activity / badge slices fill in as their own polls land
 * (progression + activity poll on a 60s interval, so the "live" numbers never
 * freeze under the global no-focus-revalidate SwrProvider). Guests get no data.
 * SWR-shaped (`{ data, isLoading, error }`) — the interface is unchanged so the
 * dropdown / profile call-sites keep working after the mock-engine removal.
 */
export const useQueryMyGamificationSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const progressionSwr = useGetMyProgressionSwr()
    const streakSwr = useGetMyStreakSwr()
    const activitySwr = useGetMyActivityDaysSwr()
    const badgesSwr = useGetMyBadgesSwr()
    // Rank rides the real-BE leaderboard board (an independent async source) so the
    // position matches the /leaderboard ordering; XP / level / streak / badges come
    // from the /me/* endpoints and render even when the board is empty (unseeded) —
    // the viewer is simply reported as unranked (position 0) then.
    const { board, myUserId } = useQueryLeaderboardSwr()

    const progression = progressionSwr.data
    const streak = streakSwr.data
    const activity = activitySwr.data
    const badges = badgesSwr.data

    const data = useMemo<MyGamification | undefined>(() => {
        // Progression is the primary slice — without it there is no XP/level to show.
        if (!authenticated || !progression) return undefined
        const totalXp = progression.totalXp
        // BE exposes the NEXT level's threshold; at the max level it is null → clamp
        // to the current total so the bar reads full and "XP to next" is zero.
        const nextThreshold = progression.nextLevelXp ?? totalXp
        return {
            xp: totalXp,
            level: progression.level,
            levelProgress: {
                current: totalXp,
                nextThreshold,
            },
            streak: {
                current: streak?.currentStreak ?? 0,
                days: (activity?.days ?? [])
                    .filter((day) => day.xp > 0)
                    .map((day) => day.date),
            },
            rank: {
                position: board.findIndex((entry) => entry.id === myUserId) + 1,
                league: tierFromXp(totalXp).tier.key,
            },
            badges: (badges ?? []).map((badge) => ({
                id: badge.code,
                badgeKey: badge.code,
                // `awardedAt` is a full ISO timestamp; the profile renders a plain
                // yyyy-mm-dd date, so take the date part.
                earnedDate: badge.awardedAt.slice(0, 10),
            })),
        }
    }, [authenticated, progression, streak, activity, badges, board, myUserId])

    return {
        data,
        // Loading only matters while progression (the primary slice) is still in
        // flight with nothing to show; guests never load.
        isLoading: authenticated ? progressionSwr.isLoading && !progression : false,
        error: authenticated ? progressionSwr.error : undefined,
    }
}
