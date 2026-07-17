"use client"

import useSWR from "swr"
import { getMyStreak, type StreakView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link getMyStreak} (`GET /api/v1/gamification/me/streak`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired (no 401
 * + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks the quest-board change wires into the streak chip / navbar.
 */
export const useGetMyStreakSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<StreakView, Error>(
        authenticated ? ["GET_MY_STREAK_SWR"] : null,
        () => getMyStreak(),
    )

    return swr
}
