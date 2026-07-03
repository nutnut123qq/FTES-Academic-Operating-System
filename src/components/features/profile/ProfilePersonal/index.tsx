"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryProfilePersonalSwr } from "../hooks/useQueryProfilePersonalSwr"

/**
 * Personal section of the profile (§2). DEFAULT on-canon layout: an "about"
 * block + a list of social links as rows. ponytail: rows hand-rolled, icon-free
 * (label + value); mock data.
 */
export const ProfilePersonal = () => {
    const t = useTranslations("profile")
    const { detail } = useQueryProfilePersonalSwr()

    if (!detail) {
        return null
    }

    return (
        <div className="flex flex-col gap-6">
            {/* about */}
            <div className="flex flex-col gap-2">
                <Typography type="h6" weight="bold">
                    {t("personal.about")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {detail.about}
                </Typography>
            </div>

            {/* social links */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("personal.socials")}
                </Typography>
                {detail.socials.map((social) => (
                    <div
                        key={social.key}
                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                    >
                        <Typography type="body-sm" color="muted" className="w-24 shrink-0">
                            {t(`personal.socialLabels.${social.key}`)}
                        </Typography>
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                            {social.value}
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
