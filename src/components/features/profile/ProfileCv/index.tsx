"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CvReviewCore } from "@/components/features/ai-platform/tools/CvReviewTool"

/**
 * CV section of the profile (§2). Reuses the shared {@link CvReviewCore} — the
 * Harvard builder / upload tabs + AI review — inside the profile section column
 * (no AI-tool chrome). The builder loads and persists the caller's saved CV
 * (`GET`/`PUT /career/cv/me`), exports a Harvard PDF, and submits either the saved
 * CV or an uploaded file to the same AI review job.
 */
export const ProfileCv = () => {
    const t = useTranslations("profile.cv")

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Typography type="h6" weight="semibold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("description")}
                </Typography>
            </div>
            <CvReviewCore />
        </div>
    )
}
