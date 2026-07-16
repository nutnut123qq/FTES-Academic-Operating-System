"use client"

import { useMemo } from "react"
import { useGetMyGoalsSwr } from "@/hooks/swr/api/rest/queries/useGetMyGoalsSwr"

/** A single weekly goal row — the metric and the target the learner set. */
export interface WeeklyGoalRow {
    /** Backend metric (`XP` | `LESSONS` | `MINUTES`) — drives the row icon/label. */
    metric: string
    /** The learner's weekly target for this metric. */
    target: number
}

/**
 * Analytics-overview view of the learner's WEEKLY goals, mapped from the live
 * goals endpoint (`useGetMyGoalsSwr` → `GET /gamification/me/goals`). Only goals
 * with `period === "WEEKLY"` surface here; a metric the learner has not set is
 * simply absent (the widget renders no row for it). The backend returns no
 * per-goal progress, so this exposes the target only — the widget never
 * fabricates a "current" value or completion percentage.
 */
export const useQueryWeeklyGoalsSwr = () => {
    const { data, isLoading, error, mutate } = useGetMyGoalsSwr()

    const goals = useMemo<Array<WeeklyGoalRow>>(
        () =>
            (data ?? [])
                .filter((goal) => goal.period === "WEEKLY")
                .map((goal) => ({ metric: goal.metric, target: goal.target })),
        [data],
    )

    return { goals, isLoading, error, mutate }
}
