"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { DashboardIdentity } from "./DashboardIdentity"
import { OverviewTab } from "./OverviewTab"

/**
 * Dashboard (§24) — the `/analytics` cockpit, a FAITHFUL PORT of StarCI's dashboard.
 * A centered 2-column body: LEFT = the viewer's identity + standing (bare, no card:
 * profile anchor · standing stats · quick actions), RIGHT = the Overview cockpit —
 * "Tiếp tục học" (resume cards), "Nhiệm vụ hôm nay" (daily quest), "Đà học" (streak
 * strip), "Mục tiêu tuần" (weekly goals), the weekly-challenge event, and the
 * GitHub-style contribution heatmap. Stacks to one column on mobile. Each widget
 * self-fetches its own MOCK leaf query + owns its loading/error states.
 *
 * ponytail: FE-only + mock hooks; swap the hooks for real queries when BE lands.
 * Not ported from StarCI: the Explore/Courses/Community tabs + the navbar
 * bottom-layer tab strip (need FTES tab-store + navbar infra that isn't present).
 */
export const AnalyticsDashboard = () => {
    const t = useTranslations("analytics")

    return (
        <div className="flex w-full flex-col">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6">
                {/* page heading (StarCI surfaces this via the navbar; kept inline here) */}
                <div className="flex flex-col gap-2">
                    <Typography type="h4" weight="bold">
                        {t("overview.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("overview.subtitle")}
                    </Typography>
                </div>

                {/* 2-col body: identity BARE (left), overview cards (right); stacks on mobile */}
                <div className="flex w-full flex-col gap-6 md:flex-row md:items-start">
                    <aside className="flex w-full flex-col gap-4 md:w-72 md:shrink-0">
                        <DashboardIdentity />
                    </aside>
                    <main className="flex min-w-0 flex-1 flex-col gap-6">
                        <OverviewTab />
                    </main>
                </div>
            </div>
        </div>
    )
}
