"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { PreferencesSurface } from "@/components/features/notification/PreferencesSurface"

/**
 * NotificationsSection — the "Thông báo" section of settings.
 *
 * Deliberately a THIN host: the preferences UI is the existing
 * {@link PreferencesSurface}, lifted out of the notification centre rather than
 * rebuilt, so both entry points render the same controls off the same SWR key
 * (`NOTIFICATION_PREFERENCES_SWR_KEY`) and can never disagree.
 */
export const NotificationsSection = () => {
    const t = useTranslations()

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("profileSettings.items.notifications")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("notifications.preferences.subtitle")}
                </Typography>
            </div>
            <PreferencesSurface />
        </section>
    )
}
