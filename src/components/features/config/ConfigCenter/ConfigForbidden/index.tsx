"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { LockIcon } from "@phosphor-icons/react"
import { pathConfig } from "@/resources/path"

/**
 * ConfigForbidden — the 403-style surface shown to anyone who is not a Super
 * Admin (admin/moderator/member/guest). Deliberately NOT a 404: it says the
 * Config Center exists but the viewer lacks the permission. No configuration
 * data is mounted behind it.
 */
export const ConfigForbidden = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 p-6 py-16 text-center">
            <LockIcon aria-hidden focusable="false" className="size-8 text-muted" />
            <div className="flex flex-col gap-2">
                <Typography type="h4" weight="bold">
                    {t("admin.config.forbidden.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("admin.config.forbidden.body")}
                </Typography>
            </div>
            <Button
                variant="secondary"
                onPress={() => router.push(pathConfig().locale(locale).build())}
            >
                {t("admin.config.forbidden.back")}
            </Button>
        </div>
    )
}
