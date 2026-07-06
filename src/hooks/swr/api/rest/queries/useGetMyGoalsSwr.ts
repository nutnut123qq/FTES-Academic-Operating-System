"use client"

import useSWR from "swr"
import { getMyGoals, type GoalView } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getMyGoals}.
 */
export const useGetMyGoalsSwr = () => {
    const swr = useSWR<Array<GoalView>, Error>(["GET_MY_GOALS_SWR"], () =>
        getMyGoals(),
    )

    return swr
}
