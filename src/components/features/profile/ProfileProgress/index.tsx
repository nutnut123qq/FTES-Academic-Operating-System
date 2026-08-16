"use client"

import React from "react"
import { Label, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CoinsIcon, FireIcon, TrophyIcon } from "@phosphor-icons/react"
import { Link, useRouter } from "@/i18n/navigation"
import { useQueryWalletSwr } from "@/components/features/wallet/hooks/useQueryWalletSwr"
import { useQueryMyCommunitySummarySwr } from "../hooks/useQueryMyCommunitySummarySwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SkillExpChart } from "@/components/features/skill-exp"
import { useGetMyActivityDaysSwr } from "@/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { StreakHeatmap, type HeatmapCell } from "@/components/features/gamification/StreakHeatmap"

/**
 * Activity window this tab REQUESTS from `GET /gamification/me/activity-days`:
 * one year of week columns (52 × 7 days ending today). The shared 12-week window
 * is ~180 px of grid, which filled barely a quarter of the full-width card.
 *
 * The grid is drawn at the window the BACKEND reports it covered
 * (`ActivityDaysView.weeks`), never at the requested size — an empty cell must
 * always mean "no XP that day", never "outside the range that was fetched".
 */
const PROGRESS_HEATMAP_WEEKS = 52

/** Skeleton mirroring the redesigned progress dashboard. */
const ProgressSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton.Metric />
            <Skeleton.Metric />
        </div>
        {/* level/XP + rank: BOTH cells are framed cards whose text sits INSIDE the
            frame, so the skeleton draws card bodies (like the metric row above) —
            no label bar floating above the card. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
                <Skeleton.Typography type="body-sm" width="1/3" />
                <Skeleton.Typography type="body-xs" width="1/2" />
                <Skeleton.Meter />
            </div>
            <Skeleton.Metric />
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
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
    </div>
)

/**
 * Progress section of the SIGNED-IN viewer's own profile (§2/§11) — mounted only
 * at `/profile/progress` (no username param; another user's profile is served by
 * `ProfilePublic`), so every source here is `me`-scoped. Gamification
 * dashboard: a 2×2 of framed cards (FTES Coin, reputation, level/XP, rank/league),
 * then the year-long learning-activity calendar, badges, and the skill-EXP chart
 * (raw EXP per skill category, auto-scaling axis).
 */
export const ProfileProgress = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data, isLoading, error } = useQueryMyGamificationSwr()
    /**
     * Per-day XP for the calendar, read straight from
     * `GET /gamification/me/activity-days` at this tab's own window (its own SWR
     * key, so the shared 12-week cache is untouched). The composed gamification
     * snapshot cannot serve it: it is pinned to the shared 12-week window AND
     * keeps only the ACTIVE-day dates, dropping the XP amount — the calendar
     * needs both a year of columns and the real per-day XP to shade honestly.
     * Same source the sibling `ProfileContributions` reads on `/profile`.
     */
    const { data: activity } = useGetMyActivityDaysSwr(PROGRESS_HEATMAP_WEEKS)
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
                            {/* The XP cell uses the SAME shell as its three neighbours —
                                `SectionCard`, exactly what `MetricCard` wraps (no header
                                props, so no divider row) — so "Level N" and the total-XP
                                end label sit INSIDE the frame like every other card of the
                                2×2. `LabeledCard` cannot do that: it always renders its
                                label row as a sibling ABOVE the card.
                                Height parity now comes for free: the card IS the grid item,
                                so the grid's default `align-items: stretch` sizes it to the
                                row (and `.card__content` is `flex-1`) — the same mechanism
                                that keeps the two metric cards of the first row equal.
                                `fillHeight` was only needed while a LabeledCard `<section>`
                                stood between the grid and the card. */}
                            <SectionCard>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label>{t("profile.progress.xpCard.level", { level: data.level })}</Label>
                                        <span className="shrink-0 text-xs text-muted">
                                            {t("profile.progress.xpCard.totalXp", {
                                                xp: data.xp.toLocaleString(locale),
                                            })}
                                        </span>
                                    </div>
                                    <ProgressMeter
                                        value={data.levelProgress.current}
                                        max={data.levelProgress.nextThreshold}
                                        label={t("profile.progress.xpCard.toNext", {
                                            xp: (
                                                data.levelProgress.nextThreshold - data.levelProgress.current
                                            ).toLocaleString(locale),
                                            level: data.level + 1,
                                        })}
                                        showValue
                                    />
                                </div>
                            </SectionCard>

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
                            {activity ? (
                                // A year of columns is wider than the card on a narrow
                                // viewport → the grid scrolls horizontally instead of being
                                // squashed. `weeks` is the BE-reported coverage, so the grid
                                // never extends past the range the response covers.
                                <div
                                    className="overflow-x-auto"
                                    aria-label={t("profile.progress.heatmap.summary", { count: data.streak.current })}
                                >
                                    <StreakHeatmap
                                        days={activity.days}
                                        weeks={activity.weeks}
                                        cellLabel={cellLabel}
                                    />
                                </div>
                            ) : (
                                // the activity window is its own request — don't paint a full
                                // year of "no activity" cells while it is still in flight
                                <Skeleton className="h-32 w-full rounded-2xl" />
                            )}
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

                        {/* skill EXP per category — raw EXP, auto-scaling axis */}
                        <LabeledCard label={t("skillExp.title")}>
                            <SkillExpChart />
                        </LabeledCard>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
