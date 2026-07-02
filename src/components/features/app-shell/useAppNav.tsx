"use client"

import React, { useMemo } from "react"
import {
    HouseIcon,
    BookOpenIcon,
    GraduationCapIcon,
    FolderIcon,
    ChatCircleIcon,
    UsersThreeIcon,
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
 * domains grouped for the shell. Consumed by BOTH `AppSidebar` (desktop rail) and
 * the Navbar mobile drawer so the two never drift.
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
        const subjects = p.subjects().build()
        const courses = p.course().build()
        const resources = p.resources().build()
        const community = p.community().build()
        const groups = p.groups().build()

        // active when on the route itself or any child (base + "/") — but NOT "/" as a
        // prefix (it prefixes everything), so home matches only its exact path.
        const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`)

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
                    {
                        key: "subjects",
                        label: t("subjects"),
                        icon: <BookOpenIcon className="size-5" />,
                        path: subjects,
                        isActive: under(subjects),
                    },
                    {
                        key: "courses",
                        label: t("courses"),
                        icon: <GraduationCapIcon className="size-5" />,
                        path: courses,
                        isActive: under(courses),
                    },
                    {
                        key: "resources",
                        label: t("resources"),
                        icon: <FolderIcon className="size-5" />,
                        path: resources,
                        isActive: under(resources),
                    },
                ],
            },
            {
                key: "community",
                label: t("section.community"),
                items: [
                    {
                        key: "community",
                        label: t("community"),
                        icon: <ChatCircleIcon className="size-5" />,
                        path: community,
                        isActive: under(community),
                    },
                    {
                        key: "groups",
                        label: t("groups"),
                        icon: <UsersThreeIcon className="size-5" />,
                        path: groups,
                        isActive: under(groups),
                    },
                ],
            },
        ]
    }, [pathname, t])
}
