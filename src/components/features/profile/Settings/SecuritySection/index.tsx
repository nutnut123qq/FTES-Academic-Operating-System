"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChangePasswordSection } from "./ChangePasswordSection"
import { TwoFactorSection } from "./TwoFactorSection"
import { DevicesSection } from "./DevicesSection"
import { LoginHistorySection } from "./LoginHistorySection"

/**
 * SecuritySection — the "Bảo mật" section of settings, in the order a learner reasons
 * about their account: the password, then the second factor, then where they are signed
 * in, then what has been happening.
 *
 * Every part is a data owner in its own right (each on its own SWR key), so a backend
 * that cannot answer one of them degrades that card alone instead of blanking the page.
 */
export const SecuritySection = () => {
    const t = useTranslations()

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("security.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("security.sectionSubtitle")}
                </Typography>
            </div>

            <ChangePasswordSection />
            <TwoFactorSection />
            <DevicesSection />
            <LoginHistorySection />
        </section>
    )
}
