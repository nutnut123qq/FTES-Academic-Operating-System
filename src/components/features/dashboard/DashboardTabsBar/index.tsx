"use client"

import React from "react"
import { cn, Tabs } from "@heroui/react"
import {
    HouseIcon,
    CompassIcon,
    GraduationCapIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { DASHBOARD_TABS } from "../types"
import type { DashboardTab } from "../types"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useDashboardTabStore } from "@/hooks/zustand/dashboardTab/store"

/** Leading icon shown on each dashboard tab, keyed by tab id. */
const TAB_ICONS: Record<DashboardTab, typeof HouseIcon> = {
    overview: HouseIcon,
    explore: CompassIcon,
    courses: GraduationCapIcon,
    community: TrophyIcon,
}

/** Props for {@link DashboardTabsBar}. */
export type DashboardTabsBarProps = WithClassNames<undefined>

/**
 * Full-width dashboard tab strip (mirror of the profile page's `ProfileTabsBar`).
 * Registered as the global Navbar's bottom layer ({@link useRegisterNavbarBottomLayer}),
 * so the Navbar renders it flush under its primary row and owns the single bottom
 * border + sticky — this strip carries none of its own. Native HeroUI secondary
 * Tabs (foreground text + accent underline); the open tab lives in the shared
 * store so panels stay in sync. Mobile = icon only; label shows from `md` up.
 * @param props - optional root class name (placement only)
 */
export const DashboardTabsBar = ({ className }: DashboardTabsBarProps) => {
    const t = useTranslations()
    const { tab, setTab } = useDashboardTabStore()

    return (
        <div className={cn("w-full", className)}>
            <div className="w-full px-6">
                <ExtendedTabs
                    selectedKey={tab}
                    onSelectionChange={(key) => setTab(key as DashboardTab)}
                >
                    <Tabs.ListContainer>
                        <Tabs.List aria-label={t("dashboard.title")}>
                            {DASHBOARD_TABS.map((tabId) => {
                                const TabIcon = TAB_ICONS[tabId]
                                return (
                                    <Tabs.Tab
                                        key={tabId}
                                        id={tabId}
                                        aria-controls={`dashboard-panel-${tabId}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <TabIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-5 shrink-0"
                                            />
                                            <span className="hidden md:inline">
                                                {t(`dashboard.tabs.${tabId}`)}
                                            </span>
                                        </span>
                                        <Tabs.Indicator />
                                    </Tabs.Tab>
                                )
                            })}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </ExtendedTabs>
            </div>
        </div>
    )
}
