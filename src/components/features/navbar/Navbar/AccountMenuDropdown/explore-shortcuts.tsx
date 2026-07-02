import React from "react"
import {
    NewspaperIcon,
    RobotIcon,
    SparkleIcon,
    TrendUpIcon,
} from "@phosphor-icons/react"
import { pathConfig } from "@/resources/path"

/**
 * One discovery shortcut in the account popup's "Khám phá" (Explore) section —
 * the relocated header discovery entries (see change `app-shell-header-nav`:
 * the header carries plain module links only, so `/ai` and `/recommendations`
 * enter the app from HERE).
 */
export interface ExploreShortcut {
    id: "ai" | "forYou" | "recommendations" | "trending"
    icon: React.ReactNode
    /** Full i18n key of the shortcut label (`profileMenu.explore.*`). */
    labelKey: string
    /** Destination path (locale-less; the proxy re-adds the locale). */
    path: () => string
    /** Guests must sign in first (personalized surface); public ones navigate. */
    authGated: boolean
}

/** The four Explore shortcuts, in display order. Shared by authed + guest menus. */
export const EXPLORE_SHORTCUTS: Array<ExploreShortcut> = [
    {
        id: "ai",
        icon: <RobotIcon className="size-5" aria-hidden focusable="false" />,
        labelKey: "profileMenu.explore.ai",
        path: () => pathConfig().locale().ai().build(),
        authGated: true,
    },
    {
        id: "forYou",
        icon: <NewspaperIcon className="size-5" aria-hidden focusable="false" />,
        labelKey: "profileMenu.explore.forYou",
        path: () => pathConfig().locale().community().build(),
        authGated: false,
    },
    {
        id: "recommendations",
        icon: <SparkleIcon className="size-5" aria-hidden focusable="false" />,
        labelKey: "profileMenu.explore.recommendations",
        path: () => pathConfig().locale().recommendations().build(),
        authGated: true,
    },
    {
        id: "trending",
        icon: <TrendUpIcon className="size-5" aria-hidden focusable="false" />,
        labelKey: "profileMenu.explore.trending",
        path: () => pathConfig().locale().community().trending().build(),
        authGated: false,
    },
]
