"use client"

import useSWR from "swr"
import { getMyGoals, type GoalView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link getMyGoals} (`GET /api/v1/gamification/me/goals`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired (no 401
 * + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks (GoalsCard + analytics WeeklyGoals read this).
 */
export const useGetMyGoalsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<Array<GoalView>, Error>(
        authenticated ? ["GET_MY_GOALS_SWR"] : null,
        () => getMyGoals(),
    )

    return swr
}
