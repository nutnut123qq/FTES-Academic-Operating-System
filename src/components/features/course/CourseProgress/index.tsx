"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryCourseProgressSwr } from "../hooks/useQueryCourseProgressSwr"

/**
 * Course progress + certificate (§4). DEFAULT on-canon layout: an overall progress
 * bar + a completion summary + a certificate stub (enabled at 100%). ponytail:
 * progress bar hand-rolled; mock data; certificate CTA is a no-op.
 */
export const CourseProgress = () => {
    const t = useTranslations("courseSystem")
    const { courseId } = useParams<{ courseId: string }>()
    const { progress } = useQueryCourseProgressSwr(courseId)

    if (!progress) {
        return null
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("progress.title")}
            </Typography>

            {/* progress */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                    <Typography type="body-sm" color="muted">
                        {t("progress.completed", { done: progress.completedLessons, total: progress.totalLessons })}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {progress.percent}%
                    </Typography>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-default/40">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progress.percent}%` }} />
                </div>
            </div>

            {/* certificate */}
            <div className="flex flex-col gap-3 rounded-large border border-separator p-6">
                <Typography type="h6" weight="bold">
                    {t("progress.certificate")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {progress.certificateAvailable ? t("progress.certificateReady") : t("progress.certificateLocked")}
                </Typography>
                <Button
                    variant="secondary"
                    className="self-start"
                    isDisabled={!progress.certificateAvailable}
                >
                    {t("progress.viewCertificate")}
                </Button>
            </div>
        </div>
    )
}
