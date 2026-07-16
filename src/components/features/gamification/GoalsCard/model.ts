import type { GoalView } from "@/modules/api/rest/gamification"

/**
 * Goal periods the backend accepts (`GoalService.PERIODS`). A goal is uniquely
 * keyed by `(period, metric)`, so upserting an existing pair edits its target.
 */
export const GOAL_PERIODS = ["DAILY", "WEEKLY", "MONTHLY"] as const
/** One of {@link GOAL_PERIODS}. */
export type GoalPeriod = (typeof GOAL_PERIODS)[number]

/**
 * Goal metrics the backend accepts (`GoalService.METRICS`). No per-goal progress
 * is returned by the BE, so the card shows the configured target only — it never
 * fabricates a completion percentage.
 */
export const GOAL_METRICS = ["XP", "LESSONS", "MINUTES"] as const
/** One of {@link GOAL_METRICS}. */
export type GoalMetric = (typeof GOAL_METRICS)[number]

/** Stable identity for a goal `(period, metric)` pair — used as a React key and for edit prefill. */
export const goalKey = (period: string, metric: string): string => `${period}:${metric}`

/**
 * Sort goals for display: by period (daily → weekly → monthly) then metric
 * (xp → lessons → minutes), so the list is stable regardless of insert order.
 *
 * @param goals - the raw goals from `GET /gamification/me/goals`
 * @returns a new, ordered array (unknown period/metric values sort last)
 */
export const sortGoals = (goals: ReadonlyArray<GoalView>): Array<GoalView> => {
    const periodRank = (p: string): number => {
        const i = (GOAL_PERIODS as ReadonlyArray<string>).indexOf(p)
        return i < 0 ? GOAL_PERIODS.length : i
    }
    const metricRank = (m: string): number => {
        const i = (GOAL_METRICS as ReadonlyArray<string>).indexOf(m)
        return i < 0 ? GOAL_METRICS.length : i
    }
    return [...goals].sort(
        (a, b) => periodRank(a.period) - periodRank(b.period) || metricRank(a.metric) - metricRank(b.metric),
    )
}

/**
 * Parse a raw target string into a valid positive integer, or `null` when it is
 * not a usable target (the BE rejects `target <= 0`).
 *
 * @param raw - the input field value
 * @returns the parsed positive integer, or `null`
 */
export const parseTarget = (raw: string): number | null => {
    const n = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : null
}
