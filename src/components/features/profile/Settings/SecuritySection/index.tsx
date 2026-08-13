"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChangePasswordCard } from "./ChangePasswordCard"
import { TwoFactorCard } from "./TwoFactorCard"
import { SessionsCard } from "./SessionsCard"

/**
 * SecuritySection — the "Bảo mật" block of the settings page (§1 Identity):
 * change password, two-factor authentication and the signed-in sessions the
 * user can log out. Every card writes through the real identity REST endpoints;
 * there is no page-level save button, each card owns its own submit.
 *
 * Changing the account e-mail is deliberately absent: the BE has no
 * self-service endpoint for it (see the task notes) and a dead field would be
 * worse than none. `profile.contactEmail` — editable on `/profile/edit` — is a
 * public contact field, NOT the login identity, so it is not a substitute.
 */
export const SecuritySection = () => {
    const t = useTranslations("security")

    return (
        <section className="flex max-w-xl flex-col gap-6">
            <div className="flex flex-col gap-1">
                <Typography type="h6" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>
            <ChangePasswordCard />
            <TwoFactorCard />
            <SessionsCard />
        </section>
    )
}
