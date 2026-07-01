"use client"

import React, {
    type Key,
    useCallback,
    useMemo,
} from "react"
import {
    Tabs,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    AI_QUOTA_TAB_LABEL_KEY_MAP,
    AI_QUOTA_TAB_ORDER,
} from "../map"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AiQuotaTab, setAiQuotaTab } from "@/redux/slices/tabs"

/** One tab entry in the AI quota modal tab bar. */
interface AiQuotaTabBarItem {
    /** Tab id stored in Redux (HeroUI tab `id`). */
    key: AiQuotaTab
    /** Localized label. */
    label: string
}

/**
 * AI quota modal tab bar — HeroUI {@link Tabs} synced with {@link AiQuotaTab} in Redux.
 */
export const AiQuotaTabBar = () => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const selectedTab = useAppSelector((state) => state.tabs.aiQuotaTab)

    const tabs = useMemo(
        (): Array<AiQuotaTabBarItem> => AI_QUOTA_TAB_ORDER.map((key) => ({
            key,
            label: t(AI_QUOTA_TAB_LABEL_KEY_MAP[key]),
        })),
        [t],
    )

    const onSelectionChange = useCallback(
        (key: Key) => {
            dispatch(setAiQuotaTab(key as AiQuotaTab))
        },
        [dispatch],
    )

    return (
        <Tabs
            className="w-full"
            selectedKey={selectedTab}
            onSelectionChange={onSelectionChange}
        >
            <Tabs.ListContainer className="w-full">
                <Tabs.List
                    aria-label={t("aiQuota.tabsAria")}
                >
                    {tabs.map(({ key, label }) => (
                        <Tabs.Tab
                            key={key}
                            id={key}
                        >
                            {label}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs.ListContainer>
        </Tabs>
    )
}
