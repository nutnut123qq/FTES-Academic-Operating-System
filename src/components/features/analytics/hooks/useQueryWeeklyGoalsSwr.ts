"use client"

import useSWR from "swr"

/** A single weekly goal — progress toward a target for one metric. */
export interface WeeklyGoal {
    /** i18n key under `analytics.overview.goals.labels.*`. */
    key: string
    /** Amount achieved this week. */
    current: number
    /** Target for the week. */
    target: number
}

// ponytail: mock BE — no KPI endpoint yet. Deterministic weekly goals,
// SWR-shaped for a drop-in swap (myWeeklyGoals()) later.
const fetchWeeklyGoalsMock = async (): Promise<Array<WeeklyGoal>> => [
    { key: "lessons", current: 6, target: 10 },
    { key: "studyDays", current: 4, target: 5 },
    { key: "challenges", current: 2, target: 4 },
    { key: "flashcards", current: 45, target: 50 },
]

/** Loads the viewer's weekly goals. Mocked; SWR-shaped. */
export const useQueryWeeklyGoalsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "goals"],
        () => fetchWeeklyGoalsMock(),
    )
    return { goals: data ?? [], isLoading, error, mutate }
}
