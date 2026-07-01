"use client"

import React, { useMemo } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { LearnBreadcrumb } from "../shared/LearnBreadcrumb"
import { LeaderboardTable } from "./LeaderboardTable"
import { LeaderboardPodium } from "./LeaderboardPodium"
import { LeaderboardChampion } from "./LeaderboardChampion"
import { LeaderboardCategoryRail } from "./LeaderboardCategoryRail"
import { rankEntriesByCategory, parseCategoryParam, type LeaderboardCategoryKey } from "./categories"
import { useLeaderboardSwr } from "./useLeaderboardSwr"
import { useAppSelector } from "@/redux/hooks"
import { useQueryCourseSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link Leaderboard}. */
export type LeaderboardProps = WithClassNames<undefined>

/**
 * Course-level leaderboard board. The XP-category selector lives in the learn
 * shell's left rail (a sidebar, like the content page) on desktop and as a chip
 * row here on mobile; both drive the `?category=` URL param. This board reads that
 * param and ranks learners by the selected category (client-side): a top-3 podium
 * + ranked list when there are enough, a single champion card when the course has
 * one learner. A text "refresh" revalidates the cached `courseLeaderboard` query.
 *
 * @param props - optional className for the root element.
 */
export const Leaderboard = ({ className }: LeaderboardProps) => {
    const t = useTranslations()
    const locale = useLocale()
    // hydrate the course entity from the URL slug so this route works on a direct load / refresh
    useQueryCourseSwr()
    // viewer identity highlights their own podium/row
    const viewer = useAppSelector((state) => state.user.user)
    const courseId = useAppSelector((state) => state.course.entity?.id)

    // the selected category lives in the URL so the left rail (a different layout
    // slot) and this board stay in sync without shared React state
    const searchParams = useSearchParams()
    const selectedCategory = parseCategoryParam(searchParams.get("category"))

    const { data, isLoading, isValidating, error, mutate } = useLeaderboardSwr()

    // gate: wait for the course to hydrate before the fetch can resolve
    const waiting = !courseId || (isLoading && !data)
    const entries = useMemo(() => data?.entries ?? [], [data])
    const rankedEntries = useMemo(
        () => rankEntriesByCategory(entries, selectedCategory),
        [entries, selectedCategory],
    )
    // display label per category (explicit keys — avoids a dynamic i18n lookup)
    const categoryLabels: Record<LeaderboardCategoryKey, string> = {
        total: t("leaderboard.categories.total"),
        challenge: t("leaderboard.categories.challenge"),
        reading: t("leaderboard.categories.reading"),
        milestone: t("leaderboard.categories.milestone"),
    }

    // board shape: 1 learner → champion card; ≥3 → podium + list; otherwise → plain list
    const isSole = rankedEntries.length === 1
    const showPodium = rankedEntries.length >= 3
    const podiumRows = showPodium ? rankedEntries.slice(0, 3) : []
    const listRows = showPodium ? rankedEntries.slice(3) : rankedEntries

    return (
        <div className={cn("mx-auto flex w-full max-w-3xl flex-col gap-10", className)}>
            {/* page heading (no top-right action — refresh lives with the board below) */}
            <PageHeader
                breadcrumb={<LearnBreadcrumb current={t("leaderboard.title")} />}
                title={t("leaderboard.title")}
                description={t("leaderboard.subtitle")}
            />

            <div className="flex flex-col gap-6">
                {/* mobile category selector (the desktop rail lives in the shell's left slot) */}
                <LeaderboardCategoryRail variant="chips" className="lg:hidden" />

                {/* board toolbar: what we're ranked by + freshness + a plain refresh */}
                <div className="flex items-center justify-between gap-3">
                    <Typography type="body-sm" weight="medium">
                        {t("leaderboard.rankedBy", { category: categoryLabels[selectedCategory] })}
                    </Typography>
                    <div className="flex shrink-0 items-center gap-3">
                        {data ? (
                            <Typography type="body-xs" color="muted">
                                {t("leaderboard.updatedAt", {
                                    time: new Date(data.computedAt).toLocaleString(locale),
                                })}
                            </Typography>
                        ) : null}
                        <Button
                            size="sm"
                            variant="ghost"
                            isPending={isValidating}
                            onPress={() => {
                                void mutate()
                            }}
                        >
                            {t("leaderboard.refresh")}
                        </Button>
                    </div>
                </div>

                <AsyncContent
                    isLoading={waiting}
                    skeleton={(
                        <div className="flex flex-col gap-2">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <div key={index} className="flex items-center gap-3 px-2 py-2">
                                    <Skeleton className="size-5 rounded-md" />
                                    <Skeleton className="size-9 rounded-full" />
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Skeleton.Typography type="body-sm" width="1/3" />
                                        <Skeleton className="h-1.5 w-4/5 rounded-full" />
                                    </div>
                                    <Skeleton.Typography type="body-sm" width="1/4" />
                                </div>
                            ))}
                        </div>
                    )}
                    isEmpty={entries.length === 0}
                    emptyContent={{
                        title: t("leaderboard.empty"),
                    }}
                    error={error}
                    errorContent={{
                        title: t("leaderboard.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("leaderboard.refresh"),
                    }}
                >
                    {isSole ? (
                        <LeaderboardChampion
                            entry={rankedEntries[0].entry}
                            totalXp={rankedEntries[0].entry.totalXp}
                            viewerUserId={viewer?.id}
                        />
                    ) : (
                        <div className="flex flex-col gap-6">
                            {showPodium ? (
                                <LeaderboardPodium
                                    top={podiumRows}
                                    selectedCategory={selectedCategory}
                                    viewerUserId={viewer?.id}
                                />
                            ) : null}
                            <LeaderboardTable
                                rankedEntries={listRows}
                                selectedCategory={selectedCategory}
                                viewerUserId={viewer?.id}
                            />
                        </div>
                    )}
                </AsyncContent>
            </div>
        </div>
    )
}
