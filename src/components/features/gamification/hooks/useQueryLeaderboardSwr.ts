"use client"

import useSWR from "swr"
import { queryLeaderboard } from "@/modules/api/graphql/queries/query-leaderboard"
import type { LeaderboardEntryData } from "@/modules/api/graphql/queries/types/leaderboard"
import { useAppSelector } from "@/redux/hooks"

/** A single ranked competitor row on the leaderboard, mapped from the BE `LeaderboardEntry`. */
export interface LeaderboardEntry {
    /** The ranked user's public id (matches `state.user.user.id` for the viewer). */
    id: string
    /** 1-based rank on the board (BE `LeaderboardEntry.rank`). */
    rank: number
    /** Display name — `displayName ?? username`, or an anonymous fallback. */
    name: string
    /** Season XP for this user (BE `LeaderboardEntry.score`). */
    xp: number
    /**
     * Level — the BE leaderboard carries NO per-user level, so this is always
     * undefined; the row hides its level sub-line when absent (never fabricated).
     */
    level?: number
    /** Uppercase initials derived from {@link name} for the avatar tile. */
    avatarInitials: string
}

/** Anonymous fallback name when the BE `PublicUser` has neither displayName nor username. */
const ANONYMOUS_NAME = "Ẩn danh"

/** Two-letter uppercase initials from a display name (first + last word, or first two chars). */
const initialsFrom = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Maps a real BE `LeaderboardEntry` onto the FE row model. `level` is intentionally omitted. */
const toBoardEntry = (entry: LeaderboardEntryData): LeaderboardEntry => {
    const name = entry.user.displayName ?? entry.user.username ?? ANONYMOUS_NAME
    return {
        id: entry.user.id,
        rank: entry.rank,
        name,
        xp: entry.score,
        avatarInitials: initialsFrom(name),
    }
}

/**
 * Loads the global gamification leaderboard from the real BE
 * (`leaderboard(scope: GLOBAL, limit: 20)` — returns the entry list directly, no envelope).
 *
 * The query is auth-only, so it runs only once the viewer is authenticated; guests get an
 * empty board. The board is fed by a per-season Redis ZSET that is empty until XP is awarded
 * in a running season, so `board` is legitimately `[]` today — the shell renders its clean
 * empty-state. `myUserId` (the viewer's public id) lets the shell highlight the viewer's row.
 */
export const useQueryLeaderboardSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const myUserId = useAppSelector((state) => state.user.user?.id ?? null)

    const { data, isLoading, error, mutate } = useSWR(
        authenticated ? ["leaderboard", "GLOBAL"] : null,
        async () => {
            const result = await queryLeaderboard({})
            return (result.data?.leaderboard ?? []).map(toBoardEntry)
        },
    )

    return {
        board: data ?? [],
        /** The viewer's own public id (or `null`) — consumers use it to highlight the self row. */
        myUserId,
        isLoading,
        error,
        mutate,
    }
}
