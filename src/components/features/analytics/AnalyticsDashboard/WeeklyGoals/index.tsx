"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyGoalsSwr } from "../../hooks/useQueryWeeklyGoalsSwr"

/** Props for {@link WeeklyGoals}. */
export type WeeklyGoalsProps = WithClassNames<undefined>

/**
 * "Weekly goals" content — one house {@link ProgressMeter} per metric (lessons /
 * study days / challenges / flashcards), each showing current/target + a bar.
 * Content only (the parent frames it). Self-fetches its own mock leaf query.
 * @param props - optional root class name (placement only)
 */
export const WeeklyGoals = ({ className }: WeeklyGoalsProps) => {
    const t = useTranslations("analytics")
    const { goals, isLoading, error, mutate } = useQueryWeeklyGoalsSwr()

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
                <div className="flex flex-col gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-full rounded-medium" />
                    ))}
                </div>
            )}
        >
            <div className={cn("flex flex-col gap-4", className)}>
                {goals.map((goal) => (
                    <ProgressMeter
                        key={goal.key}
                        value={goal.current}
                        max={goal.target}
                        aria-label={t(`overview.goals.labels.${goal.key}`)}
                        label={t("overview.goals.progress", {
                            label: t(`overview.goals.labels.${goal.key}`),
                            current: goal.current,
                            target: goal.target,
                        })}
                        showValue
                    />
                ))}
            </div>
        </AsyncContent>
    )
}
