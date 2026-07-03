"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { SkillGraph } from "@/components/features/skill-graph"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { DayStatus, HEATMAP_WEEKS, type HeatmapDay } from "@/components/features/gamification/engine"
import { StreakHeatmap } from "@/components/features/gamification/StreakHeatmap"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** ISO `yyyy-mm-dd` for a local date. */
const toIso = (date: Date): string => {
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, "0")
    const d = `${date.getDate()}`.padStart(2, "0")
    return `${y}-${m}-${d}`
}

/** Build the 12-week heatmap cells (oldest → newest) from the active-day list. */
const buildCells = (activeDays: Array<string>): Array<HeatmapDay> => {
    const active = new Set(activeDays)
    const cells: Array<HeatmapDay> = []
    for (let i = HEATMAP_WEEKS * 7 - 1; i >= 0; i -= 1) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const iso = toIso(date)
        cells.push({ date: iso, status: active.has(iso) ? DayStatus.Active : DayStatus.Empty })
    }
    return cells
}

/** Skeleton mirroring the dashboard layout (bar card, heatmap, rank card, badges). */
const ProgressSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
                <Skeleton.Typography type="body-sm" />
                <Skeleton.ProgressBar />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
                <Skeleton.Typography type="body-sm" />
                <Skeleton.Typography type="h5" />
            </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
            <Skeleton.Typography type="body-sm" />
            <Skeleton className="h-24 w-full rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-large" />
            <Skeleton className="h-24 rounded-large" />
            <Skeleton className="h-24 rounded-large" />
        </div>
    </div>
)

/**
 * Progress section of the profile — the gamification dashboard (§2/§11): an
 * XP/level card with an ARIA progress bar toward the next level, the 12-week
 * streak calendar heatmap, a rank/league card linking to `/leaderboard`, the
 * earned-badges grid, and the embedded {@link SkillGraph} (full, subject-agnostic
 * — internals owned by `skill-graph-spider`). All numbers come from the shared
 * `useQueryMyGamificationSwr` hook, so this tab, the identity card, and the
 * account dropdown never disagree.
 */
export const ProfileProgress = () => {
    const t = useTranslations("profile")
    const tg = useTranslations("gamification")
    const tSkill = useTranslations("skillGraph")
    const locale = useLocale()
    const { data, isLoading, error } = useQueryMyGamificationSwr()

    /** Localized accessible label for one heatmap cell (date + status). */
    const cellLabel = (day: HeatmapDay): string => {
        const date = new Date(`${day.date}T00:00:00`).toLocaleDateString(locale)
        return `${date} — ${tg(day.status === DayStatus.Active ? "heatmap.active" : "heatmap.empty")}`
    }

    return (
        <div className="flex flex-col gap-6">
            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={<ProgressSkeleton />}
                isEmpty={!data}
                error={!data ? error : undefined}
            >
                {data ? (
                    <div className="flex flex-col gap-6">
                        {/* XP/level + rank/league cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
                                <div className="flex items-center gap-2">
                                    <StarIcon className="size-5 text-accent" aria-hidden focusable="false" />
                                    <Typography type="body" weight="medium">
                                        {t("progress.xpCard.level", { level: data.level })}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="ml-auto">
                                        {t("progress.xpCard.totalXp", { xp: data.xp.toLocaleString(locale) })}
                                    </Typography>
                                </div>
                                <ProgressMeter
                                    value={data.levelProgress.current}
                                    max={data.levelProgress.nextThreshold}
                                    label={t("progress.xpCard.toNext", {
                                        xp: (data.levelProgress.nextThreshold - data.levelProgress.current).toLocaleString(locale),
                                        level: data.level + 1,
                                    })}
                                    showValue
                                />
                            </div>
                            <div className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
                                <div className="flex items-center gap-2">
                                    <TrophyIcon className="size-5 text-accent" aria-hidden focusable="false" />
                                    <Typography type="body" weight="medium">
                                        {t("progress.rank.title")}
                                    </Typography>
                                </div>
                                <Typography type="h5" weight="bold">
                                    {t("progress.rank.position", { position: data.rank.position })}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {t("progress.rank.league", { league: tg(`tiers.${data.rank.league}`) })}
                                </Typography>
                                <Link
                                    href="/leaderboard"
                                    className="text-sm font-medium text-accent no-underline hover:underline"
                                >
                                    {t("progress.rank.viewLeaderboard")}
                                </Link>
                            </div>
                        </div>

                        {/* streak calendar heatmap */}
                        <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <FireIcon className="size-5 text-accent" weight="fill" aria-hidden focusable="false" />
                                <Typography type="body" weight="medium">
                                    {t("progress.heatmap.title")}
                                </Typography>
                                <Typography type="body-sm" color="muted" className="ml-auto">
                                    {t("progress.heatmap.streakLabel", { count: data.streak.current })}
                                </Typography>
                            </div>
                            {/* horizontal scroll below sm — cells stay tappable, never shrink */}
                            <div
                                className="overflow-x-auto"
                                aria-label={t("progress.heatmap.summary", { count: data.streak.current })}
                            >
                                <StreakHeatmap days={buildCells(data.streak.days)} cellLabel={cellLabel} />
                            </div>
                        </div>

                        {/* badges grid */}
                        <div className="flex flex-col gap-3">
                            <Typography type="h6" weight="bold">
                                {t("progress.badges.title")}
                            </Typography>
                            {data.badges.length === 0 ? (
                                <Typography type="body-sm" color="muted">
                                    {t("progress.badges.empty")}
                                </Typography>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {data.badges.map((badge) => (
                                        <div
                                            key={badge.id}
                                            className="flex flex-col items-center gap-2 rounded-2xl bg-default/40 p-4 text-center"
                                        >
                                            <TrophyIcon
                                                className="size-6 text-accent"
                                                weight="fill"
                                                aria-hidden
                                                focusable="false"
                                            />
                                            <Typography type="body-xs" weight="medium">
                                                {tg(`milestones.${badge.badgeKey}.name`)}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {t("progress.badges.earnedOn", {
                                                    date: new Date(`${badge.earnedDate}T00:00:00`).toLocaleDateString(locale),
                                                })}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </AsyncContent>

            {/* Skill graph — spider-web network of the learner's skills (§21). */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {tSkill("title")}
                </Typography>
                <SkillGraph />
            </div>
        </div>
    )
}
