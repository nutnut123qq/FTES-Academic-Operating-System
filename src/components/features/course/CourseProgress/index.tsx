"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useQueryCourseProgressSwr } from "../hooks/useQueryCourseProgressSwr"

/**
 * Course progress + certificate (§4). An overall progress bar + a completion
 * summary + the certificate card: at 100% the CTA deep-links to the real
 * auto-issued certificate's public verify page; below 100% it is hidden.
 */
export const CourseProgress = () => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
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

            {/* progress — labelled horizontal status bar (ui-polish-pass) */}
            <ProgressMeter
                value={progress.percent}
                label={t("progress.completed", { done: progress.completedLessons, total: progress.totalLessons })}
                showValue
            />

            {/* certificate */}
            <div className="flex flex-col gap-3 rounded-2xl border border-separator p-6">
                <Typography type="h6" weight="bold">
                    {t("progress.certificate")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {progress.certificateAvailable ? t("progress.certificateReady") : t("progress.certificateLocked")}
                </Typography>
                {progress.certificateAvailable && progress.certificateCode ? (
                    <Button
                        variant="secondary"
                        className="self-start"
                        onPress={() =>
                            router.push(`/certificates/verify/${progress.certificateCode}`)
                        }
                    >
                        {t("progress.viewCertificate")}
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
