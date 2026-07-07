"use client"

import React, { useMemo } from "react"
import {
    HouseIcon,
    GraduationCapIcon,
    ChatCircleIcon,
    SquaresFourIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"

/**
 * One of the four top-level header modules, rendered as a PLAIN LABEL LINK.
 * Per product directive (design D9), the header carries no dropdowns/sub-menus,
 * so a module no longer exposes any nested `children` — nested features are
 * reached from inside each module's own landing page.
 */
export interface AppNavModule {
    key: "home" | "workplace" | "course" | "community"
    label: string
    icon: React.ReactNode
    /** Destination when the module label is clicked (its landing route). */
    path: string
    /** prefix(own path); Home only on the exact home path. */
    isActive: boolean
}

/**
 * The single source of the app's primary navigation — exactly four top-level
 * modules (Home · Workplace · Course · Community), each a PLAIN LABEL LINK to
 * its landing route. Consumed by the desktop {@link "../navbar/Navbar/HeaderNav"}
 * and the Navbar mobile drawer so the two surfaces never drift. The header does
 * NOT render sub-menus; nested features (resources, challenges, leaderboard,
 * workflow, analytics, career, marketplace, groups, events, chat, feed) live
 * inside each module's landing page. Discovery shortcuts (`/ai`,
 * `/recommendations`) live in the profile/avatar popup, and personal/system
 * destinations live in the Account menu — none belong to a module here.
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

        // active when on the route itself or under it (base + "/") — but NOT "/"
        // as a prefix (it prefixes everything), so home matches only its exact path.
        const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
        const makeModule = (
            key: AppNavModule["key"],
            path: string,
            icon: React.ReactNode,
            // Home is active on its exact route only (never as a prefix, since "/"
            // prefixes everything); other modules match their route + descendants.
            isActive: boolean = under(path),
        ): AppNavModule => ({
            key,
            label: t(key),
            icon,
            path,
            isActive,
        })

        return [
            makeModule(
                "home",
                home,
                <HouseIcon className="size-5" />,
                pathname === "/" || pathname === home,
            ),
            makeModule("workplace", p.subjects().build(), <SquaresFourIcon className="size-5" />),
            makeModule("course", p.course().build(), <GraduationCapIcon className="size-5" />),
            makeModule("community", p.community().build(), <ChatCircleIcon className="size-5" />),
        ]
    }, [pathname, t])
}
