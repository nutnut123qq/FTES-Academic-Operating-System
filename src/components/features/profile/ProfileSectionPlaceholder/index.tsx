"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link ProfileSectionPlaceholder}. */
interface ProfileSectionPlaceholderProps {
    /** i18n key under `profile.sections.*` naming the section. */
    sectionKey: string
}

/** Placeholder body for a profile section not built yet (keeps tabs navigable). */
export const ProfileSectionPlaceholder = ({ sectionKey }: ProfileSectionPlaceholderProps) => {
    const t = useTranslations("profile")
    return (
        <div className="flex flex-col gap-2">
            <Typography type="h5" weight="bold">
                {t(`sections.${sectionKey}`)}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("placeholder")}
            </Typography>
        </div>
    )
}
