"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Link,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import { useAiQuotaOverlayState } from "@/hooks/zustand/overlay/hooks"
import { pathConfig } from "@/resources/path"

/**
 * Link to the full AI usage / quota page (`/profile/ai-usage`).
 * Closes the quota modal before navigating.
 */
export const AiQuotaFullConfigLink = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { setOpen } = useAiQuotaOverlayState()

    const href = useMemo(
        () => pathConfig()
            .locale(locale)
            .profile()
            .aiUsage()
            .build(),
        [
            locale,
        ],
    )

    const onPress = useCallback(() => {
        setOpen(false)
        router.push(href)
    }, [
        setOpen,
        router,
        href,
    ])

    return (
        <Link
            className="self-start text-sm text-muted"
            onPress={onPress}
        >
            {t("aiQuota.viewDetails")}
        </Link>
    )
}
