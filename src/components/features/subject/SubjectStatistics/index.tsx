"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQuerySubjectStatsSwr,
    type SubjectStats,
} from "../hooks/useQuerySubjectStatsSwr"

/**
 * Statistics tab (§3). DEFAULT on-canon layout (no dedicated brainstorm):
 * a metric-card grid (completion / active / resources / avg score) + a top-students
 * ranked list. ponytail: metric cards + rows hand-rolled; mock data.
 */
export const SubjectStatistics = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { stats, isLoading, error, mutate } = useQuerySubjectStatsSwr(subjectId)

    return (
        <div className="flex flex-col gap-6 p-6">
            <Typography type="h5" weight="bold">
                {t("statistics.title")}
            </Typography>

            <AsyncContent
                isLoading={isLoading && !stats}
                skeleton={<StatisticsSkeleton />}
                error={!stats ? error : undefined}
                errorContent={{
                    title: t("statistics.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("statistics.retry"),
                }}
            >
                {stats ? <StatisticsView stats={stats} /> : null}
            </AsyncContent>
        </div>
    )
}

/** Presentation of the loaded statistics. */
const StatisticsView = ({ stats }: { stats: SubjectStats }) => {
    const t = useTranslations("subjects")

    const metrics: Array<{ key: string; value: string }> = [
        { key: "completion", value: `${stats.completionRate}%` },
        { key: "active", value: String(stats.activeStudents) },
        { key: "resources", value: String(stats.resources) },
        { key: "avgScore", value: stats.avgScore.toFixed(1) },
    ]

    return (
        <div className="flex flex-col gap-6">
            {/* metric cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.key} className="flex flex-col gap-0 rounded-2xl bg-default/40 p-4">
                        <Typography type="body-xs" color="muted">
                            {t(`statistics.metrics.${metric.key}`)}
                        </Typography>
                        <Typography type="h4" weight="bold">
                            {metric.value}
                        </Typography>
                    </div>
                ))}
            </div>

            {/* top students */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("statistics.topStudents")}
                </Typography>
                {stats.topStudents.map((student, index) => (
                    <div
                        key={student.id}
                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                    >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                            {index + 1}
                        </div>
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                            {student.name}
                        </Typography>
                        <Chip size="sm" variant="soft" color="accent">
                            {t("statistics.score", { score: student.score })}
                        </Chip>
                    </div>
                ))}
            </div>
        </div>
    )
}

/** Loading skeleton — mirrors the metric-card grid + top-students list. */
const StatisticsSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
            ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-separator pt-6">
            <Skeleton className="h-5 w-40 rounded-sm" />
            {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-[60px] w-full rounded-2xl" />
            ))}
        </div>
    </div>
)
