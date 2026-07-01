"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link SubjectTabPlaceholder}. */
interface SubjectTabPlaceholderProps {
    /** i18n key under `subjects.nav.*` naming the area (e.g. `learning`). */
    areaKey: string
}

/**
 * Placeholder body for a workspace tab that isn't built yet. Keeps the sidebar
 * navigable without 404s; each area gets its real layout later (own brainstorm).
 *
 * @param props - {@link SubjectTabPlaceholderProps}
 */
export const SubjectTabPlaceholder = ({ areaKey }: SubjectTabPlaceholderProps) => {
    const t = useTranslations("subjects")
    return (
        <div className="flex flex-col gap-2 p-6">
            <Typography type="h5" weight="bold">
                {t(`nav.${areaKey}`)}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("placeholder")}
            </Typography>
        </div>
    )
}
