"use client"

import React, {
    useState,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    ContributionCalendarView,
} from "@/components/reuseable/ContributionCalendarView"
import {
    OverviewContributionsSkeleton,
} from "./OverviewContributionsSkeleton"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyContributionCalendarSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyContributionCalendarSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

/** Props for {@link OverviewContributions}. */
export type OverviewContributionsProps = WithClassNames<undefined>

/**
 * Dashboard contribution heatmap (GitHub-style) for the signed-in viewer — content
 * only (the parent {@link import("@/components/blocks").LabeledCard} frames it). The
 * streak line is intentionally dropped here (the momentum band already shows it).
 * Self-fetches its own contribution leaf query, re-keyed on the selected year.
 * @param props - optional root class name (placement only)
 */
export const OverviewContributions = ({
    className,
}: OverviewContributionsProps) => {
    const t = useTranslations()
    const [year, setYear] = useState(() => new Date().getFullYear())
    const { data, isLoading, error, mutate } = useQueryMyContributionCalendarSwr(year)
    const days = data ?? []

    return (
        <AsyncContent
            isLoading={isLoading && days.length === 0}
            skeleton={<OverviewContributionsSkeleton className={className} />}
            error={days.length === 0 ? error : undefined}
            errorContent={{
                title: t("dashboard.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("dashboard.retry"),
            }}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                <ContributionCalendarView
                    days={days}
                    year={year}
                    onYearChange={setYear}
                />
            </div>
        </AsyncContent>
    )
}
