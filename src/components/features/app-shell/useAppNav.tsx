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
    ChartBarIcon,
    KanbanIcon,
    RobotIcon,
    SparkleIcon,
    BriefcaseIcon,
    NewspaperIcon,
    SquaresFourIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"

/** One nested feature link inside a top-level module dropdown / drawer group. */
export interface AppNavChild {
    /** i18n key under `nav.` (also the stable React key). */
    key: string
    label: string
    icon: React.ReactNode
    path: string
    /** Prefix-match on the child's own path. */
    isActive: boolean
}

/** One of the four top-level header modules (Home has no children). */
export interface AppNavModule {
    key: "home" | "workplace" | "course" | "community"
    label: string
    icon: React.ReactNode
    /** Destination when the module label itself is clicked. */
    path: string
    /** OR(children active) ∪ prefix(own path); Home only on the exact home path. */
    isActive: boolean
    /** Nested feature links (empty for Home — plain link, no dropdown). */
    children: Array<AppNavChild>
}

/**
 * The single source of the app's primary navigation — exactly four top-level
 * modules (Home · Workplace · Course · Community), each carrying its nested
 * feature links. Consumed by the desktop `HeaderNav` (module links + caret
 * dropdowns) AND the Navbar mobile drawer (Home row + accordion groups) so the
 * two surfaces never drift. Personal/system destinations (Activity, Wallet,
 * Integrations, Roles) live in the Account menu; Search lives in the header's
 * right cluster (Ctrl/Cmd+K) — neither belongs to a module here.
 *
 * Paths are built locale-less via `pathConfig().locale()` because `@/i18n/navigation`
 * strips the locale from `usePathname` and re-adds it on `router.push`.
 */
export const useAppNav = (): Array<AppNavModule> => {
    const t = useTranslations("nav")
    const pathname = usePathname()

    return useMemo(() => {
        const p = pathConfig().locale()
        const home = p.build()

        // active when on the route itself or any child (base + "/") — but NOT "/" as a
        // prefix (it prefixes everything), so home matches only its exact path.
        const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
        const child = (key: string, path: string, icon: React.ReactNode): AppNavChild => ({
            key,
            label: t(key),
            icon,
            path,
            isActive: under(path),
        })
        const makeModule = (
            key: AppNavModule["key"],
            path: string,
            icon: React.ReactNode,
            children: Array<AppNavChild>,
        ): AppNavModule => ({
            key,
            label: t(key),
            icon,
            path,
            isActive: children.some((item) => item.isActive) || under(path),
            children,
        })

        return [
            {
                key: "home",
                label: t("home"),
                icon: <HouseIcon className="size-5" />,
                path: home,
                isActive: pathname === "/" || pathname === home,
                children: [],
            },
            makeModule("workplace", p.subjects().build(), <SquaresFourIcon className="size-5" />, [
                child("subjects", p.subjects().build(), <BookOpenIcon className="size-5" />),
                child("resources", p.resources().build(), <FolderIcon className="size-5" />),
                child("challenges", p.challenges().build(), <TrophyIcon className="size-5" />),
                child("leaderboard", p.leaderboard().build(), <RankingIcon className="size-5" />),
                child("ai", p.ai().build(), <RobotIcon className="size-5" />),
                child("workflow", p.workflow().build(), <KanbanIcon className="size-5" />),
                child("analytics", p.analytics().build(), <ChartBarIcon className="size-5" />),
                child("career", p.career().build(), <BriefcaseIcon className="size-5" />),
            ]),
            makeModule("course", p.course().build(), <GraduationCapIcon className="size-5" />, [
                child("catalog", p.course().build(), <GraduationCapIcon className="size-5" />),
                child("marketplace", p.marketplace().build(), <StorefrontIcon className="size-5" />),
                child("recommendations", p.recommendations().build(), <SparkleIcon className="size-5" />),
            ]),
            makeModule("community", p.community().build(), <ChatCircleIcon className="size-5" />, [
                child("feed", p.community().build(), <NewspaperIcon className="size-5" />),
                child("groups", p.groups().build(), <UsersThreeIcon className="size-5" />),
                child("events", p.events().build(), <CalendarIcon className="size-5" />),
                child("chat", p.chat().build(), <ChatsCircleIcon className="size-5" />),
            ]),
        ]
    }, [pathname, t])
}
