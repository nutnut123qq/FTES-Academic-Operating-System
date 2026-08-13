"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AppearanceSection } from "@/components/features/profile/Settings/AppearanceSection"
import { SecuritySection } from "@/components/features/profile/Settings/SecuritySection"
import { PreferencesSurface } from "@/components/features/notification/NotificationCenter/PreferencesSurface"

/**
 * `/profile/settings` — the account settings hub the account menu's "Cài đặt"
 * entry points at. Rendered standalone (the profile layout skips `ProfileShell`
 * for this segment), one column, three groups stacked in order: appearance →
 * notifications → security.
 *
 * ONE PAGE, not three: `pathConfig` also declares `/settings/security` and
 * `/settings/sessions`, but splitting the groups across sub-routes costs a
 * router shell + nav per group and buys nothing — the three groups are short
 * enough to scan in a single scroll.
 *
 * Appearance and security carry their own headings; the notification group gets
 * its heading here because `PreferencesSurface` is shared with `/notifications`
 * (where its in-card title is the whole heading) and must not be restyled for
 * this page.
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

            <section className="flex max-w-xl flex-col gap-6">
                <Typography type="h6" weight="bold">
                    {t("settings.groups.notifications")}
                </Typography>
                <PreferencesSurface />
            </section>

            <SecuritySection />
        </div>
    )
}

export default SettingsPage
