"use client"

import useSWR from "swr"

/** Weekly-goal (KPI) key — drives the row icon + label. */
export type KpiKey = "lessons" | "studyDays" | "challenges" | "coding" | "flashcards"

/** A single weekly goal — progress toward a target for one metric. */
export interface WeeklyGoal {
    /** i18n key under `analytics.overview.goals.labels.*`. */
    key: KpiKey
    /** Amount achieved this week. */
    current: number
    /** Target for the week (the learner's custom goal, when set). */
    target: number | null
}

// ponytail: mock BE — no KPI endpoint yet. Deterministic weekly goals; a couple of
// targets left null so the widget's "effective target" default path is exercised.
// SWR-shaped for a drop-in swap (myKpis()) later.
const fetchWeeklyGoalsMock = async (): Promise<Array<WeeklyGoal>> => [
    { key: "lessons", current: 6, target: 10 },
    { key: "studyDays", current: 4, target: 5 },
    { key: "challenges", current: 2, target: null },
    { key: "coding", current: 1, target: 3 },
    { key: "flashcards", current: 45, target: null },
]

/** Loads the viewer's weekly goals. Mocked; SWR-shaped. */
export const useQueryWeeklyGoalsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "goals"],
        () => fetchWeeklyGoalsMock(),
    )
    return { goals: data ?? [], isLoading, error, mutate }
}
