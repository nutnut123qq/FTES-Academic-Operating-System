"use client"

import React, { useEffect, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { CaretRightIcon } from "@phosphor-icons/react"
import {
    CONFIG_CATEGORIES,
    CONFIG_CATEGORY_LABEL_KEY,
    MOCK_SESSION_ROLE,
} from "@/resources/constants/config"
import type { ConfigCategory, SettingCategory } from "@/resources/constants/config"
import { useConfigStore } from "@/hooks/zustand/config"
import { pathConfig } from "@/resources/path"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ConfigForbidden } from "./ConfigForbidden"
import { ConfigCategoryNav } from "./ConfigCategoryNav"
import { ScopeSelector } from "./ScopeSelector"
import { FeatureFlagsPanel } from "./FeatureFlagsPanel"
import { SettingGroupPanel } from "./SettingGroupPanel"
import { DirtyGuardModal } from "./DirtyGuardModal"

/**
 * ConfigCenter — the `/admin/config/[category]` flagship config surface of the
 * admin console (§22 System Configuration + §24 Feature Flags / Configuration
 * Center). Super Admin gated: the role guard runs BEFORE any config content or
 * store mounts; everyone else gets the 403-style {@link ConfigForbidden}.
 */
export const ConfigCenter = () => {
    // guard first — no config data (store/SWR) mounts for non-Super-Admins
    if (MOCK_SESSION_ROLE !== "superAdmin") {
        return <ConfigForbidden />
    }
    return <ConfigCenterContent />
}

/**
 * The gated shell: breadcrumb + title + scope selector on top, the category nav
 * beside the active panel below. Owns category routing so the unsaved-changes
 * guard can intercept internal navigation.
 */
const ConfigCenterContent = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const params = useParams<{ category: string }>()
    const scope = useConfigStore((state) => state.scope)
    const dirtyCategory = useConfigStore((state) => state.dirtyCategory)
    const setDirtyCategory = useConfigStore((state) => state.setDirtyCategory)
    // category navigation blocked by the dirty-guard, waiting for a decision
    const [pendingCategory, setPendingCategory] = useState<ConfigCategory | null>(null)

    // hydrate the persisted mock DB after mount (skipHydration avoids SSR mismatch)
    useEffect(() => {
        void useConfigStore.persist.rehydrate()
    }, [])

    // unknown segment → treat as the default category
    const active: ConfigCategory = (CONFIG_CATEGORIES as ReadonlyArray<string>).includes(
        params.category,
    )
        ? (params.category as ConfigCategory)
        : "general"

    /** Route to a category — intercepted by the dirty-guard while a form is dirty. */
    const onNavigate = (category: ConfigCategory) => {
        if (category === active) return
        if (dirtyCategory !== null) {
            setPendingCategory(category)
            return
        }
        router.push(pathConfig().locale(locale).adminConfig(category).build())
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* breadcrumb + title + scope selector (static chrome — outside any skeleton) */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                    {t("admin.config.breadcrumbAdmin")}
                    <CaretRightIcon aria-hidden focusable="false" className="size-3" />
                    {t("admin.config.title")}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-0">
                        <Typography type="h4" weight="bold">
                            {t("admin.config.title")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("admin.config.subtitle")}
                        </Typography>
                    </div>
                    <ScopeSelector />
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[220px_1fr]">
                <ConfigCategoryNav active={active} onNavigate={onNavigate} />
                <section aria-label={t(CONFIG_CATEGORY_LABEL_KEY[active])}>
                    {scope !== "global" ? (
                        // per-env scoping is a DEFERRED stub — no data, no saving
                        <EmptyContent
                            title={t("admin.config.scope.comingSoonTitle")}
                            description={t("admin.config.scope.comingSoonBody")}
                        />
                    ) : active === "feature-flags" ? (
                        <FeatureFlagsPanel scope={scope} />
                    ) : (
                        <SettingGroupPanel category={active as SettingCategory} scope={scope} />
                    )}
                </section>
            </div>

            <DirtyGuardModal
                isOpen={pendingCategory !== null}
                onStay={() => setPendingCategory(null)}
                onLeave={() => {
                    const target = pendingCategory
                    setPendingCategory(null)
                    setDirtyCategory(null)
                    if (target) {
                        router.push(pathConfig().locale(locale).adminConfig(target).build())
                    }
                }}
            />
        </div>
    )
}
