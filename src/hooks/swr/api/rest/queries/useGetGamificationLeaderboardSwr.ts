"use client"

import useSWR from "swr"
import {
    getGamificationLeaderboard,
    type GamificationLeaderboardView,
} from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getGamificationLeaderboard}.
 */
export const useGetGamificationLeaderboardSwr = (params?: {
    scope?: string
    season?: string | null
    limit?: number
}) => {
    const swr = useSWR<GamificationLeaderboardView, Error>(
        [
            "GET_GAMIFICATION_LEADERBOARD_SWR",
            params?.scope,
            params?.season,
            params?.limit,
        ],
        () => getGamificationLeaderboard(params),
    )

    return swr
}
