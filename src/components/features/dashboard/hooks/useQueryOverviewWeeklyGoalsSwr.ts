"use client"

import { useCallback, useMemo } from "react"
import { HEATMAP_WEEKS, shiftIso, vnTodayIso } from "@/components/features/gamification/StreakHeatmap/model"
import { useGetMyActivityDaysSwr } from "@/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr"
import { useGetMyGoalsSwr } from "@/hooks/swr/api/rest/queries/useGetMyGoalsSwr"

/** Backend metric whose week-to-date value the FE can derive honestly. */
const XP_METRIC = "XP"

/**
 * ISO date (`yyyy-mm-dd`) of the MONDAY that opens the Vietnam week containing
 * `todayIso`. The backend keys activity days by the Vietnam calendar day, so the
 * week boundary is computed on the same day string (UTC-parsed, no local drift).
 *
 * @param todayIso - Today's Vietnam ISO day.
 * @returns The Monday of that week, `yyyy-mm-dd`.
 */
const weekStartIso = (todayIso: string): string => {
    const weekday = new Date(`${todayIso}T00:00:00Z`).getUTCDay()
    return shiftIso(todayIso, -((weekday + 6) % 7))
}

/** One weekly-goal row: the target the learner set, plus a real value when derivable. */
export interface OverviewGoalRow {
    /** Backend metric (`XP` | `LESSONS` | `MINUTES`) — drives the row icon/label. */
    metric: string
    /** The learner's weekly target for this metric. */
    target: number
    /**
     * Week-to-date value, or `null` when it cannot be derived from a verified
     * source. Only `XP` resolves: it is the sum of `GET /gamification/me/activity-days`
     * XP from this week's Monday through today. `LESSONS` / `MINUTES` have NO
     * backend counter, so they stay `null` and the widget renders the target only.
     */
    current: number | null
}

/**
 * Dashboard-overview view of the learner's WEEKLY goals.
 *
 * Targets come from `GET /gamification/me/goals` (via {@link useGetMyGoalsSwr},
 * filtered to `period === "WEEKLY"`). That endpoint returns the TARGET ONLY — it
 * carries no progress field — so the numerator is derived, and only where a real
 * source exists: the per-day XP window `GET /gamification/me/activity-days` (via
 * {@link useGetMyActivityDaysSwr}) summed over the current Vietnam week feeds the
 * `XP` metric. Every other metric keeps `current: null`; the widget must render
 * those target-only rather than fabricate a value.
 *
 * The activity window is requested at {@link HEATMAP_WEEKS} so this hook shares
 * ONE cache entry with the contributions heatmap instead of firing a second call.
 * An activity-days failure degrades the `XP` row to target-only — it is not
 * surfaced as `error`, which stays reserved for the goals call itself.
 */
export const useQueryOverviewWeeklyGoalsSwr = () => {
    const { data: goalsData, isLoading: goalsLoading, error, mutate: mutateGoals } = useGetMyGoalsSwr()
    const { data: activityData, isLoading: activityLoading, mutate: mutateActivity } =
        useGetMyActivityDaysSwr(HEATMAP_WEEKS)

    /** XP earned from this week's Monday through today, or null while unknown. */
    const weekXp = useMemo<number | null>(() => {
        const days = activityData?.days
        if (!days) return null
        const today = vnTodayIso()
        const start = weekStartIso(today)
        return days.reduce(
            (sum, day) => (day.date >= start && day.date <= today ? sum + day.xp : sum),
            0,
        )
    }, [activityData])

    const goals = useMemo<Array<OverviewGoalRow>>(
        () =>
            (goalsData ?? [])
                .filter((goal) => goal.period === "WEEKLY")
                .map((goal) => ({
                    metric: goal.metric,
                    target: goal.target,
                    current: goal.metric === XP_METRIC ? weekXp : null,
                })),
        [goalsData, weekXp],
    )

    const mutate = useCallback(() => {
        void mutateGoals()
        void mutateActivity()
    }, [mutateGoals, mutateActivity])

    return { goals, isLoading: goalsLoading || activityLoading, error, mutate }
}
