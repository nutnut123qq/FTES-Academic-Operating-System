"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StreakHeatmap, type HeatmapCell } from "@/components/features/gamification/StreakHeatmap"
import { XP_LEVEL_CLASS } from "@/components/features/gamification/StreakHeatmap/model"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryOverviewContributionsSwr } from "../../hooks/useQueryOverviewContributionsSwr"

/** Props for {@link OverviewContributions}. */
export type OverviewContributionsProps = WithClassNames<undefined>

/**
 * "Đóng góp" content for the dashboard cockpit — content only (the parent
 * `LabeledCard` frames it). A today-anchored XP heatmap built from the real
 * per-day window `GET /gamification/me/activity-days`, rendered through the shared
 * {@link StreakHeatmap} block so the intensity tiers and `--heat-*` tokens match
 * the streak popover and the profile contributions grid.
 *
 * The backend rows are SPARSE — a day it did not report renders as an empty cell,
 * never as an inferred value — and the window width comes back off the response
 * (the endpoint clamps the requested weeks to [1, 26]).
 *
 * @param props - optional root class name (placement only)
 */
export const OverviewContributions = ({ className }: OverviewContributionsProps) => {
    const t = useTranslations("analytics")
    const locale = useLocale()
    const { days, weeks, totalXp, activeDays, isLoading, error, mutate } = useQueryOverviewContributionsSwr()

    const cellLabel = (cell: HeatmapCell): string =>
        t("overview.contributions.cellLabel", {
            date: new Date(`${cell.date}T00:00:00Z`).toLocaleDateString(locale),
            xp: cell.xp,
        })

    return (
        <AsyncContent
            isLoading={isLoading && activeDays === 0}
            isEmpty={activeDays === 0}
            emptyContent={{ title: t("overview.contributions.empty", { weeks }) }}
            error={activeDays === 0 ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-28 w-full rounded-large" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
            )}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                <div className="overflow-x-auto">
                    <StreakHeatmap days={days} weeks={weeks} cellLabel={cellLabel} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Typography type="body-xs" color="muted">
                        {t("overview.contributions.summary", { xp: totalXp, weeks })}
                    </Typography>
                    {/* legend: Ít → Nhiều, same tiers the cells use */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <span>{t("overview.contributions.less")}</span>
                        {XP_LEVEL_CLASS.map((levelClass, index) => (
                            <span key={index} className={cn("size-3 shrink-0 rounded-sm", levelClass)} />
                        ))}
                        <span>{t("overview.contributions.more")}</span>
                    </div>
                </div>
            </div>
        </AsyncContent>
    )
}
