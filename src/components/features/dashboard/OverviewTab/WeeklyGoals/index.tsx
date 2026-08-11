"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { goalMetricIcon } from "@/components/features/analytics/AnalyticsDashboard/WeeklyGoals/map"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryOverviewWeeklyGoalsSwr } from "../../hooks/useQueryOverviewWeeklyGoalsSwr"

/** Props for {@link WeeklyGoals}. */
export type WeeklyGoalsProps = WithClassNames<undefined>

/**
 * "Mục tiêu tuần" content for the dashboard cockpit — content only (the parent
 * `LabeledCard` frames it). Targets come from the live goals endpoint
 * (`GET /gamification/me/goals`, `period === "WEEKLY"`).
 *
 * The backend stores no per-goal progress, so a row only shows a bar when its
 * week-to-date value is DERIVABLE from a verified source: the `XP` metric, summed
 * from `GET /gamification/me/activity-days` over the current Vietnam week. Every
 * other metric renders target-only — no fabricated "current", no fake percentage.
 * A metric the learner never set simply has no row.
 *
 * @param props - optional root class name (placement only)
 */
export const WeeklyGoals = ({ className }: WeeklyGoalsProps) => {
    const t = useTranslations("analytics")
    const { goals, isLoading, error, mutate } = useQueryOverviewWeeklyGoalsSwr()

    /** Localized metric name, falling back to the raw backend key when unmapped. */
    const metricLabel = (metric: string): string =>
        t.has(`overview.goals.metrics.${metric}`) ? t(`overview.goals.metrics.${metric}`) : metric

    return (
        <AsyncContent
            isLoading={isLoading && goals.length === 0}
            isEmpty={goals.length === 0}
            emptyContent={{ title: t("overview.goals.empty") }}
            error={goals.length === 0 ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex flex-col gap-4">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <Skeleton.Typography type="body-sm" width="1/3" />
                                <Skeleton.Typography type="body-sm" width="1/4" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            )}
        >
            <div className={cn("flex flex-col gap-4", className)}>
                {goals.map((goal) => {
                    const label = metricLabel(goal.metric)
                    return (
                        <div key={goal.metric} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-2">
                                    {goalMetricIcon(goal.metric)}
                                    <Typography type="body-sm" className="truncate">{label}</Typography>
                                </span>
                                <Typography type="body-sm" weight="medium" className="shrink-0">
                                    {goal.current === null
                                        ? t("overview.goals.targetValue", { target: goal.target })
                                        : t("overview.goals.progressValue", {
                                            current: goal.current,
                                            target: goal.target,
                                        })}
                                </Typography>
                            </div>
                            {/* bar ONLY when the numerator is real (XP week-to-date) */}
                            {goal.current === null ? null : (
                                <ProgressMeter
                                    value={Math.min(goal.current, goal.target)}
                                    max={goal.target}
                                    aria-label={t("overview.goals.progress", {
                                        label,
                                        current: goal.current,
                                        target: goal.target,
                                    })}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </AsyncContent>
    )
}
