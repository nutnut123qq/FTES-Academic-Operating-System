"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { DevicesSection } from "@/components/features/profile/Settings/SecuritySection/DevicesSection"
import { LoginHistorySection } from "@/components/features/profile/Settings/SecuritySection/LoginHistorySection"

/**
 * `/profile/settings/sessions` — Manage logged-in devices and sign-in activity history.
 */
const Page = () => {
    const t = useTranslations("sessions")

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <DevicesSection />
            <LoginHistorySection />
        </section>
    )
}

export default Page
