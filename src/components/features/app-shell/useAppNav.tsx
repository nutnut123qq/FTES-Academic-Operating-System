"use client"

import React, { useMemo } from "react"
import {
    HouseIcon,
    GraduationCapIcon,
    ChatCircleIcon,
    SquaresFourIcon,
    RankingIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"

/**
 * One of the top-level header modules, rendered as a PLAIN LABEL LINK.
 * Per product directive (design D9), the header carries no dropdowns/sub-menus,
 * so a module no longer exposes any nested `children` — nested features are
 * reached from inside each module's own landing page.
 */
export interface AppNavModule {
    key: "home" | "workplace" | "course" | "community" | "leaderboard"
    label: string
    icon: React.ReactNode
    /** Destination when the module label is clicked (its landing route). */
    path: string
    /**
     * prefix(own path); Home only on the exact home path; Community also matches
     * its alias routes `/groups`, `/events`, `/blog`.
     */
    isActive: boolean
}

/**
 * The single source of the app's primary navigation — the top-level modules
 * (Home · Workplace · Course · Community · Leaderboard), each a PLAIN LABEL LINK to
 * its landing route. Consumed by the desktop {@link "../navbar/Navbar/HeaderNav"}
 * and the Navbar mobile drawer so the two surfaces never drift. The header does
 * NOT render sub-menus; nested features (resources, challenges, groups, events,
 * feed) live inside each module's landing page.
 * `/ai` is entered from the floating mascot panel, and personal/system
 * destinations live in the Account menu — none belong to a module here.
 *
 * Blog swapped out of the header for Leaderboard (2026-08-19): `/blog` is still a
 * live route, reached from the Community page's left rail
 * ({@link "../community/CommunityShell/NavRail"}) instead of the top bar.
 *
 * DEBT — routes this comment used to claim were reachable "inside a module" but
 * that have NO entry point anywhere today (verified: zero non-test callers of the
 * path builders): `/workflow`, `/marketplace`, `/chat`, `/recommendations`,
 * `/activity`, `/integrations`. Keep or delete is still an open product call;
 * do not read this list as "they live under some module".
 *
 * Paths are built locale-less via `pathConfig().locale()` because `@/i18n/navigation`
 * strips the locale from `usePathname` and re-adds it on `router.push`.
 */
export const useAppNav = (): Array<AppNavModule> => {
    const t = useTranslations("nav")
    const pathname = usePathname()

    return useMemo(() => {
        const p = pathConfig().locale()
        // `/home` — đường tường minh của trang chủ. Lý do lịch sử (#243): gốc locale từng
        // render `<HomeLanding redirectSignedIn />` nên bấm Home là bị ném sang dashboard,
        // và `/home` là lối duy nhất còn xem được landing. Chốt đó đã gỡ hẳn 2026-08-21
        // (xem docblock `HomeLanding`), giờ `/` và `/home` render y hệt nhau nên nút này
        // trỏ đâu cũng đúng — giữ `/home` vì nó nói rõ ý định hơn.
        const home = p.home().build()

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
            makeModule(
                "community",
                p.community().build(),
                <ChatCircleIcon className="size-5" />,
                // `/groups`, `/events`, `/blog` là bề mặt CỦA cộng đồng (cùng rail
                // trái qua CommunityNavShell) nhưng nằm NGOÀI cây `/community` —
                // thiếu chúng thì đứng ở ba route đó header không sáng mục nào.
                [
                    p.community().build(),
                    p.groups().build(),
                    p.events().build(),
                    p.blog().build(),
                ].some(under),
            ),
            makeModule("leaderboard", p.leaderboard().build(), <RankingIcon className="size-5" />),
        ]
    }, [pathname, t])
}
