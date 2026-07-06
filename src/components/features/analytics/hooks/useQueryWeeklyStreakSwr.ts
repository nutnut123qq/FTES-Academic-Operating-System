"use client"

import useSWR from "swr"

/** One cell of the weekly streak strip. */
export interface StreakDay {
    /** ISO date (YYYY-MM-DD). */
    date: string
    /** Whether the learner was active that day. */
    active: boolean
}

/** The weekly streak strip + current/longest streak. */
export interface WeeklyStreak {
    /** Current daily streak (days in a row). */
    streak: number
    /** Longest streak ever reached. */
    longestStreak: number
    /** Exactly 7 cells, oldest → newest (today is last). */
    days: Array<StreakDay>
}

// ponytail: mock BE — no streak endpoint yet. Builds the last 7 days ending today
// deterministically; SWR-shaped for a drop-in swap (myWeeklyStats()) later.
const fetchWeeklyStreakMock = async (): Promise<WeeklyStreak> => {
    // last 7 days ending today; a fixed active pattern (one gap mid-week)
    const activePattern = [true, true, false, true, true, true, false]
    const today = new Date()
    const days: Array<StreakDay> = activePattern.map((active, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (6 - i))
        return { date: d.toISOString().slice(0, 10), active }
    })
    return { streak: 3, longestStreak: 21, days }
}

/** Loads the viewer's weekly streak strip + current/longest streak. Mocked; SWR-shaped. */
export const useQueryWeeklyStreakSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "streak"],
        () => fetchWeeklyStreakMock(),
    )
    return { data, isLoading, error, mutate }
}
