"use client"

import React, {
    useCallback,
} from "react"
import type {
    ReactNode,
} from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import type { ResponsiveBreadcrumbItem } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { pathConfig } from "@/resources/path"

/** Props for {@link SettingsBreadcrumb}. */
export interface SettingsBreadcrumbProps {
    /** The current page label — the last, read-only crumb. */
    current: ReactNode
}

/**
 * Shared settings/profile breadcrumb trail: `Home › Hồ sơ › Cài đặt › <current>`
 * (the last crumb is read-only). DRY-replaces the hand-rolled trail every settings
 * page used to repeat, so every page under `/profile/settings/*` shows the same
 * tier-1 breadcrumb. Mirrors the trail the edit/security pages already build.
 *
 * @param props - {@link SettingsBreadcrumbProps}
 */
export const SettingsBreadcrumb = ({
    current,
}: SettingsBreadcrumbProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()

    /** Navigate to the home page (breadcrumb root). */
    const onNavigateHome = useCallback(
        () => router.push(pathConfig().locale().build()),
        [
            router,
        ],
    )
    /** Navigate to the profile (breadcrumb parent). */
    const onNavigateProfile = useCallback(
        () => router.push(pathConfig().locale(locale).profile().build()),
        [
            router,
            locale,
        ],
    )
    /** Navigate to the settings root (breadcrumb parent of every settings page). */
    const onNavigateSettings = useCallback(
        () => router.push(pathConfig().locale(locale).profile().settings().build()),
        [
            router,
            locale,
        ],
    )

    const items: Array<ResponsiveBreadcrumbItem> = [
        { key: "home", label: t("nav.home"), onPress: onNavigateHome },
        { key: "profile", label: t("nav.profile"), onPress: onNavigateProfile },
        { key: "settings", label: t("nav.settings"), onPress: onNavigateSettings },
        { key: "current", label: current },
    ]

    return <ResponsiveBreadcrumb items={items} />
}
