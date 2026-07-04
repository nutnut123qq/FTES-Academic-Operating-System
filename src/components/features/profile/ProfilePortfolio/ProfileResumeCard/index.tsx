"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { DownloadSimpleIcon, EyeIcon, FileTextIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { MyPortfolioResume } from "../../hooks/useQueryMyPortfolioSwr"

/** Props for {@link ProfileResumeCard}. */
export interface ProfileResumeCardProps extends WithClassNames<undefined> {
    /** The resume document metadata. */
    resume: MyPortfolioResume
}

/**
 * Resume/CV document card for the Portfolio tab. Shows filename, upload date,
 * and View / Download actions. FE-only: the URL comes from mock data.
 */
export const ProfileResumeCard = ({ resume, className }: ProfileResumeCardProps) => {
    const t = useTranslations()
    const uploadedDate = new Date(`${resume.uploadedAt}T00:00:00`).toLocaleDateString()

    return (
        <div
            className={`flex flex-col gap-3 rounded-2xl border border-separator p-4 sm:flex-row sm:items-center sm:gap-4 ${className ?? ""}`}
        >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <FileTextIcon className="size-6" aria-hidden focusable="false" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <Typography type="body-sm" weight="medium" truncate>
                    {resume.filename}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("profile.portfolio.resume.uploaded", { date: uploadedDate })}
                </Typography>
            </div>
            <div className="flex shrink-0 gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                        window.open(resume.url, "_blank", "noreferrer noopener")
                    }}
                >
                    <EyeIcon className="size-4" aria-hidden focusable="false" />
                    {t("profile.portfolio.resume.view")}
                </Button>
                <Button
                    size="sm"
                    variant="primary"
                    onPress={() => {
                        window.open(resume.url, "_blank", "noreferrer noopener")
                    }}
                >
                    <DownloadSimpleIcon className="size-4" aria-hidden focusable="false" />
                    {t("profile.portfolio.resume.download")}
                </Button>
            </div>
        </div>
    )
}
