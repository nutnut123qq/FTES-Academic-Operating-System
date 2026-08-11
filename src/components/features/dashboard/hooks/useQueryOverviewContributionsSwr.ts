"use client"

import { useCallback, useMemo } from "react"
import { HEATMAP_WEEKS } from "@/components/features/gamification/StreakHeatmap/model"
import { useGetMyActivityDaysSwr } from "@/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr"
import type { ActivityDayView } from "@/modules/api/rest/gamification"

/**
 * Dashboard-overview view of the learner's contribution heatmap, backed by the
 * real per-day XP window `GET /gamification/me/activity-days` (via
 * {@link useGetMyActivityDaysSwr}, requested at {@link HEATMAP_WEEKS} so it shares
 * ONE cache entry with the weekly-goals hook).
 *
 * The response is SPARSE — days with no XP are absent, not zero — and bucketed on
 * the Vietnam calendar day; the heatmap block fills the dense grid itself, so the
 * rows are passed through untouched. `weeks` is read back off the RESPONSE because
 * the backend clamps the requested window to [1, 26]. Totals are summed from the
 * returned rows only; nothing is inferred for a day the backend did not report.
 */
export const useQueryOverviewContributionsSwr = () => {
    const { data, isLoading, error, mutate: mutateActivity } = useGetMyActivityDaysSwr(HEATMAP_WEEKS)

    const days = useMemo<Array<ActivityDayView>>(() => data?.days ?? [], [data])

    /** XP summed across the returned window (0 when the learner earned none). */
    const totalXp = useMemo(() => days.reduce((sum, day) => sum + day.xp, 0), [days])

    const mutate = useCallback(() => {
        void mutateActivity()
    }, [mutateActivity])

    return {
        days,
        /** Window width actually served (server-clamped), not the requested one. */
        weeks: data?.weeks ?? HEATMAP_WEEKS,
        totalXp,
        /** Number of days the backend reported any XP for. */
        activeDays: days.length,
        isLoading,
        error,
        mutate,
    }
}
