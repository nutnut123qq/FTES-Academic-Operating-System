"use client"

import React, { useMemo, useState } from "react"
import { Typography, cn } from "@heroui/react"
import { FireIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetMyActivityDaysSwr } from "@/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr"
import { useGetMyStreakSwr } from "@/hooks/swr/api/rest/queries/useGetMyStreakSwr"
import { XP_LEVEL_CLASS, vnTodayIso, xpLevel } from "@/components/features/gamification/StreakHeatmap/model"

/** How many recent years the selector offers (current + 2 back). */
const YEAR_SPAN = 3

/** Milliseconds in one day. */
const MS_PER_DAY = 86_400_000

/**
 * Number of activity-day WEEKS to request so the today-anchored
 * `GET /gamification/me/activity-days` window reaches back into the selected
 * `year`. Clamped to [13, 260] so a distant year never asks for an unbounded
 * window (the REST endpoint has no date-range param — see change Findings).
 */
const weeksToCover = (year: number): number => {
    const today = new Date(`${vnTodayIso()}T00:00:00Z`).getTime()
    const jan1 = Date.UTC(year, 0, 1)
    const days = Math.max(0, Math.round((today - jan1) / MS_PER_DAY))
    return Math.min(260, Math.max(13, Math.ceil(days / 7) + 1))
}

/** One rendered cell of the year grid. */
interface YearCell {
    dateStr: string
    /** Whether the day falls inside the selected year (off-year pad cells are blank). */
    inYear: boolean
    /** Whether the day is still in the future (rendered blank, never shaded). */
    isFuture: boolean
    /** XP earned that day (0 when none / no backend row). */
    xp: number
}

/**
 * Contributions section of the personal profile (§4.3). Renders the real activity
 * heatmap from `GET /gamification/me/activity-days` (via {@link useGetMyActivityDaysSwr})
 * as a GitHub-style year grid, a year selector, and a "{n}-day streak · longest {m}"
 * line from `GET /gamification/me/streak` (via {@link useGetMyStreakSwr}). No numbers
 * are fabricated — a day with no backend row renders as an empty cell.
 *
 * The shared {@link import("@/components/features/gamification/StreakHeatmap").StreakHeatmap}
 * block is today-anchored (fixed window ending on today) and cannot render an
 * arbitrary calendar year, so this section builds a YEAR-anchored grid while
 * reusing that block's intensity model ({@link xpLevel} + {@link XP_LEVEL_CLASS})
 * for identical tokens / tiers. Changing the year re-keys the activity-days window.
 */
export const ProfileContributions = () => {
    const t = useTranslations()
    const locale = useLocale()

    const [year, setYear] = useState(() => new Date().getFullYear())
    const activitySwr = useGetMyActivityDaysSwr(weeksToCover(year))
    const streakSwr = useGetMyStreakSwr()

    const days = activitySwr.data?.days ?? []

    /** Recent years offered by the selector (current → current − (YEAR_SPAN−1)). */
    const years = useMemo(() => {
        const current = new Date().getFullYear()
        return Array.from({ length: YEAR_SPAN }).map((_, index) => current - index)
    }, [])

    /** XP-by-date lookup for the selected year. */
    const xpByDate = useMemo(() => {
        const map = new Map<string, number>()
        for (const day of days) {
            if (day.date.startsWith(`${year}-`)) map.set(day.date, day.xp)
        }
        return map
    }, [days, year])

    /** The year laid out as week columns (each a 7-day Sun→Sat array). */
    const weeks = useMemo<Array<Array<YearCell>>>(() => {
        const todayIso = vnTodayIso()
        const firstDay = new Date(Date.UTC(year, 0, 1))
        const cursor = new Date(firstDay)
        // align the grid start to the Sunday on/before Jan 1 (UTC, no TZ drift)
        cursor.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay())
        const lastDay = new Date(Date.UTC(year, 11, 31))
        const columns: Array<Array<YearCell>> = []
        while (cursor <= lastDay) {
            const column: Array<YearCell> = []
            for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
                const dateStr = cursor.toISOString().slice(0, 10)
                column.push({
                    dateStr,
                    inYear: cursor.getUTCFullYear() === year,
                    isFuture: dateStr > todayIso,
                    xp: xpByDate.get(dateStr) ?? 0,
                })
                cursor.setUTCDate(cursor.getUTCDate() + 1)
            }
            columns.push(column)
        }
        return columns
    }, [year, xpByDate])

    const cellLabel = (cell: YearCell): string =>
        t("profile.contributions.cellLabel", {
            date: new Date(`${cell.dateStr}T00:00:00Z`).toLocaleDateString(locale),
            xp: cell.xp,
        })

    return (
        <LabeledCard
            label={t("profile.contributions.title")}
            icon={<FireIcon className="size-5 text-accent" weight="fill" aria-hidden focusable="false" />}
            action={(
                <div className="flex items-center gap-1.5" aria-label={t("profile.contributions.yearAria")}>
                    {years.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setYear(option)}
                            aria-pressed={option === year}
                            className={cn(
                                "rounded-medium px-1.5 py-0.5 text-xs transition-colors",
                                option === year
                                    ? "bg-accent/15 text-accent"
                                    : "text-muted hover:text-foreground",
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        >
            <AsyncContent
                isLoading={activitySwr.isLoading && !activitySwr.data}
                skeleton={(
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-4 shrink-0 rounded-full" />
                            <Skeleton.Typography type="body-sm" width="1/2" />
                        </div>
                    </div>
                )}
                error={!activitySwr.data ? activitySwr.error : undefined}
                errorContent={{
                    title: t("profile.contributions.loadError"),
                    onRetry: () => void activitySwr.mutate(),
                    retryLabel: t("profile.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    <div className="overflow-x-auto">
                        <div className="flex gap-[3px]" role="grid">
                            {weeks.map((column, columnIndex) => (
                                <div key={columnIndex} role="row" className="flex flex-col gap-[3px]">
                                    {column.map((cell) => {
                                        const shaded = cell.inYear && !cell.isFuture
                                        const label = shaded ? cellLabel(cell) : undefined
                                        return (
                                            <span
                                                key={cell.dateStr}
                                                role="gridcell"
                                                aria-label={label}
                                                title={label}
                                                className={cn(
                                                    "size-3 shrink-0 rounded-sm",
                                                    shaded ? XP_LEVEL_CLASS[xpLevel(cell.xp)] : "bg-transparent",
                                                )}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* legend: Less → More */}
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted">
                        <span>{t("dashboard.contributions.less")}</span>
                        {XP_LEVEL_CLASS.map((levelClass, index) => (
                            <span key={index} className={cn("size-3 shrink-0 rounded-sm", levelClass)} />
                        ))}
                        <span>{t("dashboard.contributions.more")}</span>
                    </div>

                    {/* streak line — current + longest, from the real streak endpoint */}
                    <div className="flex items-center gap-2">
                        <FireIcon aria-hidden focusable="false" className="size-5 text-accent" />
                        <Typography type="body-sm" weight="medium">
                            {t("profile.contributions.streakLine", {
                                streak: streakSwr.data?.currentStreak ?? 0,
                                longest: streakSwr.data?.longestStreak ?? 0,
                            })}
                        </Typography>
                    </div>
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
