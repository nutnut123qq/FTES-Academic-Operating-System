"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { FlameIcon as FireIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ContributionCalendarView } from "@/components/reuseable/ContributionCalendarView"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useProfileUsername } from "../../hooks/useProfileUsername"
import { useQueryUserContributionCalendarSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserContributionCalendarSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserWeeklyStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserWeeklyStatsSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link OverviewContributions}. */
export type OverviewContributionsProps = WithClassNames<undefined>

/**
 * Overview content — the contribution heatmap (GitHub-style) + the streak line
 * (current / longest). Content only (no card): the parent
 * {@link import("@/components/blocks").LabeledCard} supplies the frame; the
 * calendar fetch goes through {@link AsyncContent}.
 *
 * @param props - optional root class name (placement only)
 */
export const OverviewContributions = ({ className }: OverviewContributionsProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null

    const [year, setYear] = useState(() => new Date().getFullYear())
    const { data, isLoading, error, mutate } = useQueryUserContributionCalendarSwr(userId, year)
    const { data: weekly } = useQueryUserWeeklyStatsSwr(userId)

    const days = data ?? []

    return (
        <AsyncContent
            isLoading={(isLoading || !userId) && days.length === 0}
            skeleton={(
                <div className="flex flex-col gap-3">
                    {/* contribution heatmap grid */}
                    <Skeleton className="h-40 w-full rounded-xl" />
                    {/* streak line (fire icon + text) */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="size-4 shrink-0 rounded-full" />
                        <Skeleton.Typography type="body-sm" width="1/2" />
                    </div>
                </div>
            )}
            error={days.length === 0 ? error : undefined}
            errorContent={{
                title: t("publicProfile.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("publicProfile.loadErrorRetry"),
            }}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                <ContributionCalendarView
                    days={days}
                    year={year}
                    onYearChange={setYear}
                />
                <div className="flex items-center gap-2">
                    <FireIcon aria-hidden focusable="false" className="size-5 text-accent" />
                    <Typography type="body-sm" weight="medium">
                        {t("profile.streakLine", {
                            streak: weekly?.streak ?? 0,
                            longest: weekly?.longestStreak ?? 0,
                        })}
                    </Typography>
                </div>
            </div>
        </AsyncContent>
    )
}
