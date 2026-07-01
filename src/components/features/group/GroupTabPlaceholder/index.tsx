"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link GroupTabPlaceholder}. */
interface GroupTabPlaceholderProps {
    /** i18n key under `groupsHub.tabs.*` naming the tab. */
    tabKey: string
}

/** Placeholder body for a group tab not built yet (keeps tabs navigable). */
export const GroupTabPlaceholder = ({ tabKey }: GroupTabPlaceholderProps) => {
    const t = useTranslations("groupsHub")
    return (
        <div className="flex flex-col gap-2">
            <Typography type="h6" weight="bold">
                {t(`tabs.${tabKey}`)}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("placeholder")}
            </Typography>
        </div>
    )
}
