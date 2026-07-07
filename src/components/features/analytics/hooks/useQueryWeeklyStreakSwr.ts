"use client"

import useSWR from "swr"
import { getMyStreak } from "@/modules/api/rest/gamification"

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

/** YYYY-MM-DD in local time for a Date. */
const isoDay = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

/**
 * Derives the last-7-days active strip from the BE streak facts. The BE reports
 * only currentStreak + lastActiveDate (no per-day log), but a streak of N ending
 * at lastActiveDate means those N consecutive days were active — so we light the
 * cells from lastActiveDate backwards, clamped to the visible 7-day window.
 */
const buildDays = (currentStreak: number, lastActiveDate: string | null): Array<StreakDay> => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeDates = new Set<string>()
    if (lastActiveDate && currentStreak > 0) {
        const anchor = new Date(lastActiveDate)
        anchor.setHours(0, 0, 0, 0)
        for (let i = 0; i < currentStreak; i += 1) {
            const day = new Date(anchor)
            day.setDate(anchor.getDate() - i)
            activeDates.add(isoDay(day))
        }
    }
    return Array.from({ length: 7 }).map((_, index) => {
        const day = new Date(today)
        day.setDate(today.getDate() - (6 - index))
        const iso = isoDay(day)
        return { date: iso, active: activeDates.has(iso) }
    })
}

/** Loads the viewer's weekly streak strip from the real gamification REST API. */
export const useQueryWeeklyStreakSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "streak"],
        async (): Promise<WeeklyStreak> => {
            const streak = await getMyStreak()
            return {
                streak: streak.currentStreak ?? 0,
                longestStreak: streak.longestStreak ?? 0,
                days: buildDays(streak.currentStreak ?? 0, streak.lastActiveDate ?? null),
            }
        },
    )
    return { data, isLoading, error, mutate }
}
