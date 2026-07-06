"use client"

import React, { useState } from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ContributionCalendarView } from "@/components/reuseable/ContributionCalendarView"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryContributionCalendarSwr } from "../../hooks/useQueryContributionCalendarSwr"

/** Props for {@link OverviewContributions}. */
export type OverviewContributionsProps = WithClassNames<undefined>

/**
 * Dashboard contribution heatmap (GitHub-style) for the viewer — content only (the
 * parent `LabeledCard` frames it). Reuses the house {@link ContributionCalendarView}
 * (the same block StarCI's dashboard uses). Self-fetches its own mock contribution
 * leaf query, re-keyed on the selected year.
 * @param props - optional root class name (placement only)
 */
export const OverviewContributions = ({ className }: OverviewContributionsProps) => {
    const t = useTranslations("analytics")
    const [year, setYear] = useState(() => new Date().getFullYear())
    const { data, isLoading, error, mutate } = useQueryContributionCalendarSwr(year)
    const days = data ?? []

    return (
        <AsyncContent
            isLoading={isLoading && days.length === 0}
            skeleton={<Skeleton className={cn("h-32 w-full rounded-large", className)} />}
            error={days.length === 0 ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                <ContributionCalendarView days={days} year={year} onYearChange={setYear} />
            </div>
        </AsyncContent>
    )
}
