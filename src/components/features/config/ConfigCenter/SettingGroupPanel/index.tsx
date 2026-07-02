"use client"

import React from "react"
import { useTranslations } from "next-intl"
import type { ConfigScope, SettingCategory } from "@/resources/constants/config"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ConfigSkeleton } from "../ConfigSkeleton"
import { SettingGroupForm } from "../SettingGroupForm"
import { useQueryConfigGroupSwr } from "../hooks"

/** Props for {@link SettingGroupPanel}. */
export interface SettingGroupPanelProps {
    /** The setting category shown. */
    category: SettingCategory
    /** Active config scope (only `"global"` reaches this panel). */
    scope: ConfigScope
}

/**
 * SettingGroupPanel — loads one category's setting group through the SWR-shaped
 * hook and hands it to {@link SettingGroupForm}, with the standard skeleton /
 * empty / error branches. Keyed by category so a navigation rebuilds the draft.
 */
export const SettingGroupPanel = ({ category, scope }: SettingGroupPanelProps) => {
    const t = useTranslations()
    const swr = useQueryConfigGroupSwr(category, scope)

    return (
        <AsyncContent
            isLoading={!swr.data && !swr.error}
            skeleton={<ConfigSkeleton />}
            error={!swr.data ? swr.error : undefined}
            errorContent={{
                title: t("admin.config.errorTitle"),
                description: t("admin.config.errorBody"),
                onRetry: () => { void swr.mutate() },
                retryLabel: t("admin.config.retry"),
            }}
            isEmpty={swr.data?.fields.length === 0}
            emptyContent={{
                title: t("admin.config.settings.emptyTitle"),
                description: t("admin.config.settings.emptyBody"),
            }}
        >
            {swr.data ? (
                <SettingGroupForm
                    key={swr.data.id}
                    group={swr.data}
                    onSaved={() => swr.mutate()}
                />
            ) : null}
        </AsyncContent>
    )
}
