"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AppearanceSection } from "@/components/features/profile/Settings/AppearanceSection"

/**
 * `/profile/settings` — the account settings hub the account menu's "Cài đặt"
 * entry points at. Renders inside `ProfileShell` (same frame as `/profile/edit`).
 * Currently holds a single block, Appearance — the rest of the settings tree
 * declared in `pathConfig` (security, sessions, ai-settings…) has no surface yet
 * and is deliberately NOT listed here as dead links.
 */
const SettingsPage = () => {
    const t = useTranslations()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <Typography type="h5" weight="bold">
                    {t("profileSettings.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("profileSettings.subtitle")}
                </Typography>
            </div>
            <AppearanceSection />
        </div>
    )
}

export default SettingsPage
