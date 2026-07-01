"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    useDashboardTabUrlSync,
} from "./hooks/useDashboardTabUrlSync"
import {
    DashboardTabsBar,
} from "./DashboardTabsBar"
import {
    DashboardIdentity,
} from "./DashboardIdentity"
import {
    OverviewTab,
} from "./OverviewTab"
import {
    ExploreTab,
} from "./ExploreTab"
import {
    CoursesTab,
} from "./CoursesTab"
import {
    CommunityTab,
} from "./CommunityTab"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useDashboardTabStore } from "@/hooks/zustand/dashboardTab/store"
import { useRegisterNavbarBottomLayer } from "@/hooks/zustand/navbarBottomLayer/store"

/** Props for {@link Dashboard}. */
export type DashboardProps = WithClassNames<undefined>

/**
 * Logged-in home — rebuilt on the proven PROFILE page layout: a tab strip rendered
 * as the navbar's bottom layer, then a centered 2-column body — left = the viewer's identity +
 * standing (bare, stable across tabs), right = the selected tab's content. Tabs:
 * Overview (cockpit) · Explore (feed) · Courses · Community. The open tab lives in
 * the shared store and mirrors `?tab=` (shareable); only the active panel mounts,
 * so each tab's leaf queries fetch lazily. Mobile stacks the identity then the
 * content (no rail, no drawer). `"use client"` for the tab store + URL sync.
 * @param props - optional className for the root element
 */
export const Dashboard = ({
    className,
}: DashboardProps) => {
    useDashboardTabUrlSync()
    const tab = useDashboardTabStore((state) => state.tab)
    // the dashboard tab strip renders as the global Navbar's bottom layer
    const tabsNode = useMemo(() => <DashboardTabsBar />, [])
    useRegisterNavbarBottomLayer(tabsNode)
    return (
        <div className={cn("flex w-full flex-col", className)}>
            {/* tab strip is registered as the Navbar bottom layer above (not here) */}
            {/* 2-col body (starci concept): left identity BARE, right content cards */}
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-6 md:flex-row md:items-start">
                {/* LEFT: identity + standing, bare, scrolls with the page */}
                <aside className="flex w-full flex-col gap-4 md:w-72 md:shrink-0">
                    <DashboardIdentity />
                </aside>
                {/* RIGHT: the open tab's content (only the active panel mounts) */}
                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {tab === "overview" ? (
                        <div
                            id="dashboard-panel-overview"
                            role="tabpanel"
                            aria-labelledby="overview"
                            className="flex flex-col gap-6"
                        >
                            <OverviewTab />
                        </div>
                    ) : null}
                    {tab === "explore" ? (
                        <div
                            id="dashboard-panel-explore"
                            role="tabpanel"
                            aria-labelledby="explore"
                            className="flex flex-col gap-6"
                        >
                            <ExploreTab />
                        </div>
                    ) : null}
                    {tab === "courses" ? (
                        <div
                            id="dashboard-panel-courses"
                            role="tabpanel"
                            aria-labelledby="courses"
                            className="flex flex-col gap-6"
                        >
                            <CoursesTab />
                        </div>
                    ) : null}
                    {tab === "community" ? (
                        <div
                            id="dashboard-panel-community"
                            role="tabpanel"
                            aria-labelledby="community"
                            className="flex flex-col gap-6"
                        >
                            <CommunityTab />
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}
