"use client"

import React, {
    useState,
} from "react"
import {
    Tabs,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    WeeklyBoard,
} from "./WeeklyBoard"
import {
    GlobalBoard,
} from "./GlobalBoard"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** The two leaderboard scopes the page can show. */
enum LeagueTab {
    Weekly = "weekly",
    Global = "global",
}

/** Props for {@link League}. */
export type LeagueProps = WithClassNames<undefined>

/**
 * The full leaderboard page behind the dashboard `LeagueCard`'s "see more":
 * two tabs — the weekly-league cohort board ("this week") and the global
 * all-users board ("global"). Each board self-fetches; only the active one
 * mounts (so the inactive query doesn't run). `"use client"` for tab state.
 *
 * @param props - optional className for the root element.
 */
export const League = ({
    className,
}: LeagueProps) => {
    const t = useTranslations()
    const [tab, setTab] = useState<LeagueTab>(LeagueTab.Weekly)

    return (
        <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-6 p-3", className)}>
            <h1 className="text-2xl font-bold text-foreground">
                {t("dashboard.league.pageTitle")}
            </h1>

            <Tabs
                selectedKey={tab}
                variant="secondary"
                onSelectionChange={(key) => setTab(String(key) as LeagueTab)}
            >
                <Tabs.ListContainer>
                    <Tabs.List aria-label={t("dashboard.league.pageTitle")}>
                        <Tabs.Tab
                            key={LeagueTab.Weekly}
                            id={LeagueTab.Weekly}
                            className="rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"
                        >
                            {t("dashboard.league.tabWeekly")}
                        </Tabs.Tab>
                        <Tabs.Tab
                            key={LeagueTab.Global}
                            id={LeagueTab.Global}
                            className="rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"
                        >
                            {t("dashboard.league.tabGlobal")}
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>
            </Tabs>

            {/* only the active board mounts, so the inactive leaf query stays idle */}
            {tab === LeagueTab.Weekly ? (
                <WeeklyBoard />
            ) : (
                <GlobalBoard />
            )}
        </div>
    )
}
