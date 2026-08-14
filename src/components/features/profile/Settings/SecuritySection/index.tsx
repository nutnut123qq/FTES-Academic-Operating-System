"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChangeEmailSection } from "./ChangeEmailSection"
import { ChangePasswordSection } from "./ChangePasswordSection"
import { TwoFactorSection } from "./TwoFactorSection"

/**
 * SecuritySection — "Bảo mật" section of settings:
 * 1. Email address management
 * 2. Password change (discrete summary card with modal)
 * 3. Two-factor authentication (2FA)
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

            <ChangeEmailSection />
            <ChangePasswordSection />
            <TwoFactorSection />
        </section>
    )
}
