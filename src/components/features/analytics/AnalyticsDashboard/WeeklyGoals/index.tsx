"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { goalMetricIcon } from "./map"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyGoalsSwr } from "../../hooks/useQueryWeeklyGoalsSwr"

/** Props for {@link WeeklyGoals}. */
export type WeeklyGoalsProps = WithClassNames<undefined>

/**
 * "Mục tiêu tuần" content — the learner's WEEKLY goals from the live goals
 * endpoint (`useGetMyGoalsSwr`, filtered to `period === "WEEKLY"`). Each row shows
 * the metric and the target the learner set. The backend returns no per-goal
 * progress, so the widget shows the target only — no fabricated "current" or
 * percentage — and a metric the learner has not set simply has no row. Content
 * only (the parent `LabeledCard` frames it).
 * @param props - optional root class name (placement only)
 */
export const WeeklyGoals = ({ className }: WeeklyGoalsProps) => {
    const t = useTranslations("analytics")
    const { goals, isLoading, error, mutate } = useQueryWeeklyGoalsSwr()

    return (
        <AsyncContent
            isLoading={isLoading && goals.length === 0}
            isEmpty={goals.length === 0}
            emptyContent={{ title: t("overview.goals.empty") }}
            error={goals.length === 0 ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-full rounded-medium" />
                    ))}
                </div>
            )}
        >
            <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3", className)}>
                {goals.map((goal) => (
                    <div key={goal.metric} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                            {goalMetricIcon(goal.metric)}
                            <Typography type="body-sm">
                                {t(`overview.goals.metrics.${goal.metric}`)}
                            </Typography>
                        </span>
                        <Typography type="body-sm" weight="medium" className="shrink-0">
                            {t("overview.goals.targetValue", { target: goal.target })}
                        </Typography>
                    </div>
                ))}
            </div>
        </AsyncContent>
    )
}
