"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link CommunityScopePlaceholder}. */
interface CommunityScopePlaceholderProps {
    /** i18n key under `communityHub.tabs.*` naming the scope. */
    scopeKey: string
}

/** Placeholder body for a community scope not built yet (keeps tabs navigable). */
export const CommunityScopePlaceholder = ({ scopeKey }: CommunityScopePlaceholderProps) => {
    const t = useTranslations("communityHub")
    return (
        <div className="flex flex-col gap-2">
            <Typography type="h6" weight="bold">
                {t(`tabs.${scopeKey}`)}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("placeholder")}
            </Typography>
        </div>
    )
}
