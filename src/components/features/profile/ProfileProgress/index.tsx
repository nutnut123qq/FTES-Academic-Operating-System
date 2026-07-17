"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CoinsIcon, FireIcon, TrophyIcon } from "@phosphor-icons/react"
import { Link, useRouter } from "@/i18n/navigation"
import { useQueryWalletSwr } from "@/components/features/wallet/hooks/useQueryWalletSwr"
import { useQueryMyCommunitySummarySwr } from "../hooks/useQueryMyCommunitySummarySwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SkillGraph } from "@/components/features/skill-graph"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { StreakHeatmap, type HeatmapCell } from "@/components/features/gamification/StreakHeatmap"

/** Nominal XP for an active day, so the heatmap shades it (the profile snapshot
 * exposes only the active-day list, not per-day XP; the streak popover uses the
 * real `/me/activity-days` window). */
const ACTIVE_DAY_XP = 50

/** Map the active-day list to sparse heatmap cells; the heatmap fills the window. */
const toHeatmapCells = (activeDays: Array<string>): Array<HeatmapCell> =>
    activeDays.map((date) => ({ date, xp: ACTIVE_DAY_XP }))

/** Skeleton mirroring the redesigned progress dashboard. */
const ProgressSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton.Metric />
            <Skeleton.Metric />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
                <Skeleton.Typography type="h6" width="1/3" />
                <Skeleton.Card lines={2} />
            </div>
            <div className="flex flex-col gap-3">
                <Skeleton.Typography type="h6" width="1/3" />
                <Skeleton.Card lines={2} />
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>
        </div>
    </div>
)

/**
 * Progress section of the profile (§2/§11). Gamification dashboard redesigned
 * into labeled cards: XP/level, rank/league, streak heatmap, badges, and skill
 * graph.
 */
export const ProfileProgress = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data, isLoading, error } = useQueryMyGamificationSwr()
    const { balance } = useQueryWalletSwr()
    const { data: communitySummary } = useQueryMyCommunitySummarySwr()
    const reputationScore = communitySummary?.reputation.score ?? 0

    const cellLabel = (cell: HeatmapCell): string => {
        const date = new Date(`${cell.date}T00:00:00`).toLocaleDateString(locale)
        return `${date} — ${t(`gamification.heatmap.${cell.xp > 0 ? "active" : "empty"}`)}`
    }

    return (
        <div className="flex flex-col gap-6">
            {/* FTES Coin + Reputation — own SWR (wallet + community summary), so they
                render even when the gamification fetch is loading/failing. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricCard
                    icon={<CoinsIcon className="size-5 text-accent" weight="fill" aria-hidden focusable="false" />}
                    value={balance.toLocaleString(locale)}
                    label={t("profile.progress.wallet.coin")}
                    hint={
                        <Link
                            href="/wallet"
                            className="text-sm font-medium text-accent no-underline hover:underline"
                        >
                            {t("profile.progress.wallet.viewWallet")}
                        </Link>
                    }
                />
                <MetricCard
                    icon={<TrophyIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={reputationScore.toLocaleString(locale)}
                    label={t("profile.progress.wallet.reputation")}
                    hint={
                        <Link
                            href="/community"
                            className="text-sm font-medium text-accent no-underline hover:underline"
                        >
                            {t("profile.progress.wallet.viewCommunity")}
                        </Link>
                    }
                />
            </div>

            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={<ProgressSkeleton />}
                isEmpty={!data}
                emptyContent={{ title: t("profile.progress.empty.title") }}
                error={!data ? error : undefined}
                errorContent={{
                    title: t("profile.loadingError"),
                    retryLabel: t("profile.retry"),
                    onRetry: () => {
                        void router.refresh()
                    },
                }}
            >
                {data ? (
                    <div className="flex flex-col gap-6">
                        {/* XP/level + rank/league cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <LabeledCard
                                label={t("profile.progress.xpCard.level", { level: data.level })}
                                labelEnd={t("profile.progress.xpCard.totalXp", { xp: data.xp.toLocaleString(locale) })}
                            >
                                <ProgressMeter
                                    value={data.levelProgress.current}
                                    max={data.levelProgress.nextThreshold}
                                    label={t("profile.progress.xpCard.toNext", {
                                        xp: (data.levelProgress.nextThreshold - data.levelProgress.current).toLocaleString(
                                            locale,
                                        ),
                                        level: data.level + 1,
                                    })}
                                    showValue
                                />
                            </LabeledCard>

                            <MetricCard
                                icon={<TrophyIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                                value={t("profile.progress.rank.position", { position: data.rank.position })}
                                label={t("profile.progress.rank.league", {
                                    league: t(`gamification.tiers.${data.rank.league}`),
                                })}
                                hint={
                                    <Link
                                        href="/leaderboard"
                                        className="text-sm font-medium text-accent no-underline hover:underline"
                                    >
                                        {t("profile.progress.rank.viewLeaderboard")}
                                    </Link>
                                }
                            />
                        </div>

                        {/* streak calendar heatmap */}
                        <LabeledCard
                            label={t("profile.progress.heatmap.title")}
                            labelEnd={t("profile.progress.heatmap.streakLabel", { count: data.streak.current })}
                            icon={<FireIcon className="size-5 text-accent" weight="fill" aria-hidden focusable="false" />}
                        >
                            <div
                                className="overflow-x-auto"
                                aria-label={t("profile.progress.heatmap.summary", { count: data.streak.current })}
                            >
                                <StreakHeatmap days={toHeatmapCells(data.streak.days)} cellLabel={cellLabel} />
                            </div>
                        </LabeledCard>

                        {/* badges grid */}
                        <LabeledCard label={t("profile.progress.badges.title")} frameless>
                            {data.badges.length === 0 ? (
                                <Typography type="body-sm" color="muted">
                                    {t("profile.progress.badges.empty")}
                                </Typography>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {data.badges.map((badge) => (
                                        <div
                                            key={badge.id}
                                            className="flex flex-col items-center gap-2 rounded-2xl border border-separator p-4 text-center"
                                        >
                                            <TrophyIcon
                                                className="size-6 text-accent"
                                                weight="fill"
                                                aria-hidden
                                                focusable="false"
                                            />
                                            <Typography type="body-xs" weight="medium">
                                                {t(`gamification.milestones.${badge.badgeKey}.name`)}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {t("profile.progress.badges.earnedOn", {
                                                    date: new Date(`${badge.earnedDate}T00:00:00`).toLocaleDateString(
                                                        locale,
                                                    ),
                                                })}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </LabeledCard>

                        {/* skill graph */}
                        <LabeledCard label={t("skillGraph.title")} frameless>
                            <SkillGraph />
                        </LabeledCard>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
