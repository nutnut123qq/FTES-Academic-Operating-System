"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQuerySubjectStatsSwr } from "../hooks/useQuerySubjectStatsSwr"

/**
 * Statistics tab (§3). DEFAULT on-canon layout (no dedicated brainstorm):
 * a metric-card grid (completion / active / resources / avg score) + a top-students
 * ranked list. ponytail: metric cards + rows hand-rolled; mock data.
 */
export const SubjectStatistics = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { stats } = useQuerySubjectStatsSwr(subjectId)

    if (!stats) {
        return null
    }

    const metrics: Array<{ key: string; value: string }> = [
        { key: "completion", value: `${stats.completionRate}%` },
        { key: "active", value: String(stats.activeStudents) },
        { key: "resources", value: String(stats.resources) },
        { key: "avgScore", value: stats.avgScore.toFixed(1) },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <Typography type="h5" weight="bold">
                {t("statistics.title")}
            </Typography>

            {/* metric cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.key} className="flex flex-col gap-1 rounded-large bg-default/40 p-4">
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
                        className="flex items-center gap-3 rounded-large border border-separator p-4"
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
