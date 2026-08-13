"use client"

import React from "react"
import { cn, Tabs } from "@heroui/react"
import {
    HouseIcon,
    CompassIcon,
    GraduationCapIcon,
    BookmarkSimpleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { DASHBOARD_TABS } from "../types"
import type { DashboardTab } from "../types"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useDashboardTabStore } from "@/hooks/zustand/dashboardTab/store"

/**
 * Leading icon shown on each dashboard tab, keyed by tab id. The icon follows the
 * label, not the id: "community" is labelled "my resource", so it carries a bookmark
 * (saved material) rather than a trophy (leaderboard, its earlier framing).
 */
const TAB_ICONS: Record<DashboardTab, typeof HouseIcon> = {
    overview: HouseIcon,
    explore: CompassIcon,
    courses: GraduationCapIcon,
    community: BookmarkSimpleIcon,
}

/** Props for {@link DashboardTabsBar}. */
export type DashboardTabsBarProps = WithClassNames<undefined>

/**
 * Full-width dashboard tab strip. Registered as the global Navbar's bottom layer
 * (see `useRegisterNavbarBottomLayer`), so the Navbar renders it flush under its
 * primary row and owns the single bottom border + sticky — this strip deliberately
 * carries no border, sticky, z-index or background of its own, only the horizontal
 * padding that lines it up with the dashboard body. The open tab lives in the shared
 * store, so the strip and the panels stay in sync without prop-drilling across the
 * Navbar/page boundary. Mobile shows the icon only; the label appears from `md` up,
 * with an `sr-only` twin keeping the tab's accessible name at every width.
 *
 * @param props - optional root class name (placement only)
 */
export const DashboardTabsBar = ({ className }: DashboardTabsBarProps) => {
    const t = useTranslations()
    const tab = useDashboardTabStore((state) => state.tab)
    const setTab = useDashboardTabStore((state) => state.setTab)

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
                                const label = t(`dashboard.tabs.${tabId}`)
                                return (
                                    <Tabs.Tab key={tabId} id={tabId}>
                                        <span className="flex items-center gap-2">
                                            <TabIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-5 shrink-0"
                                            />
                                            {/* visible label from md up… */}
                                            <span className="hidden md:inline">
                                                {label}
                                            </span>
                                            {/* …and its screen-reader twin below md, so an
                                                icon-only tab is never left without a name */}
                                            <span className="sr-only md:hidden">
                                                {label}
                                            </span>
                                        </span>
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
