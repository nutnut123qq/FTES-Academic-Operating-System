"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/redux/hooks"
import { DayStatus, useGamificationEngine } from "../engine"
import { STREAK_MILESTONES, tierFromXp, xpForLevel } from "../rules"
import { useQueryLeaderboardSwr } from "./useQueryLeaderboardSwr"

/** One earned badge in the viewer's gamification snapshot. */
export interface MyGamificationBadge {
    id: string
    /** i18n key under `gamification.milestones.<badgeKey>.name` — consumer localizes. */
    badgeKey: string
    /** ISO date (yyyy-mm-dd) the badge was earned (mock, derived from the streak). */
    earnedDate: string
}

/** The viewer's full gamification snapshot — the single source for every surface. */
export interface MyGamification {
    xp: number
    level: number
    /** XP progress within the current level toward the next one. */
    levelProgress: { current: number; nextThreshold: number }
    /** Current streak plus the active ISO dates for the heatmap. */
    streak: { current: number; days: Array<string> }
    /** Leaderboard position + league (rank-tier key, `gamification.tiers.<league>`). */
    rank: { position: number; league: string }
    badges: Array<MyGamificationBadge>
}

/**
 * Shared mock hook for the CURRENT USER's gamification snapshot (XP, level,
 * level progress, streak + heatmap days, rank/league, badges). The account
 * dropdown, the profile identity card and the profile Progress tab all consume
 * THIS hook so their numbers never disagree.
 *
 * Live values (xp / level / streak / heatmap) come from the shared mock engine
 * store — the same source the leaderboard and streak popover read — so every
 * surface updates in lockstep; rank position comes from the leaderboard mock
 * board (deterministic: 4820 XP / level 12 / streak 7 / rank 3). Guests get no
 * data. SWR-shaped (`{ data, isLoading, error }`) for a drop-in BE swap.
 */
export const useQueryMyGamificationSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { state, level, heatmap } = useGamificationEngine()
    // Rank rides the real-BE leaderboard board (the only async part) so the position
    // matches the /leaderboard ordering. xp/level/streak/badges come from the engine
    // and are independent of the board, so the snapshot renders even when the board is
    // empty (unseeded) — the viewer is simply reported as unranked (position 0) then.
    const { board, isLoading, error, myUserId } = useQueryLeaderboardSwr()

    const data = useMemo<MyGamification | undefined>(() => {
        if (!authenticated) return undefined
        const levelFloor = xpForLevel(level)
        /** Mock earned date: the day the streak first hit `days` (relative to today). */
        const earnedDate = (days: number): string => {
            const date = new Date()
            date.setDate(date.getDate() - Math.max(0, state.streak - days))
            const y = date.getFullYear()
            const m = `${date.getMonth() + 1}`.padStart(2, "0")
            const d = `${date.getDate()}`.padStart(2, "0")
            return `${y}-${m}-${d}`
        }
        return {
            xp: state.xp,
            level,
            levelProgress: {
                current: state.xp - levelFloor,
                nextThreshold: xpForLevel(level + 1) - levelFloor,
            },
            streak: {
                current: state.streak,
                days: heatmap
                    .filter((day) => day.status === DayStatus.Active)
                    .map((day) => day.date),
            },
            rank: {
                position: board.findIndex((entry) => entry.id === myUserId) + 1,
                league: tierFromXp(state.xp).tier.key,
            },
            badges: STREAK_MILESTONES.filter((milestone) =>
                state.claimedMilestones.includes(milestone.days),
            ).map((milestone) => ({
                id: `streak-${milestone.days}`,
                badgeKey: milestone.badgeKey,
                earnedDate: earnedDate(milestone.days),
            })),
        }
    }, [authenticated, board, myUserId, state, level, heatmap])

    return {
        data,
        isLoading: authenticated ? isLoading : false,
        error: authenticated ? error : undefined,
    }
}
