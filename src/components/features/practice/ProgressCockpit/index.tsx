"use client"

import React from "react"
import {
    Label,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { CODING_DIFFICULTY_META } from "../constants"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryUserCodingProgressSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingProgressSwr"
import { useQueryUserCodingRankSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingRankSwr"
import { useQueryUserCodingSkillsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingSkillsSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useAppSelector } from "@/redux/hooks"
import { CodingDifficulty } from "@/modules/api/graphql/queries/types/coding"

/** Props for {@link ProgressCockpit}. */
export type ProgressCockpitProps = WithClassNames<undefined>

/** Difficulty order for the distribution SegmentBar (easy → hard). */
const COCKPIT_DIFFICULTY: ReadonlyArray<CodingDifficulty> = [
    CodingDifficulty.Easy,
    CodingDifficulty.Medium,
    CodingDifficulty.Hard,
]

/**
 * The practice cockpit — the signed-in user's coding standing at a glance, built
 * from the SAME blocks as the profile Coding tab: a {@link MetricCard} row
 * (solved · points · rank · percentile, the last two hidden when unranked) over a
 * difficulty {@link SegmentBar} (easy/medium/hard solved counts, coding 3-tone
 * scale). Self-contained: reads the signed-in user id from the store and drives
 * its own SWR. Hides entirely for anonymous viewers (no user id → empty cockpit).
 *
 * @param props - optional className for the root element.
 */
export const ProgressCockpit = ({
    className,
}: ProgressCockpitProps) => {
    const t = useTranslations()
    // signed-in user id — the rank/skills queries key off it (null when anonymous)
    const userId = useAppSelector((state) => state.user.user?.id) ?? null

    const {
        data: progress,
        isLoading,
        error,
        mutate,
    } = useQueryUserCodingProgressSwr(userId)
    const { data: skills } = useQueryUserCodingSkillsSwr(userId)
    const { data: standing } = useQueryUserCodingRankSwr(userId)

    const solved = progress?.solvedProblemIds.length ?? 0
    const totalPoints = progress?.totalPoints ?? 0

    // headline metric row; rank + percentile hide when the user is unranked
    const stats: Array<{ key: string; value: React.ReactNode }> = [
        { key: "solved", value: solved },
        { key: "points", value: totalPoints },
    ]
    if (standing?.rank != null) {
        stats.push({ key: "rank", value: `#${standing.rank}` })
    }
    if (standing?.percentile != null) {
        stats.push({ key: "percentile", value: `${standing.percentile}%` })
    }

    // difficulty distribution (easy→hard), coloured by the coding 3-tone scale
    const solvedByDifficulty = new Map((skills?.byDifficulty ?? []).map((item) => [item.key, item.solved]))
    const difficultySegments = COCKPIT_DIFFICULTY
        .filter((difficulty) => (solvedByDifficulty.get(difficulty) ?? 0) > 0)
        .map((difficulty) => ({
            key: difficulty,
            label: t(CODING_DIFFICULTY_META[difficulty].labelKey),
            value: solvedByDifficulty.get(difficulty) ?? 0,
            color: CODING_DIFFICULTY_META[difficulty].color,
        }))

    // first load in flight only when no progress has resolved yet
    const isFirstLoad = !progress && (isLoading || !userId)

    return (
        <AsyncContent
            isLoading={isFirstLoad}
            skeleton={(
                <div className={cn("flex flex-col gap-6", className)}>
                    {/* metric row — solved · points · rank · percentile */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((index) => (
                            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                        ))}
                    </div>
                    {/* difficulty distribution bar */}
                    <div className="flex flex-col gap-2">
                        <Skeleton.Typography type="body-sm" width="1/4" />
                        <Skeleton.SegmentBar legendItems={3} />
                    </div>
                </div>
            )}
            error={error}
            errorContent={{
                title: t("practice.cockpit.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("practice.retry"),
            }}
        >
            <div className={cn("flex flex-col gap-6", className)}>
                {/* headline metric row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map((stat) => (
                        <MetricCard
                            key={stat.key}
                            value={stat.value}
                            label={t(`practice.cockpit.metric.${stat.key}`)}
                        />
                    ))}
                </div>

                {/* difficulty distribution — only when the user has solved something */}
                {difficultySegments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <Label>{t("practice.cockpit.byDifficulty")}</Label>
                        <SegmentBar
                            ariaLabel={t("practice.cockpit.byDifficulty")}
                            segments={difficultySegments}
                        />
                    </div>
                ) : null}
            </div>
        </AsyncContent>
    )
}
