"use client"

import React, { useMemo } from "react"
import {
    HouseIcon,
    BookOpenIcon,
    GraduationCapIcon,
    FolderIcon,
    TrophyIcon,
    ChatCircleIcon,
    UsersThreeIcon,
    CalendarIcon,
    ChatsCircleIcon,
    RankingIcon,
    StorefrontIcon,
    PulseIcon,
    WalletIcon,
    ChartBarIcon,
    KanbanIcon,
    RobotIcon,
    SparkleIcon,
    BriefcaseIcon,
    MagnifyingGlassIcon,
    PlugIcon,
    ShieldIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"

/** One primary-nav row: stable key, visible label, leading icon, target, active-route flag. */
export interface AppNavItem {
    key: string
    label: string
    icon: React.ReactNode
    path: string
    isActive: boolean
}

/** A cluster of nav rows with an optional section label (first/top group has none). */
export interface AppNavGroup {
    key: string
    label?: string
    items: Array<AppNavItem>
}

/**
 * The single source of the app's primary navigation — the built, 200-status
 * domains grouped for the shell. Consumed by the desktop `HeaderNav` (top-bar
 * links + "Explore" mega-menu) AND the Navbar mobile drawer so they never drift.
 *
 * Paths are built locale-less via `pathConfig().locale()` because `@/i18n/navigation`
 * strips the locale from `usePathname` and re-adds it on `router.push`.
 */
export const useAppNav = (): Array<AppNavGroup> => {
    const t = useTranslations("nav")
    const pathname = usePathname()

    return useMemo(() => {
        const p = pathConfig().locale()
        const home = p.build()

        // active when on the route itself or any child (base + "/") — but NOT "/" as a
        // prefix (it prefixes everything), so home matches only its exact path.
        const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
        const item = (key: string, path: string, icon: React.ReactNode): AppNavItem => ({
            key,
            label: t(key),
            icon,
            path,
            isActive: under(path),
        })

        return [
            {
                key: "top",
                items: [
                    {
                        key: "home",
                        label: t("home"),
                        icon: <HouseIcon className="size-5" />,
                        path: home,
                        isActive: pathname === "/" || pathname === home,
                    },
                ],
            },
            {
                key: "learn",
                label: t("section.learn"),
                items: [
                    item("subjects", p.subjects().build(), <BookOpenIcon className="size-5" />),
                    item("courses", p.course().build(), <GraduationCapIcon className="size-5" />),
                    item("resources", p.resources().build(), <FolderIcon className="size-5" />),
                    item("challenges", p.challenges().build(), <TrophyIcon className="size-5" />),
                ],
            },
            {
                key: "community",
                label: t("section.community"),
                items: [
                    item("community", p.community().build(), <ChatCircleIcon className="size-5" />),
                    item("groups", p.groups().build(), <UsersThreeIcon className="size-5" />),
                    item("events", p.events().build(), <CalendarIcon className="size-5" />),
                    item("chat", p.chat().build(), <ChatsCircleIcon className="size-5" />),
                ],
            },
            {
                key: "explore",
                label: t("section.explore"),
                items: [
                    item("ai", p.ai().build(), <RobotIcon className="size-5" />),
                    item("recommendations", p.recommendations().build(), <SparkleIcon className="size-5" />),
                    item("career", p.career().build(), <BriefcaseIcon className="size-5" />),
                    item("leaderboard", p.leaderboard().build(), <RankingIcon className="size-5" />),
                    item("marketplace", p.marketplace().build(), <StorefrontIcon className="size-5" />),
                    item("search", p.search().build(), <MagnifyingGlassIcon className="size-5" />),
                ],
            },
            {
                key: "you",
                label: t("section.you"),
                items: [
                    item("activity", p.activity().build(), <PulseIcon className="size-5" />),
                    item("wallet", p.wallet().build(), <WalletIcon className="size-5" />),
                ],
            },
            {
                key: "system",
                label: t("section.system"),
                items: [
                    item("analytics", p.analytics().build(), <ChartBarIcon className="size-5" />),
                    item("workflow", p.workflow().build(), <KanbanIcon className="size-5" />),
                    item("integrations", p.integrations().build(), <PlugIcon className="size-5" />),
                    item("roles", p.roles().build(), <ShieldIcon className="size-5" />),
                ],
            },
        ]
    }, [pathname, t])
}
