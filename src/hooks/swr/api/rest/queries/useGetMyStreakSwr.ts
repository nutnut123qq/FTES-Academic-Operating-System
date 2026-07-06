"use client"

import useSWR from "swr"
import { getMyStreak, type StreakView } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getMyStreak}.
 */
export const useGetMyStreakSwr = () => {
    const swr = useSWR<StreakView, Error>(["GET_MY_STREAK_SWR"], () =>
        getMyStreak(),
    )

    return swr
}
