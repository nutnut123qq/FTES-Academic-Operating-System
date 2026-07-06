"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { CrownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserLink } from "@/components/features/identity"
import { LearnNavRail } from "../shared/LearnNavRail"
import {
    LEADERBOARD_CATEGORIES,
    useQueryLearnLeaderboardSwr,
} from "../hooks/useQueryLearnLeaderboardSwr"
import type { LeaderboardCategory, LeaderboardEntry } from "../hooks/useQueryLearnLeaderboardSwr"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"

/** Podium column order (2nd, 1st, 3rd) so #1 sits centered + raised. */
const PODIUM_ORDER = [1, 0, 2]

/**
 * Course leaderboard (priority 4). A top-3 podium (crowned #1 + XP), a ranked
 * #4–#9 list with relative XP bars, a LEFT category filter (Total XP /
 * Challenges / Reading / Milestones) and each learner's cohort/term. Selecting a
 * category re-ranks (own SWR key).
 */
export const Leaderboard = () => {
    const t = useTranslations("learn")
    const { courseId } = useParams<{ courseId: string }>()
    const { navSections } = useQueryLearnCourseSwr(courseId)
    const [category, setCategory] = useState<LeaderboardCategory>("total")
    const { entries, maxXp, isLoading, error, mutate } = useQueryLearnLeaderboardSwr(courseId, category)

    const podium = entries.slice(0, 3)
    const rest = entries.slice(3, 9)

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
                <LearnNavRail courseId={courseId} sections={navSections} activeKey="leaderboard" />
                {/* category filter */}
                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" weight="semibold" color="muted" className="px-3 uppercase tracking-wide">
                        {t("leaderboard.categoryLabel")}
                    </Typography>
                    {LEADERBOARD_CATEGORIES.map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCategory(key)}
                            className={cn(
                                "rounded-2xl px-3 py-2 text-left text-sm transition-colors",
                                key === category
                                    ? "bg-accent/10 font-semibold text-accent"
                                    : "text-foreground hover:bg-default/60",
                            )}
                            aria-pressed={key === category}
                        >
                            {t(`leaderboard.categories.${key}`)}
                        </button>
                    ))}
                </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-6">
                <PageHeader title={t("leaderboard.title")} description={t("leaderboard.subtitle")} />

                <AsyncContent
                    isLoading={isLoading && entries.length === 0}
                    skeleton={<LeaderboardSkeleton />}
                    isEmpty={entries.length === 0}
                    emptyContent={{ title: t("leaderboard.empty") }}
                    error={entries.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("leaderboard.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    {/* podium */}
                    <div className="grid grid-cols-3 items-end gap-3">
                        {PODIUM_ORDER.map((slot) => {
                            const entry = podium[slot]
                            if (!entry) {
                                return <div key={slot} />
                            }
                            return (
                                <PodiumCard
                                    key={entry.username}
                                    entry={entry}
                                    xpLabel={t("leaderboard.xp", { value: entry.xp })}
                                />
                            )
                        })}
                    </div>

                    {/* ranked list #4–#9 */}
                    {rest.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {rest.map((entry) => (
                                <RankedRow
                                    key={entry.username}
                                    entry={entry}
                                    maxXp={maxXp}
                                    xpLabel={t("leaderboard.xp", { value: entry.xp })}
                                />
                            ))}
                        </ul>
                    ) : null}
                </AsyncContent>
            </div>
        </div>
    )
}

/** A podium card for a top-3 learner (crowned + raised for #1). */
const PodiumCard = ({ entry, xpLabel }: { entry: LeaderboardEntry; xpLabel: string }) => {
    const isChampion = entry.rank === 1
    return (
        <div
            className={cn(
                "flex flex-col items-center gap-2 rounded-3xl border border-default bg-surface p-4 text-center",
                isChampion ? "pb-8" : "pb-4",
            )}
        >
            {isChampion ? (
                <CrownIcon aria-hidden focusable="false" weight="fill" className="size-6 text-warning" />
            ) : null}
            <Typography type="h6" weight="bold" className={cn(isChampion && "text-accent")}>
                #{entry.rank}
            </Typography>
            <UserLink
                username={entry.username}
                displayName={entry.displayName}
                hideName
                size={isChampion ? "lg" : "md"}
            />
            <Typography type="body-sm" weight="semibold" truncate className="w-full">
                {entry.displayName}
            </Typography>
            <Typography type="body-xs" color="muted" truncate className="w-full">
                {entry.cohortLabel}
            </Typography>
            <Typography type="body-sm" weight="semibold" className="text-accent">
                {xpLabel}
            </Typography>
        </div>
    )
}

/** A ranked list row (#4+) with a relative XP bar + cohort. */
const RankedRow = ({
    entry,
    maxXp,
    xpLabel,
}: {
    entry: LeaderboardEntry
    maxXp: number
    xpLabel: string
}) => (
    <li className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-3 py-2">
        <Typography type="body-sm" weight="bold" color="muted" className="w-6 shrink-0 text-center">
            {entry.rank}
        </Typography>
        <UserLink username={entry.username} displayName={entry.displayName} hideName size="sm" />
        <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
                <Typography type="body-sm" weight="medium" truncate>
                    {entry.displayName}
                </Typography>
                <Typography type="body-xs" weight="semibold" className="shrink-0 text-accent">
                    {xpLabel}
                </Typography>
            </div>
            <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-default">
                    <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(4, Math.round((entry.xp / maxXp) * 100))}%` }}
                    />
                </div>
                <Typography type="body-xs" color="muted" className="shrink-0">
                    {entry.cohortLabel}
                </Typography>
            </div>
        </div>
    </li>
)

/** Leaderboard skeleton — podium + a few rows. */
const LeaderboardSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 items-end gap-3">
            {[0, 1, 2].map((slot) => (
                <Skeleton key={slot} className="h-40 w-full rounded-3xl" />
            ))}
        </div>
        <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-14 w-full rounded-2xl" />
            ))}
        </div>
    </div>
)
