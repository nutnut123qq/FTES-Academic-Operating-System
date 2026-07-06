"use client"

import React, { useMemo } from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    rankEntriesByCategory,
    useQueryLearnLeaderboardSwr,
    VIEWER_USER_ID,
} from "../hooks/useQueryLearnLeaderboardSwr"
import { LeaderboardPodium } from "./LeaderboardPodium"
import { LeaderboardTable } from "./LeaderboardTable"
import { LeaderboardChampion } from "./LeaderboardChampion"
import { LeaderboardCategoryRail, parseCategoryParam } from "./LeaderboardCategoryRail"

/**
 * Course leaderboard (StarCI port). Ranks learners by the category chosen in the
 * layout-owned LEFT rail (mirrored to a mobile chip strip here). Shapes the board:
 * 1 entry → a champion card; ≥3 → a top-3 podium + a ranked table; else a plain
 * table. A toolbar shows the ranked-by category + last-updated time + a refresh.
 *
 * Read-only + client-re-ranked (no sockets), mirroring StarCI. The category rail
 * lives in the route layout; this feature renders only the centered board column.
 */
export const Leaderboard = () => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const { courseId } = useParams<{ courseId: string }>()
    const searchParams = useSearchParams()
    const selectedCategory = parseCategoryParam(searchParams.get("category"))
    const { entries, computedAt, isLoading, isValidating, error, mutate } = useQueryLearnLeaderboardSwr(courseId)

    const ranked = useMemo(
        () => rankEntriesByCategory(entries, selectedCategory),
        [entries, selectedCategory],
    )
    const isSole = ranked.length === 1
    const showPodium = ranked.length >= 3
    const podiumRows = ranked.slice(0, 3)
    const listRows = showPodium ? ranked.slice(3) : ranked

    const categoryLabel = t(`leaderboard.categories.${selectedCategory}`)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
            <PageHeader title={t("leaderboard.title")} description={t("leaderboard.subtitle")} />

            <div className="flex flex-col gap-6">
                {/* mobile category selector (rail is desktop-only, layout-owned) */}
                <LeaderboardCategoryRail variant="chips" className="lg:hidden" />

                {/* toolbar: ranked-by + updated-at + refresh */}
                <div className="flex items-center justify-between gap-3">
                    <Typography type="body-sm" weight="medium">
                        {t("leaderboard.rankedBy", { category: categoryLabel })}
                    </Typography>
                    <div className="flex shrink-0 items-center gap-3">
                        {computedAt ? (
                            <Typography type="body-xs" color="muted" className="hidden sm:block">
                                {t("leaderboard.updatedAt", { time: new Date(computedAt).toLocaleTimeString(locale) })}
                            </Typography>
                        ) : null}
                        <Button size="sm" variant="ghost" isPending={isValidating} onPress={() => { void mutate() }}>
                            {t("leaderboard.refresh")}
                        </Button>
                    </div>
                </div>

                <AsyncContent
                    isLoading={isLoading && entries.length === 0}
                    skeleton={<LeaderboardSkeleton />}
                    isEmpty={ranked.length === 0}
                    emptyContent={{ title: t("leaderboard.empty") }}
                    error={entries.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("leaderboard.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    {isSole ? (
                        <LeaderboardChampion
                            entry={ranked[0].entry}
                            totalXp={ranked[0].entry.totalXp}
                            viewerUserId={VIEWER_USER_ID}
                        />
                    ) : (
                        <div className="flex flex-col gap-6">
                            {showPodium ? (
                                <LeaderboardPodium
                                    top={podiumRows}
                                    selectedCategory={selectedCategory}
                                    viewerUserId={VIEWER_USER_ID}
                                />
                            ) : null}
                            <LeaderboardTable
                                rankedEntries={listRows}
                                selectedCategory={selectedCategory}
                                viewerUserId={VIEWER_USER_ID}
                            />
                        </div>
                    )}
                </AsyncContent>
            </div>
        </div>
    )
}

/** Leaderboard skeleton — podium + a few rows. */
const LeaderboardSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-end justify-center gap-4">
            {["h-14", "h-24", "h-10"].map((height, index) => (
                <Skeleton key={index} className={`${height} w-24 rounded-t-xl`} />
            ))}
        </div>
        <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-12 w-full rounded-2xl" />
            ))}
        </div>
    </div>
)
