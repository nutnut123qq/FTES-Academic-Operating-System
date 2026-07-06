"use client"

import React, { useMemo } from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { DEFAULT_KPI_TARGETS, KPI_ICON_MAP, KPI_ORDER } from "./map"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyGoalsSwr } from "../../hooks/useQueryWeeklyGoalsSwr"
import type { KpiKey, WeeklyGoal } from "../../hooks/useQueryWeeklyGoalsSwr"

/** Props for {@link WeeklyGoals}. */
export type WeeklyGoalsProps = WithClassNames<undefined>

/**
 * "Mục tiêu tuần" content — the composite weekly-goal summary + a per-metric
 * breakdown (lessons / study-days / challenges / coding / flashcards) with a bar
 * over the EFFECTIVE target (custom OR default), so the summary + bars always track
 * this week's activity even before a custom goal is set. Content only (the parent
 * `LabeledCard` frames it). Faithful port of StarCI's WeeklyGoals. Self-fetches.
 * @param props - optional root class name (placement only)
 */
export const WeeklyGoals = ({ className }: WeeklyGoalsProps) => {
    const t = useTranslations("analytics")
    const { goals, isLoading, error, mutate } = useQueryWeeklyGoalsSwr()

    /** Index goals by key for O(1) lookup while rendering in display order. */
    const itemByKey = useMemo(() => {
        const map = new Map<KpiKey, WeeklyGoal>()
        for (const item of goals) {
            map.set(item.key, item)
        }
        return map
    }, [goals])

    // composite over EFFECTIVE targets (custom OR default)
    const composite = useMemo(() => {
        let completed = 0
        let sumCurrent = 0
        let sumTarget = 0
        for (const key of KPI_ORDER) {
            const item = itemByKey.get(key)
            const current = item?.current ?? 0
            const target = item?.target ?? DEFAULT_KPI_TARGETS[key]
            sumTarget += target
            sumCurrent += Math.min(current, target)
            if (current >= target) {
                completed += 1
            }
        }
        return {
            completed,
            total: KPI_ORDER.length,
            percent: sumTarget > 0 ? Math.round((sumCurrent / sumTarget) * 100) : 0,
        }
    }, [itemByKey])

    return (
        <AsyncContent
            isLoading={isLoading || goals.length === 0}
            error={error}
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
            <div className={cn("flex flex-col gap-3", className)}>
                <Typography type="body-sm" weight="medium">
                    {t("overview.goals.summary", {
                        percent: composite.percent,
                        completed: composite.completed,
                        total: composite.total,
                    })}
                </Typography>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
                    {KPI_ORDER.map((key) => {
                        const item = itemByKey.get(key)
                        const current = item?.current ?? 0
                        // effective target = the learner's custom goal, or a sensible default
                        const target = item?.target ?? DEFAULT_KPI_TARGETS[key]
                        const percent = target > 0 ? Math.min(current / target, 1) * 100 : 0
                        return (
                            <div key={key} className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2">
                                        {KPI_ICON_MAP[key]}
                                        <Typography type="body-xs" color="muted">
                                            {t(`overview.goals.labels.${key}`)}
                                        </Typography>
                                    </span>
                                    <Typography type="body-xs" color="muted">
                                        {current}/{target}
                                    </Typography>
                                </div>
                                {/* progress line — current toward the (custom or default) target */}
                                <div
                                    role="progressbar"
                                    aria-label={t(`overview.goals.labels.${key}`)}
                                    aria-valuenow={current}
                                    aria-valuemin={0}
                                    aria-valuemax={target}
                                    className="h-1.5 w-full overflow-hidden rounded-full bg-default"
                                >
                                    <div
                                        className="h-full rounded-full bg-accent transition-[width]"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </AsyncContent>
    )
}
